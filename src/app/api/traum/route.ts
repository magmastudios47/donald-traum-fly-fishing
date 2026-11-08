import { NextRequest, NextResponse, connection } from "next/server";
import {
  getArgentinaTodayStr,
  getTraumStore,
  normalizePhoneForComparison,
  runStoreTransaction,
  saveCookieConsentToDb,
  saveTraumStore,
} from "@/lib/store-server";
import {
  buildWhatsAppLink,
  sendCustomRequestNotificationEmail,
  sendDepartureCancelledNotifications,
  sendEnrollmentNotificationEmail,
  sendGuideResponseToRequestEmail,
  sendRegretNotificationEmail,
  sendTestDiagnosticEmail,
} from "@/lib/email-service";
import {
  BlockedDay,
  CalendarDeparture,
  CookieConsentRecord,
  CustomRequestStatus,
  CustomTripRequest,
  DepartureEnrollment,
  EmailLogItem,
  ExperienceModality,
  GalleryImageItem,
  PreferredScheduleType,
  RegretRequestItem,
  ReviewItem,
  ServiceGroupType,
  TraumStoreData,
  WaitlistPromotionAlert,
} from "@/types/traum";

// Límite de envíos por IP (ventana móvil de 60 segundos)
const ipRateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 35;

function checkIpRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = (ipRateLimitMap.get(ip) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );
  if (timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    ipRateLimitMap.set(ip, timestamps);
    return false;
  }
  timestamps.push(now);
  ipRateLimitMap.set(ip, timestamps);
  return true;
}

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "127.0.0.1";
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidDateStr(dateStr: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim());
}

