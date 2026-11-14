import { promises as fs } from "fs";
import path from "path";
import { neon } from "@neondatabase/serverless";
import { initialTraumData } from "@/data/initial-traum-data";
import {
  BlockedDay,
  BookingInquiry,
  CalendarDeparture,
  CookieConsentRecord,
  CustomTripRequest,
  DepartureEnrollment,
  EmailLogItem,
  TraumStoreData,
  WaitlistPromotionAlert,
} from "@/types/traum";

const DATA_FILE_PATH = path.join(process.cwd(), "src", "data", "traum-store.json");

const NEON_DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  "postgresql://neondb_owner:npg_xOZdjbAt5Mi3@ep-small-breeze-b61vzz3d-pooler.c-2.sa-east-1.aws.neon.tech/neondb?sslmode=require";

/**
 * Obtiene la fecha actual en zona horaria Argentina (UTC-3) en formato YYYY-MM-DD.
 */
export function getArgentinaTodayStr(): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Argentina/Buenos_Aires",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    const now = new Date(Date.now() - 3 * 60 * 60 * 1000);
    return now.toISOString().split("T")[0];
  }
}

/**
 * Normaliza un número de teléfono dejando únicamente los dígitos significativos
 * (últimos 10 dígitos si supera esa longitud por prefijos +54 9, o todos los dígitos).
 */
export function normalizePhoneForComparison(phone: string): string {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length > 10) {
    return digits.slice(-10);
  }
  return digits;
}

/**
 * Recalcula cupos_disponibles = cupos_totales - sum(cantidad_personas en anotaciones confirmadas)
 * para todas las salidas programadas y sincroniza inquiries legadas si existen.
 */
