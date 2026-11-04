import { NextRequest, NextResponse, connection } from "next/server";
import {
  getTraumStore,
  saveCookieConsentToDb,
  saveTraumStore,
} from "@/lib/store-server";
import {
  sendBookingNotificationEmail,
  sendRegretNotificationEmail,
} from "@/lib/email-service";
import {
  BookingInquiry,
  CookieConsentRecord,
  RegretRequestItem,
  ReviewItem,
  TraumStoreData,
} from "@/types/traum";

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
    const current = await getTraumStore();

    // 1. CONTRATACIÓN DE SERVICIO / RESERVA (INQUIRY)
    if (payload.type === "INQUIRY") {
      if (!payload.legalAccepted) {
        return NextResponse.json(
          {
            error:
              "Debés aceptar los Términos y Condiciones y el Deslinde de Responsabilidad para continuar.",
          },
          { status: 400 }
        );
      }

      const requestedSpots = Math.max(1, Number(payload.participantsCount) || 1);
      const departureId = payload.departureId
        ? String(payload.departureId).trim()
        : undefined;

      let updatedDepartures = [...(current.departures || [])];
      let isScheduledDeparture = false;

      if (departureId) {
        const depIndex = updatedDepartures.findIndex(
          (d) => d.id === departureId
        );
        if (depIndex === -1) {
          return NextResponse.json(
            {
              error:
                "La salida programada seleccionada ya no se encuentra disponible.",
            },
            { status: 404 }
          );
        }

        const targetDep = updatedDepartures[depIndex];
        const currentAvailable =
          targetDep.availableSpots !== null
            ? targetDep.availableSpots
            : targetDep.maxParticipants;

        if (currentAvailable < requestedSpots) {
          return NextResponse.json(
            {
              error:
                currentAvailable <= 0
                  ? "Esta salida programada ya no tiene cupos libres."
                  : `Solo quedan ${currentAvailable} cupo(s) disponible(s) en esta salida y solicitaste ${requestedSpots}.`,
            },
            { status: 400 }
          );
        }

        updatedDepartures[depIndex] = {
          ...targetDep,
          availableSpots: Math.max(0, currentAvailable - requestedSpots),
        };
        isScheduledDeparture = true;
      }

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const bookingCode = `TRM-${randomSuffix}`;
      const nowIso = new Date().toISOString();

      const newInquiry: BookingInquiry = {
        id: `inq-${Date.now()}`,
        bookingCode,
        createdAt: nowIso,
        fullName: (payload.fullName || "").trim(),
        email: (payload.email || "").trim(),
        googleEmail: payload.googleEmail ? String(payload.googleEmail) : undefined,
        whatsapp: (payload.whatsapp || "").trim(),
        desiredDate: payload.desiredDate || "A definir",
        departureId: isScheduledDeparture ? departureId : undefined,
        requiresDeposit: isScheduledDeparture,
        spotsReleased: false,
        selectedServiceTitle:
          payload.selectedServiceTitle ||
          payload.experienceType ||
          "Pesca de vadeo",
        priceReference: payload.priceReference || "",
        depositPercentage: isScheduledDeparture
          ? current.paymentConfig.depositPercentage
          : 0,
        experienceType: payload.experienceType || "Pesca de vadeo",
        serviceGroupType:
          payload.serviceGroupType ||
          (requestedSpots === 1
            ? "Salida individual"
            : "Salida para dos personas"),
        participantsCount: requestedSpots,
        skillLevel: payload.skillLevel || "Intermedio",
        comments: payload.comments || "",
        legalAccepted: true,
        legalAcceptedAt: nowIso,
        legalVersion: "v2026.11-AR",
        status: "Pendiente",
      };

      const emailResult = await sendBookingNotificationEmail(
        newInquiry,
        current.settings,
        current.paymentConfig
      );
      newInquiry.emailNotificationSent = emailResult.sent;

      const updated: TraumStoreData = {
        ...current,
        departures: updatedDepartures,
        inquiries: [newInquiry, ...(current.inquiries || [])],
      };

      const saved = await saveTraumStore(updated);
      return NextResponse.json({
        ok: true,
        inquiry: newInquiry,
        emailChannel: emailResult.channel,
        store: saved,
      });
    }

    // 1B. DAR DE BAJA / CANCELAR RESERVA Y LIBERAR CUPOS AUTOMÁTICAMENTE
    if (payload.type === "CANCEL_INQUIRY") {
      const inquiryId = String(payload.inquiryId || "").trim();
      const deleteRecord = Boolean(payload.deleteRecord);

      const targetInq = (current.inquiries || []).find(
        (item) => item.id === inquiryId
      );
      if (!targetInq) {
        return NextResponse.json(
          { error: "No se encontró el pedido indicado." },
          { status: 404 }
        );
      }

      let updatedDepartures = [...(current.departures || [])];
      if (targetInq.departureId && !targetInq.spotsReleased) {
        updatedDepartures = updatedDepartures.map((dep) => {
          if (dep.id !== targetInq.departureId) return dep;
          const currentAvailable =
            dep.availableSpots !== null ? dep.availableSpots : 0;
          const restoredSpots = Math.min(
            dep.maxParticipants,
            currentAvailable + (Number(targetInq.participantsCount) || 1)
          );
          return {
            ...dep,
            availableSpots: restoredSpots,
          };
        });
      }

      const updatedInquiries = deleteRecord
        ? (current.inquiries || []).filter((item) => item.id !== inquiryId)
        : (current.inquiries || []).map((item) =>
            item.id === inquiryId
              ? {
                  ...item,
                  status: "Cancelado" as const,
                  spotsReleased: true,
                }
              : item
          );

      const saved = await saveTraumStore({
        ...current,
        departures: updatedDepartures,
        inquiries: updatedInquiries,
      });

      return NextResponse.json({
        ok: true,
        store: saved,
      });
    }

    // 2. PUBLICACIÓN DE RESEÑA CON CUENTA DE GOOGLE OBLIGATORIA
    if (payload.type === "REVIEW") {
      const googleEmail = String(payload.authorEmail || "").trim().toLowerCase();
      if (!googleEmail || !googleEmail.includes("@")) {
        return NextResponse.json(
          {
            error:
              "Es obligatorio iniciar sesión con una cuenta de Google para publicar una reseña.",
          },
          { status: 401 }
        );
      }

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

      const updated: TraumStoreData = {
        ...current,
        reviews: [newReview, ...(current.reviews || [])],
      };

      const saved = await saveTraumStore(updated);
      return NextResponse.json({ ok: true, review: newReview, store: saved });
    }

    // 3. GUARDADO DE CONSENTIMIENTO DE COOKIES EN SERVIDOR Y BASE DE DATOS
    if (payload.type === "COOKIE_CONSENT") {
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
        googleEmail: payload.googleEmail ? String(payload.googleEmail) : undefined,
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

    // 4. BOTÓN DE ARREPENTIMIENTO (LEY 24.240 / RES. 424/2020)
    if (payload.type === "REGRET_REQUEST") {
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

      const updated: TraumStoreData = {
        ...current,
        regretRequests: [regretItem, ...(current.regretRequests || [])],
      };

      const saved = await saveTraumStore(updated);
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
    return NextResponse.json(
      { error: "Error procesando la solicitud", details: String(error) },
      { status: 400 }
    );
  }
}