class BusinessRuleError extends Error {
  status: number;
  extra: Record<string, unknown>;
  constructor(
    message: string,
    status = 400,
    extra: Record<string, unknown> = {}
  ) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

export async function GET() {
  await connection();
  const data = await getTraumStore();
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<TraumStoreData>;
    const current = await getTraumStore();

    const updated: TraumStoreData = {
      ...current,
      ...body,
      settings: {
        ...current.settings,
        ...(body.settings || {}),
      },
      siteImages: {
        ...current.siteImages,
        ...(body.siteImages || {}),
      },
      paymentConfig: {
        ...current.paymentConfig,
        ...(body.paymentConfig || {}),
      },
    };

    const saved = await saveTraumStore(updated);
    return NextResponse.json(saved, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "No se pudo actualizar la configuración",
        details: String(error),
      },
      { status: 400 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    // Protección anti-spam (Honeypot)
    if (
      payload.website_hp &&
      String(payload.website_hp).trim().length > 0
    ) {
      return NextResponse.json(
        { error: "Envío bloqueado por filtro anti-spam." },
        { status: 400 }
      );
    }

    // Límite de envíos por IP en endpoints públicos de cliente
    const publicClientActions = [
      "ENROLL_DEPARTURE",
      "CREATE_CUSTOM_REQUEST",
      "INQUIRY",
      "REVIEW",
      "REGRET_REQUEST",
    ];
    if (publicClientActions.includes(String(payload.type))) {
      const ip = getClientIp(request);
      if (!checkIpRateLimit(ip)) {
        return NextResponse.json(
          {
            error:
              "Realizaste demasiados envíos seguidos desde tu conexión. Esperá un minuto e intentá de nuevo.",
          },
          { status: 429 }
        );
      }
    }

    const todayAR = getArgentinaTodayStr();

    // Compatibilidad retroactiva: si viene "INQUIRY" con departureId -> ENROLL_DEPARTURE; sin departureId -> CREATE_CUSTOM_REQUEST
    let actionType = String(payload.type || "");
    if (actionType === "INQUIRY") {
      actionType = payload.departureId
        ? "ENROLL_DEPARTURE"
        : "CREATE_CUSTOM_REQUEST";
    }

    // =========================================================================
    // A) ANOTARSE EN SALIDA PROGRAMADA (ENROLL_DEPARTURE)
    // =========================================================================
    if (actionType === "ENROLL_DEPARTURE") {
      const departureId = String(payload.departureId || "").trim();
      const fullName = String(payload.fullName || "").trim();
      const whatsapp = String(payload.whatsapp || "").trim();
      const email = String(payload.email || "").trim();
      const participantsCount = Math.max(
        1,
        Math.floor(Number(payload.participantsCount) || 1)
      );
      const comments = String(payload.comments || "").trim();
      const acceptWaitlist = Boolean(payload.acceptWaitlist);

      if (!departureId) {
        return NextResponse.json(
          { error: "Seleccioná una salida programada válida." },
          { status: 400 }
        );
      }
      if (fullName.length < 2) {
        return NextResponse.json(
          { error: "Ingresá tu nombre y apellido." },
          { status: 400 }
        );
      }
      const normalizedPhone = normalizePhoneForComparison(whatsapp);
      if (normalizedPhone.length < 6) {
        return NextResponse.json(
          { error: "Ingresá un número de teléfono o WhatsApp válido." },
          { status: 400 }
        );
      }
      if (!isValidEmail(email)) {
        return NextResponse.json(
          { error: "Ingresá un correo electrónico válido." },
          { status: 400 }
        );
      }

      const { store: savedStore, result } = await runStoreTransaction(
        async (current) => {
          const dep = (current.departures || []).find(
            (d) => d.id === departureId
          );
          if (!dep) {
            throw new BusinessRuleError(
              "La salida programada seleccionada no existe.",
              404
            );
          }
          if (dep.status === "cancelada") {
            throw new BusinessRuleError(
              "Esta salida fue cancelada por el guía y no admite nuevas anotaciones.",
              400
            );
          }
          if (dep.date < todayAR) {
            throw new BusinessRuleError(
              "No es posible anotarse en una fecha que ya pasó.",
              400
            );
          }
          const isBlocked = (current.blockedDays || []).some(
            (b) => b.date === dep.date
          );
          if (isBlocked) {
            throw new BusinessRuleError(
              "Este día se encuentra bloqueado por el guía.",
              400
            );
          }

          // Regla: Mismo teléfono + misma salida = no permitir doble anotación
          const duplicateEnrollment = (current.enrollments || []).find(
            (enr) =>
              enr.departureId === departureId &&
              enr.status !== "cancelada" &&
              (enr.normalizedPhone === normalizedPhone ||
                normalizePhoneForComparison(enr.whatsapp) === normalizedPhone)
          );
          if (duplicateEnrollment) {
            throw new BusinessRuleError(
              "Ya tenés una anotación activa con este número de teléfono para esta salida.",
              409,
              { code: "DUPLICATE_ENROLLMENT" }
            );
          }

          // Regla: Cupos disponibles = cupos_totales - personas en anotaciones confirmadas (dentro de transacción)
          const confirmedPeople = (current.enrollments || [])
            .filter(
              (enr) =>
                enr.departureId === departureId && enr.status === "confirmada"
            )
            .reduce((acc, enr) => acc + (Number(enr.participantsCount) || 1), 0);

          const availableSpots = Math.max(
            0,
            dep.maxParticipants - confirmedPeople
          );

          let enrollmentStatus: "confirmada" | "lista_espera" = "confirmada";

          if (availableSpots < participantsCount) {
            if (!acceptWaitlist) {
              throw new BusinessRuleError(
                availableSpots === 0
                  ? "Esta salida tiene los cupos completos. ¿Querés anotarte en la lista de espera?"
                  : `Quedan solo ${availableSpots} cupo(s) disponible(s) y solicitaste ${participantsCount}. ¿Querés anotarte en la lista de espera?`,
                409,
                {
                  code: "WAITLIST_OFFERED",
                  canJoinWaitlist: true,
                  availableSpots,
                  requestedSpots: participantsCount,
                }
              );
            }
            enrollmentStatus = "lista_espera";
          }

          const randomSuffix = Math.floor(1000 + Math.random() * 9000);
          const bookingCode = `TRM-${randomSuffix}`;
          const nowIso = new Date().toISOString();

          const newEnrollment: DepartureEnrollment = {
            id: `enr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            bookingCode,
            departureId,
            fullName,
            whatsapp,
            normalizedPhone,
            email,
            participantsCount,
            comments,
            status: enrollmentStatus,
            createdAt: nowIso,
          };

          const nextStore: TraumStoreData = {
            ...current,
            enrollments: [newEnrollment, ...(current.enrollments || [])],
          };

          return {
            nextStore,
            result: { enrollment: newEnrollment, departure: dep },
          };
        }
      );

      // Enviar notificación por email al cliente y al guía
      const emailRes = await sendEnrollmentNotificationEmail(
        result.enrollment,
        result.departure,
        savedStore.settings
      );

      const finalStore = await saveTraumStore({
        ...savedStore,
        emailLogs: [emailRes.logEntry, ...(savedStore.emailLogs || [])].slice(
          0,
          60
        ),
      });

      return NextResponse.json({
        ok: true,
        enrollment: result.enrollment,
        departure: finalStore.departures.find(
          (d) => d.id === result.departure.id
        ),
        emailSent: emailRes.sent,
        guideEmailSent: emailRes.guideSent,
        clientEmailSent: emailRes.clientSent,
        emailChannel: emailRes.channel,
        emailError: emailRes.errorDetails,
        store: finalStore,
      });
    }

    // =========================================================================
    // B) SOLICITAR SALIDA A PEDIDO (CREATE_CUSTOM_REQUEST)
    // =========================================================================
    if (actionType === "CREATE_CUSTOM_REQUEST") {
      const desiredDate = String(payload.desiredDate || "").trim();
      const preferredSchedule = (payload.preferredSchedule ||
        "Todo el día") as PreferredScheduleType;
      const preferredRiver = String(payload.preferredRiver || "").trim();
      const experienceType = String(
        payload.experienceType || ""
      ).trim() as ExperienceModality | "";
      const participantsCount = Math.max(
        1,
        Math.floor(Number(payload.participantsCount) || 1)
      );
      const fullName = String(payload.fullName || "").trim();
      const whatsapp = String(payload.whatsapp || "").trim();
      const email = String(payload.email || "").trim();
      const comments = String(payload.comments || "").trim();

      if (!isValidDateStr(desiredDate)) {
        return NextResponse.json(
          { error: "Seleccioná una fecha válida (YYYY-MM-DD)." },
          { status: 400 }
        );
      }
      if (desiredDate < todayAR) {
        return NextResponse.json(
          {
            error:
              "No se puede solicitar una salida a pedido en una fecha pasada.",
            code: "PAST_DATE",
          },
          { status: 400 }
        );
      }
      if (fullName.length < 2) {
        return NextResponse.json(
          { error: "Ingresá tu nombre y apellido." },
          { status: 400 }
        );
      }
      const normalizedPhone = normalizePhoneForComparison(whatsapp);
      if (normalizedPhone.length < 6) {
        return NextResponse.json(
          { error: "Ingresá un número de teléfono o WhatsApp válido." },
          { status: 400 }
        );
      }
      if (!isValidEmail(email)) {
        return NextResponse.json(
          { error: "Ingresá un correo electrónico válido." },
          { status: 400 }
        );
      }

      const validSchedules: PreferredScheduleType[] = [
        "Mañana",
        "Tarde",
        "Todo el día",
      ];
      const safeSchedule: PreferredScheduleType = validSchedules.includes(
        preferredSchedule
      )
        ? preferredSchedule
        : "Todo el día";

      const { store: savedStore, result } = await runStoreTransaction(
        async (current) => {
          // Regla: No se puede solicitar salida a pedido en días bloqueados
          const blocked = (current.blockedDays || []).find(
            (b) => b.date === desiredDate
          );
          if (blocked) {
            throw new BusinessRuleError(
              blocked.reason
                ? `Este día no está disponible (${blocked.reason}).`
                : "Este día se encuentra bloqueado por el guía y no admite solicitudes.",
              400,
              { code: "BLOCKED_DAY", reason: blocked.reason }
            );
          }

          // Regla: No se puede solicitar salida a pedido en fechas con salida programada activa
          const activeDeparturesOnDate = (current.departures || []).filter(
            (d) => d.date === desiredDate && d.status !== "cancelada"
          );
          if (activeDeparturesOnDate.length > 0) {
            throw new BusinessRuleError(
              "En esta fecha ya hay una salida programada activa. Podés anotarte directamente en la salida existente.",
              409,
              {
                code: "HAS_SCHEDULED_DEPARTURE",
                existingDepartures: activeDeparturesOnDate,
              }
            );
          }

          // Se permiten varias solicitudes pendientes el mismo día; el guía elige.
          const randomSuffix = Math.floor(1000 + Math.random() * 9000);
          const requestCode = `SOL-${randomSuffix}`;
          const nowIso = new Date().toISOString();

          const newRequest: CustomTripRequest = {
            id: `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            requestCode,
            desiredDate,
            preferredSchedule: safeSchedule,
            preferredRiver: preferredRiver || undefined,
            experienceType: experienceType || undefined,
            participantsCount,
            fullName,
            whatsapp,
            normalizedPhone,
            email,
            comments,
            status: "pendiente",
            createdAt: nowIso,
          };

          const nextStore: TraumStoreData = {
            ...current,
            customRequests: [newRequest, ...(current.customRequests || [])],
          };

          return { nextStore, result: { customRequest: newRequest } };
        }
      );

      const emailRes = await sendCustomRequestNotificationEmail(
        result.customRequest,
        savedStore.settings
      );

      const finalStore = await saveTraumStore({
        ...savedStore,
        emailLogs: [emailRes.logEntry, ...(savedStore.emailLogs || [])].slice(
          0,
          60
        ),
      });

      return NextResponse.json({
        ok: true,
        customRequest: result.customRequest,
        confirmationMessage:
          "El guía te va a contactar para coordinar. No se requiere seña ni pago por este medio.",
        emailSent: emailRes.sent,
        guideEmailSent: emailRes.guideSent,
        clientEmailSent: emailRes.clientSent,
        emailChannel: emailRes.channel,
        emailError: emailRes.errorDetails,
        store: finalStore,
      });
    }

    // =========================================================================
    // C) CANCELAR ANOTACIÓN + AVISO DE LISTA DE ESPERA (CANCEL_ENROLLMENT / CANCEL_INQUIRY)
    // =========================================================================
    if (
      actionType === "CANCEL_ENROLLMENT" ||
      actionType === "CANCEL_INQUIRY"
    ) {
      const enrollmentId = String(
        payload.enrollmentId || payload.inquiryId || ""
      ).trim();
      const deleteRecord = Boolean(payload.deleteRecord);

      const { store: savedStore, result } = await runStoreTransaction(
        async (current) => {
          const targetEnr = (current.enrollments || []).find(
            (e) => e.id === enrollmentId
          );

          // Si era una solicitud personalizada mostrada en inquiries
          if (!targetEnr) {
            const targetReq = (current.customRequests || []).find(
              (r) => r.id === enrollmentId
            );
            if (!targetReq) {
              throw new BusinessRuleError(
                "No se encontró la anotación o solicitud indicada.",
                404
              );
            }
            const nextRequests = deleteRecord
              ? (current.customRequests || []).filter(
                  (r) => r.id !== enrollmentId
                )
              : (current.customRequests || []).map((r) =>
                  r.id === enrollmentId
                    ? { ...r, status: "rechazada" as const }
                    : r
                );
            return {
              nextStore: {
                ...current,
                customRequests: nextRequests,
              },
              result: { waitlistAlert: null as WaitlistPromotionAlert | null },
            };
          }

          const wasConfirmed = targetEnr.status === "confirmada";
          const nowIso = new Date().toISOString();

          const updatedEnrollments = deleteRecord
            ? (current.enrollments || []).filter((e) => e.id !== enrollmentId)
            : (current.enrollments || []).map((e) =>
                e.id === enrollmentId
                  ? {
                      ...e,
                      status: "cancelada" as const,
                      cancelledAt: nowIso,
                      updatedAt: nowIso,
                    }
                  : e
              );

          // Si se cancela una anotación confirmada y hay lista de espera en esa salida,
          // avisar al guía para promover al primero de la lista de espera.
          let waitlistAlert: WaitlistPromotionAlert | null = null;
          const nextAlerts = [...(current.waitlistAlerts || [])];

          if (wasConfirmed) {
            const waitlistQueue = updatedEnrollments
              .filter(
                (e) =>
                  e.departureId === targetEnr.departureId &&
                  e.status === "lista_espera"
              )
              .sort(
                (a, b) =>
                  new Date(a.createdAt).getTime() -
                  new Date(b.createdAt).getTime()
              );

            if (waitlistQueue.length > 0) {
              const firstInLine = waitlistQueue[0];
              const dep = (current.departures || []).find(
                (d) => d.id === targetEnr.departureId
              );
              waitlistAlert = {
                id: `wa-${Date.now()}`,
                departureId: targetEnr.departureId,
                departureDate: dep?.date || "",
                destination: dep?.destination || "Salida programada",
                cancelledEnrollmentName: targetEnr.fullName,
                freedSpots: targetEnr.participantsCount,
                nextWaitlistEnrollmentId: firstInLine.id,
                nextWaitlistName: firstInLine.fullName,
                nextWaitlistPhone: firstInLine.whatsapp,
                nextWaitlistCount: firstInLine.participantsCount,
                createdAt: nowIso,
                resolved: false,
              };
              nextAlerts.unshift(waitlistAlert);
            }
          }

          return {
            nextStore: {
              ...current,
              enrollments: updatedEnrollments,
              waitlistAlerts: nextAlerts,
            },
            result: { waitlistAlert },
          };
        }
      );

      return NextResponse.json({
        ok: true,
        waitlistAlert: result.waitlistAlert,
        store: savedStore,
      });
    }

    // =========================================================================
    // D) PROMOVER DE LISTA DE ESPERA A CONFIRMADA (PROMOTE_WAITLIST)
    // =========================================================================
    if (actionType === "PROMOTE_WAITLIST") {
      const enrollmentId = String(payload.enrollmentId || "").trim();

      const { store: savedStore, result } = await runStoreTransaction(
        async (current) => {
          const targetEnr = (current.enrollments || []).find(
            (e) => e.id === enrollmentId
          );
          if (!targetEnr) {
            throw new BusinessRuleError(
              "No se encontró la anotación en lista de espera.",
              404
            );
          }

          const dep = (current.departures || []).find(
            (d) => d.id === targetEnr.departureId
          );
          if (!dep || dep.status === "cancelada") {
            throw new BusinessRuleError(
              "La salida no se encuentra activa.",
              400
            );
          }

          const confirmedPeople = (current.enrollments || [])
            .filter(
              (e) =>
                e.departureId === dep.id &&
                e.status === "confirmada" &&
                e.id !== enrollmentId
            )
            .reduce((acc, e) => acc + (Number(e.participantsCount) || 1), 0);

          const available = Math.max(0, dep.maxParticipants - confirmedPeople);
          if (available < targetEnr.participantsCount) {
            throw new BusinessRuleError(
              `No hay cupos suficientes para promover esta anotación (requiere ${targetEnr.participantsCount} y hay ${available} disponible/s).`,
              409
            );
          }

          const nowIso = new Date().toISOString();
          const promoted: DepartureEnrollment = {
            ...targetEnr,
            status: "confirmada",
            updatedAt: nowIso,
          };

          const updatedEnrollments = (current.enrollments || []).map((e) =>
            e.id === enrollmentId ? promoted : e
          );

          const updatedAlerts = (current.waitlistAlerts || []).map((a) =>
            a.nextWaitlistEnrollmentId === enrollmentId ||
            a.departureId === dep.id
              ? { ...a, resolved: true }
              : a
          );

          return {
            nextStore: {
              ...current,
              enrollments: updatedEnrollments,
              waitlistAlerts: updatedAlerts,
            },
            result: { enrollment: promoted, departure: dep },
          };
        }
      );

      await sendEnrollmentNotificationEmail(
        result.enrollment,
        result.departure,
        savedStore.settings
      );

      return NextResponse.json({
        ok: true,
        enrollment: result.enrollment,
        store: savedStore,
      });
    }

    // =========================================================================
    // E) AGREGAR ANOTACIÓN MANUAL DESDE EL PANEL DEL GUÍA (ADD_MANUAL_ENROLLMENT)
    // =========================================================================
    if (actionType === "ADD_MANUAL_ENROLLMENT") {
      const departureId = String(payload.departureId || "").trim();
      const fullName = String(payload.fullName || "").trim();
      const whatsapp = String(payload.whatsapp || "").trim();
      const email = String(
        payload.email || "cliente@traumflycast.com"
      ).trim();
      const participantsCount = Math.max(
        1,
        Math.floor(Number(payload.participantsCount) || 1)
      );
      const comments = String(payload.comments || "Anotado manualmente por el guía").trim();

      if (!departureId || !fullName || !whatsapp) {
        return NextResponse.json(
          { error: "Completá nombre y teléfono para agregar al pescador." },
          { status: 400 }
        );
      }

      const normalizedPhone = normalizePhoneForComparison(whatsapp);

      const { store: savedStore, result } = await runStoreTransaction(
        async (current) => {
          const dep = (current.departures || []).find(
            (d) => d.id === departureId
          );
          if (!dep) {
            throw new BusinessRuleError("No se encontró la salida.", 404);
          }

          const duplicate = (current.enrollments || []).find(
            (e) =>
              e.departureId === departureId &&
              e.status !== "cancelada" &&
              e.normalizedPhone === normalizedPhone
          );
          if (duplicate) {
            throw new BusinessRuleError(
              "Ya existe una anotación activa con ese teléfono en esta salida.",
              409
            );
          }

          const confirmedPeople = (current.enrollments || [])
            .filter(
              (e) => e.departureId === departureId && e.status === "confirmada"
            )
            .reduce((acc, e) => acc + (Number(e.participantsCount) || 1), 0);

          const available = Math.max(0, dep.maxParticipants - confirmedPeople);
          const status: "confirmada" | "lista_espera" =
            available >= participantsCount ? "confirmada" : "lista_espera";

          const newEnrollment: DepartureEnrollment = {
            id: `enr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            bookingCode: `TRM-${Math.floor(1000 + Math.random() * 9000)}`,
            departureId,
            fullName,
            whatsapp,
            normalizedPhone,
            email,
            participantsCount,
            comments,
            status,
            createdAt: new Date().toISOString(),
          };

          return {
            nextStore: {
              ...current,
              enrollments: [newEnrollment, ...(current.enrollments || [])],
            },
            result: { enrollment: newEnrollment },
          };
        }
      );

      return NextResponse.json({
        ok: true,
        enrollment: result.enrollment,
        store: savedStore,
      });
    }

    // =========================================================================
    // F) GESTIÓN DE SALIDAS DEL GUÍA: CREAR (CON OPCIÓN RECURRENTE), EDITAR, DUPLICAR, CANCELAR
    // =========================================================================
    if (actionType === "MANAGE_DEPARTURE") {
      const subAction = String(payload.subAction || "CREATE");

      if (subAction === "CREATE" || subAction === "DUPLICATE") {
        const baseDate = String(payload.date || "").trim();
        const startTime = String(payload.startTime || "08:00").trim();
        const endTime = String(payload.endTime || "17:30").trim();
        const destination = String(payload.destination || "").trim();
        const experienceType = (payload.experienceType ||
          "Pesca en balsa") as ExperienceModality;
        const maxParticipants = Math.max(
          1,
          Math.floor(Number(payload.maxParticipants) || 2)
        );
        const additionalInfo = String(payload.additionalInfo || "").trim();
        const repeatMode = String(payload.repeatMode || "none"); // "none" | "daily" | "weekly"
        const repeatCount = Math.min(
          12,
          Math.max(1, Math.floor(Number(payload.repeatCount) || 1))
        );

        if (!isValidDateStr(baseDate) || !destination) {
          return NextResponse.json(
            { error: "Ingresá fecha y río/destino para crear la salida." },
            { status: 400 }
          );
        }

        const datesToCreate: string[] = [baseDate];
        if (repeatMode === "daily" || repeatMode === "weekly") {
          const stepDays = repeatMode === "weekly" ? 7 : 1;
          const [y, m, d] = baseDate.split("-").map(Number);
          for (let i = 1; i < repeatCount; i++) {
            const dt = new Date(Date.UTC(y, m - 1, d + i * stepDays));
            datesToCreate.push(dt.toISOString().split("T")[0]);
          }
        }

        const serviceGroupType: ServiceGroupType =
          maxParticipants === 1
            ? "Salida individual"
            : maxParticipants === 2
            ? "Salida para dos personas"
            : "Salida grupal";

        const { store: savedStore, result } = await runStoreTransaction(
          async (current) => {
            const newDeps: CalendarDeparture[] = datesToCreate.map(
              (dtStr, idx) => ({
                id: `dep-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
                date: dtStr,
                startTime,
                endTime: endTime || undefined,
                destination,
                experienceType,
                serviceGroupType,
                maxParticipants,
                availableSpots: maxParticipants,
                duration: endTime
                  ? `${startTime} a ${endTime} hs`
                  : "Jornada completa",
                additionalInfo:
                  additionalInfo ||
                  "Salida programada con guía habilitado en la cuenca del Neuquén.",
                status: "activa",
                isDemo: false,
              })
            );

            const mergedDeps = [...(current.departures || []), ...newDeps].sort(
              (a, b) => a.date.localeCompare(b.date)
            );

            return {
              nextStore: {
                ...current,
                departures: mergedDeps,
              },
              result: { createdDepartures: newDeps },
            };
          }
        );

        return NextResponse.json({
          ok: true,
          createdDepartures: result.createdDepartures,
          store: savedStore,
        });
      }