export function recalculateStoreConsistentState(
  store: TraumStoreData
): TraumStoreData {
  const rawDepartures: CalendarDeparture[] = (
    store.departures || initialTraumData.departures
  ).map((dep) => {
    const matchingExp = (
      store.experiences || initialTraumData.experiences
    ).find((e) => e.modality === dep.experienceType);
    const fallbackTotal =
      Number(matchingExp?.basePrice) ||
      Number(store.paymentConfig?.defaultDepartureTotalPrice) ||
      120000;
    const fallbackDepositPct =
      Number(matchingExp?.defaultDepositPercentage) ||
      Number(store.paymentConfig?.depositPercentage) ||
      30;

    return {
      ...dep,
      startTime: dep.startTime || "08:00",
      endTime: dep.endTime || "17:30",
      status: dep.status === "cancelada" ? "cancelada" : "activa",
      maxParticipants: Math.max(1, Number(dep.maxParticipants) || 2),
      availableSpots: Math.max(
        0,
        Number(dep.availableSpots ?? dep.maxParticipants) || 0
      ),
      totalPrice:
        Number(dep.totalPrice) > 0 ? Number(dep.totalPrice) : fallbackTotal,
      depositPercentage:
        Number(dep.depositPercentage) > 0
          ? Math.min(100, Math.max(1, Number(dep.depositPercentage)))
          : fallbackDepositPct,
      priceDisplayMode:
        dep.priceDisplayMode === "total" ? "total" : "per_person",
    };
  });

  // Fuente única de verdad: enrollments y customRequests (sin re-inyectar desde inquiries borradas)
  const existingEnrollments: DepartureEnrollment[] = [...(store.enrollments || [])];
  const existingRequests: CustomTripRequest[] = [...(store.customRequests || [])];

  // Asegurar normalizedPhone en todas las anotaciones
  const normalizedEnrollments: DepartureEnrollment[] = existingEnrollments.map(
    (enr) => ({
      ...enr,
      normalizedPhone:
        enr.normalizedPhone || normalizePhoneForComparison(enr.whatsapp),
      participantsCount: Math.max(1, Number(enr.participantsCount) || 1),
    })
  );

  // Recalcular exactamente: cupos_disponibles = cupos_totales - personas en anotaciones confirmadas
  const recalculatedDepartures = rawDepartures.map((dep) => {
    const confirmedPeople = normalizedEnrollments
      .filter(
        (enr) => enr.departureId === dep.id && enr.status === "confirmada"
      )
      .reduce((acc, enr) => acc + (Number(enr.participantsCount) || 1), 0);

    const availableSpots =
      dep.status === "cancelada"
        ? 0
        : Math.max(0, dep.maxParticipants - confirmedPeople);

    return {
      ...dep,
      availableSpots,
    };
  });

  // Sincronizar inquiries para mantener compatibilidad con vistas existentes
  const syncedInquiries: BookingInquiry[] = [
    ...normalizedEnrollments.map((enr): BookingInquiry => {
      const dep = recalculatedDepartures.find((d) => d.id === enr.departureId);
      return {
        id: enr.id,
        bookingCode: enr.bookingCode,
        createdAt: enr.createdAt,
        fullName: enr.fullName,
        email: enr.email,
        whatsapp: enr.whatsapp,
        desiredDate: dep?.date || "Salida programada",
        departureId: enr.departureId,
        requiresDeposit: false,
        spotsReleased: enr.status !== "confirmada",
        selectedServiceTitle: dep
          ? `${dep.destination} (${dep.experienceType})`
          : "Salida programada",
        experienceType: dep?.experienceType || "Pesca en balsa",
        serviceGroupType:
          enr.participantsCount === 1
            ? "Salida individual"
            : enr.participantsCount === 2
            ? "Salida para dos personas"
            : "Salida grupal",
        participantsCount: enr.participantsCount,
        skillLevel: "Intermedio",
        comments: enr.comments,
        legalAccepted: true,
        legalAcceptedAt: enr.createdAt,
        legalVersion: "v2026.11-AR",
        status:
          enr.status === "confirmada"
            ? "Confirmado"
            : enr.status === "cancelada"
            ? "Cancelado"
            : "Pendiente",
        enrollmentStatus: enr.status,
      };
    }),
    ...existingRequests.map((req): BookingInquiry => ({
      id: req.id,
      bookingCode: req.requestCode,
      createdAt: req.createdAt,
      fullName: req.fullName,
      email: req.email,
      whatsapp: req.whatsapp,
      desiredDate: req.desiredDate,
      requiresDeposit: false,
      spotsReleased: false,
      selectedServiceTitle: `Solicitud a pedido (${req.preferredSchedule})`,
      experienceType: req.experienceType || "Salida personalizada",
      serviceGroupType: "Salida privada o personalizada",
      participantsCount: req.participantsCount,
      skillLevel: "Intermedio",
      comments: req.comments,
      legalAccepted: true,
      legalAcceptedAt: req.createdAt,
      legalVersion: "v2026.11-AR",
      status:
        req.status === "aceptada"
          ? "Confirmado"
          : req.status === "rechazada"
          ? "Cancelado"
          : req.status === "reprogramada"
          ? "Contactado"
          : "Pendiente",
      preferredSchedule: req.preferredSchedule,
      preferredRiver: req.preferredRiver,
      customRequestStatus: req.status,
      alternativeDate: req.alternativeDate,
      guideResponse: req.guideResponse,
    })),
  ].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return {
    ...store,
    departures: recalculatedDepartures,
    enrollments: normalizedEnrollments,
    customRequests: existingRequests,
    blockedDays: (store.blockedDays || []) as BlockedDay[],
    waitlistAlerts: (store.waitlistAlerts || []) as WaitlistPromotionAlert[],
    inquiries: syncedInquiries,
  };
}

function normalizeStore(
  parsed: Partial<TraumStoreData>,
  version?: number,
  updatedAt?: string
): TraumStoreData {
  const mergedSettings = {
    ...initialTraumData.settings,
    ...(parsed.settings || {}),
  };

  if (
    !mergedSettings.email ||
    mergedSettings.email === "contacto@traumflycast.com"
  ) {
    mergedSettings.email = "traumflyfishing9@gmail.com";
  }
  if (!mergedSettings.notificationEmail) {
    mergedSettings.notificationEmail = "traumflyfishing9@gmail.com";
  }
  if (!mergedSettings.smtpUser) {
    mergedSettings.smtpUser = "traumflyfishing9@gmail.com";
  }
  mergedSettings.web3FormsAccessKey = "";
  mergedSettings.resendApiKey = "";
  mergedSettings.smtpPasswordConfigured = Boolean(
    mergedSettings.smtpAppPassword ||
      process.env.SMTP_APP_PASSWORD ||
      process.env.GMAIL_APP_PASSWORD
  );

  const officialById = new Map(
    initialTraumData.destinations.map((d) => [d.id, d])
  );
  const existingDests = parsed.destinations || initialTraumData.destinations;
  const updatedExistingDests = existingDests.map((dest) => {
    const official = officialById.get(dest.id);
    if (official) {
      return {
        ...dest,
        lat: official.lat,
        lng: official.lng,
        location: official.location,
        distanceFromJunin: official.distanceFromJunin,
        waterType: official.waterType,
      };
    }
    return dest;
  });

  const existingIds = new Set(updatedExistingDests.map((d) => d.id));
  const missingOfficialDests = initialTraumData.destinations.filter(
    (d) => !existingIds.has(d.id)
  );
  const normalizedDestinations = [
    ...updatedExistingDests,
    ...missingOfficialDests,
  ];

  const normalizedGallery = Array.isArray(parsed.gallery)
    ? [...parsed.gallery].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    : initialTraumData.gallery;

  const officialExpByModality = new Map(
    initialTraumData.experiences.map((e) => [e.modality, e])
  );
  const normalizedExperiences = (
    parsed.experiences || initialTraumData.experiences
  ).map((exp) => {
    const officialExp = officialExpByModality.get(exp.modality);
    return {
      ...exp,
      basePrice:
        Number(exp.basePrice) > 0
          ? Number(exp.basePrice)
          : Number(officialExp?.basePrice) || 120000,
      defaultDepositPercentage:
        Number(exp.defaultDepositPercentage) > 0
          ? Math.min(100, Math.max(1, Number(exp.defaultDepositPercentage)))
          : Number(officialExp?.defaultDepositPercentage) ||
            Number(parsed.paymentConfig?.depositPercentage) ||
            30,
    };
  });

  const mergedPaymentConfig = {
    ...initialTraumData.paymentConfig,
    ...(parsed.paymentConfig || {}),
    depositPercentage: Math.min(
      100,
      Math.max(
        1,
        Number(
          parsed.paymentConfig?.depositPercentage ??
            initialTraumData.paymentConfig.depositPercentage
        ) || 30
      )
    ),
    defaultDepartureTotalPrice:
      Number(parsed.paymentConfig?.defaultDepartureTotalPrice) > 0
        ? Number(parsed.paymentConfig?.defaultDepartureTotalPrice)
        : initialTraumData.paymentConfig.defaultDepartureTotalPrice || 120000,
  };
  mergedPaymentConfig.mercadoPagoTokenConfigured = Boolean(
    mergedPaymentConfig.mercadoPagoAccessToken?.trim() ||
      process.env.MP_ACCESS_TOKEN ||
      process.env.MERCADOPAGO_ACCESS_TOKEN
  );

  const base: TraumStoreData = {
    ...initialTraumData,
    ...parsed,
    version: version ?? parsed.version ?? initialTraumData.version ?? 1,
    updatedAt: updatedAt ?? parsed.updatedAt ?? new Date().toISOString(),
    settings: mergedSettings,
    experiences: normalizedExperiences,
    destinations: normalizedDestinations,
    gallery: normalizedGallery,
    emailLogs: Array.isArray(parsed.emailLogs)
      ? parsed.emailLogs.slice(0, 60)
      : [],
    siteImages: {
      ...initialTraumData.siteImages,
      ...(parsed.siteImages || {}),
    },
    paymentConfig: mergedPaymentConfig,
    departures: parsed.departures || initialTraumData.departures,
    enrollments: parsed.enrollments || [],
    customRequests: parsed.customRequests || [],
    blockedDays: parsed.blockedDays || [],
    waitlistAlerts: parsed.waitlistAlerts || [],
    reviews: parsed.reviews || initialTraumData.reviews,
    inquiries: parsed.inquiries || [],
    cookieConsents: parsed.cookieConsents || [],
    regretRequests: parsed.regretRequests || [],
  };

  return recalculateStoreConsistentState(base);
}

let tablesInitialized = false;