      if (subAction === "UPDATE") {
        const departureId = String(payload.departureId || "").trim();
        const { store: savedStore } = await runStoreTransaction(
          async (current) => {
            const updatedDeps = (current.departures || []).map((dep) => {
              if (dep.id !== departureId) return dep;
              return {
                ...dep,
                date: payload.date ? String(payload.date) : dep.date,
                startTime: payload.startTime
                  ? String(payload.startTime)
                  : dep.startTime,
                endTime:
                  payload.endTime !== undefined
                    ? String(payload.endTime)
                    : dep.endTime,
                destination: payload.destination
                  ? String(payload.destination)
                  : dep.destination,
                experienceType:
                  (payload.experienceType as ExperienceModality) ||
                  dep.experienceType,
                maxParticipants: payload.maxParticipants
                  ? Math.max(1, Number(payload.maxParticipants))
                  : dep.maxParticipants,
                additionalInfo:
                  payload.additionalInfo !== undefined
                    ? String(payload.additionalInfo)
                    : dep.additionalInfo,
              };
            });
            return {
              nextStore: { ...current, departures: updatedDeps },
              result: null,
            };
          }
        );

        return NextResponse.json({ ok: true, store: savedStore });
      }

      if (subAction === "CANCEL") {
        const departureId = String(payload.departureId || "").trim();
        const cancelReason = String(
          payload.reason ||
            "Cancelación informada por el guía (condiciones del río / clima)."
        ).trim();

        const { store: savedStore, result } = await runStoreTransaction(
          async (current) => {
            const targetDep = (current.departures || []).find(
              (d) => d.id === departureId
            );
            if (!targetDep) {
              throw new BusinessRuleError(
                "No se encontró la salida a cancelar.",
                404
              );
            }

            const affectedEnrollments = (current.enrollments || []).filter(
              (e) =>
                e.departureId === departureId && e.status !== "cancelada"
            );

            const nowIso = new Date().toISOString();
            const updatedDeps = (current.departures || []).map((dep) =>
              dep.id === departureId
                ? {
                    ...dep,
                    status: "cancelada" as const,
                    availableSpots: 0,
                  }
                : dep
            );

            const updatedEnrollments = (current.enrollments || []).map((e) =>
              e.departureId === departureId && e.status !== "cancelada"
                ? {
                    ...e,
                    status: "cancelada" as const,
                    cancelledAt: nowIso,
                    updatedAt: nowIso,
                  }
                : e
            );

            return {
              nextStore: {
                ...current,
                departures: updatedDeps,
                enrollments: updatedEnrollments,
              },
              result: {
                departure: targetDep,
                affectedEnrollments,
              },
            };
          }
        );

        // Regla: Si el guía cancela una salida, notificar a todos los anotados
        const notifSummary = await sendDepartureCancelledNotifications(
          result.departure,
          result.affectedEnrollments,
          cancelReason,
          savedStore.settings
        );

        const whatsappLinks = result.affectedEnrollments.map((client) => ({
          name: client.fullName,
          phone: client.whatsapp,
          url: buildWhatsAppLink(
            client.whatsapp,
            `Hola ${client.fullName}, te escribimos de TRAUM Fly Cast Patagonia para avisarte que la salida del ${result.departure.date} en ${result.departure.destination} fue cancelada (${cancelReason}). Quedamos en contacto para reprogramar.`
          ),
        }));

        return NextResponse.json({
          ok: true,
          notifiedCount: notifSummary.notifiedCount,
          notifiedRecipients: notifSummary.recipients,
          whatsappLinks,
          store: savedStore,
        });
      }