async function ensureTables() {
  const sql = neon(NEON_DATABASE_URL);
  if (!tablesInitialized) {
    await sql.query(`
      CREATE TABLE IF NOT EXISTS traum_site_store (
        id integer PRIMARY KEY DEFAULT 1,
        content jsonb NOT NULL DEFAULT '{}'::jsonb,
        version bigint NOT NULL DEFAULT 1,
        updated_at timestamptz DEFAULT now()
      )
    `);
    await sql.query(`
      CREATE TABLE IF NOT EXISTS traum_cookie_consents (
        id text PRIMARY KEY,
        visitor_id text NOT NULL,
        decision text NOT NULL,
        preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
        google_email text,
        user_agent text,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      )
    `);
    tablesInitialized = true;
  }
  return sql;
}

// Mutex local en memoria para serializar transacciones concurrentes en el mismo proceso
let transactionMutex: Promise<unknown> = Promise.resolve();

/**
 * Ejecuta una lectura-modificación-escritura dentro de una transacción serializada
 * con control de concurrencia optimista (WHERE version = $expected) en PostgreSQL
 * para evitar condiciones de carrera al verificar cupos disponibles.
 */
export async function runStoreTransaction<T>(
  mutator: (currentStore: TraumStoreData) => Promise<{
    nextStore: TraumStoreData;
    result: T;
  }>
): Promise<{ store: TraumStoreData; result: T }> {
  const runLocked = async (): Promise<{ store: TraumStoreData; result: T }> => {
    const MAX_RETRIES = 5;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const current = await getTraumStore();
      const expectedVersion = Number(current.version) || 1;

      const { nextStore, result } = await mutator(current);
      const nextVersion = expectedVersion + 1;
      const nowIso = new Date().toISOString();
      const normalized = normalizeStore(nextStore, nextVersion, nowIso);

      if (NEON_DATABASE_URL) {
        try {
          const sql = await ensureTables();
          const updatedRows = await sql.query(
            `UPDATE traum_site_store
             SET content = $1::jsonb,
                 version = $2,
                 updated_at = now()
             WHERE id = 1 AND version = $3
             RETURNING version`,
            [JSON.stringify(normalized), nextVersion, expectedVersion]
          );

          if (!updatedRows || updatedRows.length === 0) {
            // Verificar si la fila existe; si no existe, insertarla
            const checkRows = await sql.query(
              "SELECT version FROM traum_site_store WHERE id = 1"
            );
            if (!checkRows || checkRows.length === 0) {
              await sql.query(
                `INSERT INTO traum_site_store (id, content, version, updated_at)
                 VALUES (1, $1::jsonb, $2, now())
                 ON CONFLICT (id) DO NOTHING`,
                [JSON.stringify(normalized), nextVersion]
              );
            } else if (attempt < MAX_RETRIES - 1) {
              // Conflicto de concurrencia detectado: reintentar con el estado fresco
              continue;
            }
          }
        } catch (dbErr) {
          console.error("Error in DB transaction:", dbErr);
        }
      }

      // Espejar en archivo JSON local
      try {
        await fs.mkdir(path.dirname(DATA_FILE_PATH), { recursive: true });
        await fs.writeFile(
          DATA_FILE_PATH,
          JSON.stringify(normalized, null, 2),
          "utf-8"
        );
      } catch {
        // Ignorar en entornos serverless de solo lectura
      }

      return { store: normalized, result };
    }

    throw new Error(
      "No se pudo completar la transacción por alta concurrencia. Intentá nuevamente."
    );
  };

  const nextTask = transactionMutex.then(runLocked, runLocked);
  transactionMutex = nextTask.catch(() => {});
  return nextTask;
}