      if (subAction === "DELETE") {
        const departureId = String(payload.departureId || "").trim();
        const { store: savedStore } = await runStoreTransaction(
          async (current) => ({
            nextStore: {
              ...current,
              departures: (current.departures || []).filter(
                (d) => d.id !== departureId
              ),
              enrollments: (current.enrollments || []).filter(
                (e) => e.departureId !== departureId
              ),
            },
            result: null,
          })
        );
        return NextResponse.json({ ok: true, store: savedStore });
      }
    }

    // =========================================================================
    // G) RESPONDER SOLICITUD DE SALIDA A PEDIDO (RESPOND_CUSTOM_REQUEST)
    // =========================================================================
    if (actionType === "RESPOND_CUSTOM_REQUEST") {
      const requestId = String(payload.requestId || "").trim();
      const status = String(
        payload.status || "aceptada"
      ) as CustomRequestStatus;
      const alternativeDate = payload.alternativeDate
        ? String(payload.alternativeDate).trim()
        : undefined;
      const guideResponse = payload.guideResponse
        ? String(payload.guideResponse).trim()
        : undefined;

      const { store: savedStore, result } = await runStoreTransaction(
        async (current) => {
          const targetReq = (current.customRequests || []).find(
            (r) => r.id === requestId
          );
          if (!targetReq) {
            throw new BusinessRuleError(
              "No se encontró la solicitud personalizada.",
              404
            );
          }

          const updatedReq: CustomTripRequest = {
            ...targetReq,
            status,
            alternativeDate:
              alternativeDate !== undefined
                ? alternativeDate
                : targetReq.alternativeDate,
            guideResponse:
              guideResponse !== undefined
                ? guideResponse
                : targetReq.guideResponse,
            updatedAt: new Date().toISOString(),
          };

          const updatedRequests = (current.customRequests || []).map((r) =>
            r.id === requestId ? updatedReq : r
          );

          return {
            nextStore: {
              ...current,
              customRequests: updatedRequests,
            },
            result: { customRequest: updatedReq },
          };
        }
      );

      const emailRes = await sendGuideResponseToRequestEmail(
        result.customRequest,
        savedStore.settings
      );

      const finalStore = await saveTraumStore({
        ...savedStore,
        emailLogs: [emailRes.logEntry, ...(savedStore.emailLogs || [])].slice(
          0,
          60
        ),
      });

      return NextResponse.json({
        ok: true,
        customRequest: result.customRequest,
        emailSent: emailRes.sent,
        emailError: emailRes.errorDetails,
        store: finalStore,
      });
    }

    // =========================================================================
    // H) CONVERTIR SOLICITUD ACEPTADA EN SALIDA PROGRAMADA CON 1 CLIC (CONVERT_REQUEST_TO_DEPARTURE)
    // =========================================================================
    if (actionType === "CONVERT_REQUEST_TO_DEPARTURE") {
      const requestId = String(payload.requestId || "").trim();
      const mode = String(payload.mode || "privada"); // "privada" | "abierta"
      const openTotalSpots = Math.max(
        1,
        Math.floor(Number(payload.maxParticipants) || 4)
      );
      const startTime = String(payload.startTime || "08:00").trim();
      const endTime = String(payload.endTime || "17:30").trim();

      const { store: savedStore, result } = await runStoreTransaction(
        async (current) => {
          const targetReq = (current.customRequests || []).find(
            (r) => r.id === requestId
          );
          if (!targetReq) {
            throw new BusinessRuleError(
              "No se encontró la solicitud para convertir.",
              404
            );
          }

          const finalDate =
            targetReq.alternativeDate &&
            isValidDateStr(targetReq.alternativeDate)
              ? targetReq.alternativeDate
              : targetReq.desiredDate;

          const totalSpots =
            mode === "privada"
              ? targetReq.participantsCount
              : Math.max(targetReq.participantsCount + 1, openTotalSpots);

          const depId = `dep-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const nowIso = new Date().toISOString();

          const scheduleHours =
            targetReq.preferredSchedule === "Mañana"
              ? { start: "07:30", end: "13:00" }
              : targetReq.preferredSchedule === "Tarde"
              ? { start: "13:30", end: "19:00" }
              : { start: startTime, end: endTime };

          const newDeparture: CalendarDeparture = {
            id: depId,
            date: finalDate,
            startTime: scheduleHours.start,
            endTime: scheduleHours.end,
            destination:
              targetReq.preferredRiver ||
              "Río Chimehuín — Sector a medida",
            experienceType:
              (targetReq.experienceType as ExperienceModality) ||
              "Pesca en balsa",
            serviceGroupType:
              mode === "privada"
                ? "Salida privada o personalizada"
                : "Salida grupal",
            maxParticipants: totalSpots,
            availableSpots: Math.max(
              0,
              totalSpots - targetReq.participantsCount
            ),
            duration: `${scheduleHours.start} a ${scheduleHours.end} hs (${targetReq.preferredSchedule})`,
            additionalInfo:
              targetReq.comments ||
              `Salida generada a partir de la solicitud ${targetReq.requestCode} de ${targetReq.fullName}.`,
            status: "activa",
            isPrivate: mode === "privada",
            convertedFromRequestId: targetReq.id,
            isDemo: false,
          };

          const autoEnrollment: DepartureEnrollment = {
            id: `enr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            bookingCode: `TRM-${Math.floor(1000 + Math.random() * 9000)}`,
            departureId: depId,
            fullName: targetReq.fullName,
            whatsapp: targetReq.whatsapp,
            normalizedPhone:
              targetReq.normalizedPhone ||
              normalizePhoneForComparison(targetReq.whatsapp),
            email: targetReq.email,
            participantsCount: targetReq.participantsCount,
            comments: targetReq.comments,
            status: "confirmada",
            createdAt: nowIso,
          };

          const updatedRequests = (current.customRequests || []).map((r) =>
            r.id === requestId
              ? {
                  ...r,
                  status: "aceptada" as const,
                  convertedToDepartureId: depId,
                  updatedAt: nowIso,
                }
              : r
          );

          const mergedDeps = [
            ...(current.departures || []),
            newDeparture,
          ].sort((a, b) => a.date.localeCompare(b.date));

          return {
            nextStore: {
              ...current,
              departures: mergedDeps,
              enrollments: [autoEnrollment, ...(current.enrollments || [])],
              customRequests: updatedRequests,
            },
            result: {
              departure: newDeparture,
              enrollment: autoEnrollment,
            },
          };
        }
      );

      await sendEnrollmentNotificationEmail(
        result.enrollment,
        result.departure,
        savedStore.settings
      );

      return NextResponse.json({
        ok: true,
        departure: result.departure,
        enrollment: result.enrollment,
        store: savedStore,
      });
    }

    // =========================================================================
    // I) BLOQUEAR / DESBLOQUEAR DÍAS (TOGGLE_BLOCKED_DAY)
    // =========================================================================
    if (actionType === "TOGGLE_BLOCKED_DAY") {
      const dateStr = String(payload.date || "").trim();
      const reason = String(payload.reason || "").trim();

      if (!isValidDateStr(dateStr)) {
        return NextResponse.json(
          { error: "Ingresá una fecha válida (YYYY-MM-DD)." },
          { status: 400 }
        );
      }

      const { store: savedStore, result } = await runStoreTransaction(
        async (current) => {
          const exists = (current.blockedDays || []).some(
            (b) => b.date === dateStr
          );
          let nextBlocked: BlockedDay[];
          if (exists && payload.forceBlock !== true) {
            nextBlocked = (current.blockedDays || []).filter(
              (b) => b.date !== dateStr
            );
          } else {
            const filtered = (current.blockedDays || []).filter(
              (b) => b.date !== dateStr
            );
            nextBlocked = [
              ...filtered,
              {
                date: dateStr,
                reason: reason || undefined,
                createdAt: new Date().toISOString(),
              },
            ].sort((a, b) => a.date.localeCompare(b.date));
          }

          return {
            nextStore: {
              ...current,
              blockedDays: nextBlocked,
            },
            result: { blocked: !exists || payload.forceBlock === true },
          };
        }
      );

      return NextResponse.json({
        ok: true,
        blocked: result.blocked,
        store: savedStore,
      });
    }

    // =========================================================================
    // J) LIMPIAR HISTORIAL DE SOLICITUDES O BORRAR INDIVIDUALMENTE
    // =========================================================================
    if (actionType === "DELETE_CUSTOM_REQUEST") {
      const requestId = String(payload.requestId || "").trim();
      if (!requestId) {
        return NextResponse.json(
          { error: "Indicá la solicitud a eliminar." },
          { status: 400 }
        );
      }

      const { store: savedStore } = await runStoreTransaction(
        async (current) => ({
          nextStore: {
            ...current,
            customRequests: (current.customRequests || []).filter(
              (r) => r.id !== requestId
            ),
            inquiries: (current.inquiries || []).filter(
              (inq) => inq.id !== requestId
            ),
          },
          result: { deletedId: requestId },
        })
      );

      return NextResponse.json({
        ok: true,
        deletedCount: 1,
        deletedId: requestId,
        store: savedStore,
      });
    }

    if (actionType === "CLEAR_REQUESTS_HISTORY") {
      const mode = String(payload.mode || "resolved"); // "resolved" | "all"
      const confirmPending = Boolean(payload.confirmPending);

      const { store: savedStore, result } = await runStoreTransaction(
        async (current) => {
          const allRequests = current.customRequests || [];
          const pendingRequests = allRequests.filter(
            (r) => r.status === "pendiente"
          );
          const resolvedRequests = allRequests.filter(
            (r) => r.status !== "pendiente"
          );

          if (mode === "all") {
            if (pendingRequests.length > 0 && !confirmPending) {
              throw new BusinessRuleError(
                `Hay ${pendingRequests.length} solicitud(es) pendiente(s) sin responder. Confirmá explícitamente si querés borrar también las pendientes.`,
                409,
                {
                  code: "PENDING_WARNING",
                  pendingCount: pendingRequests.length,
                  totalCount: allRequests.length,
                }
              );
            }
            const deletedIds = new Set(allRequests.map((r) => r.id));
            return {
              nextStore: {
                ...current,
                customRequests: [],
                inquiries: (current.inquiries || []).filter(
                  (inq) => !deletedIds.has(inq.id)
                ),
              },
              result: {
                deletedCount: allRequests.length,
                mode: "all",
              },
            };
          }

          // Modo "resolved": borrar solo las ya resueltas (aceptadas, rechazadas, reprogramadas)
          const resolvedIds = new Set(resolvedRequests.map((r) => r.id));
          return {
            nextStore: {
              ...current,
              customRequests: pendingRequests,
              inquiries: (current.inquiries || []).filter(
                (inq) => !resolvedIds.has(inq.id)
              ),
            },
            result: {
              deletedCount: resolvedRequests.length,
              mode: "resolved",
            },
          };
        }
      );

      return NextResponse.json({
        ok: true,
        deletedCount: result.deletedCount,
        mode: result.mode,
        store: savedStore,
      });
    }

    // =========================================================================
    // K) ENVIAR MAIL DE PRUEBA Y DIAGNÓSTICO (SEND_TEST_EMAIL)
    // =========================================================================
    if (actionType === "SEND_TEST_EMAIL") {
      const current = await getTraumStore();
      const customRecipient = payload.recipientEmail
        ? String(payload.recipientEmail).trim()
        : undefined;

      // Si mandan credenciales temporales para probar antes de guardar
      const tempSettings = {
        ...current.settings,
        ...(payload.smtpUser !== undefined
          ? { smtpUser: String(payload.smtpUser) }
          : {}),
        ...(payload.smtpAppPassword !== undefined
          ? { smtpAppPassword: String(payload.smtpAppPassword) }
          : {}),
        ...(payload.resendApiKey !== undefined
          ? { resendApiKey: String(payload.resendApiKey) }
          : {}),
      };

      const emailRes = await sendTestDiagnosticEmail(
        tempSettings,
        customRecipient
      );

      const savedStore = await saveTraumStore({
        ...current,
        settings: tempSettings,
        emailLogs: [emailRes.logEntry, ...(current.emailLogs || [])].slice(
          0,
          60
        ),
      });

      return NextResponse.json({
        ok: true,
        sent: emailRes.sent,
        channel: emailRes.channel,
        errorDetails: emailRes.errorDetails,
        logEntry: emailRes.logEntry,
        store: savedStore,
      });
    }

    // =========================================================================
    // L) GESTIÓN DE GALERÍA DE FOTOS (MANAGE_GALLERY)
    // =========================================================================
    if (actionType === "MANAGE_GALLERY") {
      const subAction = String(payload.subAction || "ADD");

      const { store: savedStore, result } = await runStoreTransaction<
        Record<string, unknown>
      >(
        async (current) => {
          const currentGallery: GalleryImageItem[] = [
            ...(current.gallery || []),
          ].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

          if (subAction === "ADD") {
            const rawItems: Array<{ imageUrl: string; caption?: string }> =
              Array.isArray(payload.items)
                ? payload.items
                : payload.imageUrl
                ? [
                    {
                      imageUrl: String(payload.imageUrl),
                      caption: payload.caption
                        ? String(payload.caption)
                        : undefined,
                    },
                  ]
                : [];

            if (rawItems.length === 0) {
              throw new BusinessRuleError(
                "Seleccioná al menos una imagen válida para subir a la galería.",
                400
              );
            }

            const nowIso = new Date().toISOString();
            const addedItems: GalleryImageItem[] = rawItems.map((it, idx) => ({
              id: `gal-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
              imageUrl: String(it.imageUrl),
              caption: it.caption ? String(it.caption).trim() : "",
              order: currentGallery.length + idx,
              createdAt: nowIso,
            }));

            const updatedGallery = [...currentGallery, ...addedItems].map(
              (item, index) => ({
                ...item,
                order: index,
              })
            );

            return {
              nextStore: {
                ...current,
                gallery: updatedGallery,
              },
              result: { addedCount: addedItems.length },
            };
          }

          if (subAction === "DELETE") {
            const imageId = String(payload.imageId || "").trim();
            const filtered = currentGallery
              .filter((g) => g.id !== imageId)
              .map((item, index) => ({ ...item, order: index }));

            return {
              nextStore: {
                ...current,
                gallery: filtered,
              },
              result: { deletedId: imageId },
            };
          }

          if (subAction === "REORDER") {
            if (Array.isArray(payload.orderedIds)) {
              const idOrder = payload.orderedIds.map(String);
              const byId = new Map(currentGallery.map((g) => [g.id, g]));
              const reordered: GalleryImageItem[] = [];
              for (const id of idOrder) {
                const found = byId.get(id);
                if (found) {
                  reordered.push(found);
                  byId.delete(id);
                }
              }
              for (const rem of byId.values()) {
                reordered.push(rem);
              }
              const normalized = reordered.map((item, idx) => ({
                ...item,
                order: idx,
              }));
              return {
                nextStore: { ...current, gallery: normalized },
                result: { reordered: true },
              };
            }

            const imageId = String(payload.imageId || "").trim();
            const direction = String(payload.direction || "LEFT"); // "LEFT" | "RIGHT"
            const idx = currentGallery.findIndex((g) => g.id === imageId);
            if (idx !== -1) {
              const swapIdx = direction === "LEFT" ? idx - 1 : idx + 1;
              if (swapIdx >= 0 && swapIdx < currentGallery.length) {
                const copy = [...currentGallery];
                const temp = copy[idx];
                copy[idx] = copy[swapIdx];
                copy[swapIdx] = temp;
                const normalized = copy.map((item, i) => ({
                  ...item,
                  order: i,
                }));
                return {
                  nextStore: { ...current, gallery: normalized },
                  result: { reordered: true },
                };
              }
            }
            return {
              nextStore: current,
              result: { reordered: false },
            };
          }

          if (subAction === "UPDATE_CAPTION") {
            const imageId = String(payload.imageId || "").trim();
            const caption = String(payload.caption || "").trim();
            const updated = currentGallery.map((g) =>
              g.id === imageId ? { ...g, caption } : g
            );
            return {
              nextStore: { ...current, gallery: updated },
              result: { updated: true },
            };
          }

          return { nextStore: current, result: {} };
        }
      );

      return NextResponse.json({
        ok: true,
        ...result,
        store: savedStore,
      });
    }

    // =========================================================================
    // 2. PUBLICACIÓN DE RESEÑA
    // =========================================================================
    if (actionType === "REVIEW") {
      const googleEmail = String(payload.authorEmail || "")
        .trim()
        .toLowerCase();
      if (!googleEmail || !googleEmail.includes("@")) {
        return NextResponse.json(
          {
            error:
              "Es obligatorio iniciar sesión con una cuenta de Google para publicar una reseña.",
          },
          { status: 401 }
        );
      }

      const current = await getTraumStore();
      const newReview: ReviewItem = {
        id: `rev-${Date.now()}`,
        authorName: (payload.authorName || "Pescador Verificado").slice(0, 80),
        authorEmail: googleEmail,
        authorAvatar: payload.authorAvatar
          ? String(payload.authorAvatar)
          : undefined,
        verifiedGoogle: true,
        authorLocation: (payload.authorLocation || "Patagonia").slice(0, 80),
        experienceModality: (
          payload.experienceModality || "Pesca con mosca"
        ).slice(0, 80),
        rating: Math.min(5, Math.max(1, Number(payload.rating) || 5)),
        comment: (payload.comment || "").slice(0, 700),
        createdAt: new Date().toISOString(),
      };

      const saved = await saveTraumStore({
        ...current,
        reviews: [newReview, ...(current.reviews || [])],
      });
      return NextResponse.json({ ok: true, review: newReview, store: saved });
    }

    // =========================================================================
    // 3. GUARDADO DE CONSENTIMIENTO DE COOKIES
    // =========================================================================
    if (actionType === "COOKIE_CONSENT") {
      const current = await getTraumStore();
      const nowIso = new Date().toISOString();
      const visitorId =
        String(payload.visitorId || "").trim() || `vis-${Date.now()}`;
      const decision: "accepted" | "rejected" | "custom" =
        payload.decision === "rejected"
          ? "rejected"
          : payload.decision === "custom"
          ? "custom"
          : "accepted";

      const record: CookieConsentRecord = {
        id: `cc-${visitorId}`,
        visitorId,
        decision,
        preferences: {
          essential: true,
          googleAuth:
            payload.preferences?.googleAuth ?? decision === "accepted",
          payments: payload.preferences?.payments ?? decision === "accepted",
          analytics: payload.preferences?.analytics ?? decision === "accepted",
        },
        googleEmail: payload.googleEmail
          ? String(payload.googleEmail)
          : undefined,
        userAgent: request.headers.get("user-agent") || undefined,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      await saveCookieConsentToDb(record);

      const existingConsents = (current.cookieConsents || []).filter(
        (c) => c.visitorId !== visitorId
      );
      const updatedStore = await saveTraumStore({
        ...current,
        cookieConsents: [record, ...existingConsents].slice(0, 100),
      });

      const response = NextResponse.json({
        ok: true,
        consent: record,
        storeVersion: updatedStore.version,
      });

      response.cookies.set(
        "traum_cookie_consent",
        JSON.stringify({
          visitorId,
          decision,
          preferences: record.preferences,
          updatedAt: nowIso,
        }),
        {
          path: "/",
          maxAge: 60 * 60 * 24 * 365,
          sameSite: "lax",
        }
      );

      return response;
    }

    // =========================================================================
    // 4. BOTÓN DE ARREPENTIMIENTO (LEY 24.240)
    // =========================================================================
    if (actionType === "REGRET_REQUEST") {
      const current = await getTraumStore();
      const randomCode = Math.floor(100000 + Math.random() * 900000);
      const regretItem: RegretRequestItem = {
        id: `reg-${Date.now()}`,
        regretCode: `ARR-${randomCode}`,
        createdAt: new Date().toISOString(),
        fullName: (payload.fullName || "").trim(),
        email: (payload.email || "").trim(),
        whatsapp: (payload.whatsapp || "").trim(),
        bookingCode: (payload.bookingCode || "").trim(),
        serviceContracted: (payload.serviceContracted || "").trim(),
        reason: (payload.reason || "").trim(),
        status: "Recibido",
      };

      await sendRegretNotificationEmail(regretItem, current.settings);

      const saved = await saveTraumStore({
        ...current,
        regretRequests: [regretItem, ...(current.regretRequests || [])],
      });
      return NextResponse.json({
        ok: true,
        regret: regretItem,
        store: saved,
      });
    }

    return NextResponse.json(
      { error: "Acción no reconocida" },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof BusinessRuleError) {
      return NextResponse.json(
        {
          error: error.message,
          ...error.extra,
        },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { error: "Error procesando la solicitud", details: String(error) },
      { status: 400 }
    );
  }
}