export async function getTraumStore(): Promise<TraumStoreData> {
  // 1. Primary: Neon PostgreSQL Cloud Database
  if (NEON_DATABASE_URL) {
    try {
      const sql = await ensureTables();
      const rows = await sql.query(
        "SELECT content, version, updated_at FROM traum_site_store WHERE id = 1 LIMIT 1"
      );

      if (rows && rows.length > 0 && rows[0].content) {
        const raw = rows[0].content;
        const parsed = (
          typeof raw === "string" ? JSON.parse(raw) : raw
        ) as Partial<TraumStoreData>;
        if (parsed && Object.keys(parsed).length > 0) {
          let dbConsents: CookieConsentRecord[] = parsed.cookieConsents || [];
          try {
            const cRows = await sql.query(
              "SELECT id, visitor_id, decision, preferences, google_email, user_agent, created_at, updated_at FROM traum_cookie_consents ORDER BY updated_at DESC LIMIT 100"
            );
            if (cRows && cRows.length > 0) {
              dbConsents = cRows.map((r: Record<string, unknown>) => ({
                id: String(r.id),
                visitorId: String(r.visitor_id),
                decision:
                  (r.decision as "accepted" | "rejected" | "custom") ||
                  "accepted",
                preferences:
                  typeof r.preferences === "string"
                    ? JSON.parse(r.preferences)
                    : (r.preferences as CookieConsentRecord["preferences"]),
                googleEmail: r.google_email ? String(r.google_email) : undefined,
                userAgent: r.user_agent ? String(r.user_agent) : undefined,
                createdAt: String(r.created_at),
                updatedAt: String(r.updated_at),
              }));
            }
          } catch {
            // Keep existing consents from JSONB
          }

          return normalizeStore(
            { ...parsed, cookieConsents: dbConsents },
            Number(rows[0].version) || 1,
            rows[0].updated_at ? String(rows[0].updated_at) : undefined
          );
        }
      }

      // Initialize Neon table if empty
      const initialNormalized = normalizeStore(
        initialTraumData,
        1,
        new Date().toISOString()
      );
      await sql.query(
        `INSERT INTO traum_site_store (id, content, version, updated_at)
         VALUES (1, $1::jsonb, 1, now())
         ON CONFLICT (id) DO NOTHING`,
        [JSON.stringify(initialNormalized)]
      );
      return initialNormalized;
    } catch (dbErr) {
      console.warn("Fallback local file store due to DB warning:", dbErr);
    }
  }

  // 2. Fallback: Local filesystem JSON
  try {
    const raw = await fs.readFile(DATA_FILE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Partial<TraumStoreData>;
    return normalizeStore(parsed);
  } catch {
    return normalizeStore(initialTraumData);
  }
}

export async function saveTraumStore(
  data: TraumStoreData
): Promise<TraumStoreData> {
  const nextVersion = (Number(data.version) || 1) + 1;
  const nowIso = new Date().toISOString();
  const normalized = normalizeStore(data, nextVersion, nowIso);

  if (NEON_DATABASE_URL) {
    try {
      const sql = await ensureTables();
      await sql.query(
        `INSERT INTO traum_site_store (id, content, version, updated_at)
         VALUES (1, $1::jsonb, $2, now())
         ON CONFLICT (id) DO UPDATE
         SET content = $1::jsonb,
             version = traum_site_store.version + 1,
             updated_at = now()`,
        [JSON.stringify(normalized), nextVersion]
      );
    } catch (dbErr) {
      console.error("Error persisting to Neon DB:", dbErr);
    }
  }

  try {
    await fs.mkdir(path.dirname(DATA_FILE_PATH), { recursive: true });
    await fs.writeFile(
      DATA_FILE_PATH,
      JSON.stringify(normalized, null, 2),
      "utf-8"
    );
  } catch {
    // Ignore read-only filesystem on serverless
  }

  return normalized;
}

export async function appendEmailLogSafely(
  logEntry: EmailLogItem
): Promise<TraumStoreData> {
  const { store } = await runStoreTransaction(async (current) => ({
    nextStore: {
      ...current,
      emailLogs: [logEntry, ...(current.emailLogs || [])].slice(0, 60),
    },
    result: null,
  }));
  return store;
}

export async function saveCookieConsentToDb(
  record: CookieConsentRecord
): Promise<void> {
  if (!NEON_DATABASE_URL) return;
  try {
    const sql = await ensureTables();
    await sql.query(
      `INSERT INTO traum_cookie_consents (id, visitor_id, decision, preferences, google_email, user_agent, created_at, updated_at)
       VALUES ($1, $2, $3, $4::jsonb, $5, $6, now(), now())
       ON CONFLICT (id) DO UPDATE
       SET decision = $3,
           preferences = $4::jsonb,
           google_email = COALESCE($5, traum_cookie_consents.google_email),
           user_agent = $6,
           updated_at = now()`,
      [
        record.id,
        record.visitorId,
        record.decision,
        JSON.stringify(record.preferences),
        record.googleEmail || null,
        record.userAgent || null,
      ]
    );
  } catch (err) {
    console.warn("Error saving cookie consent to DB:", err);
  }
}
