import { promises as fs } from "fs";
import path from "path";
import { neon } from "@neondatabase/serverless";
import { initialTraumData } from "@/data/initial-traum-data";
import { CookieConsentRecord, TraumStoreData } from "@/types/traum";

const DATA_FILE_PATH = path.join(process.cwd(), "src", "data", "traum-store.json");

const NEON_DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  "postgresql://neondb_owner:npg_xOZdjbAt5Mi3@ep-small-breeze-b61vzz3d-pooler.c-2.sa-east-1.aws.neon.tech/neondb?sslmode=require";

function normalizeStore(parsed: Partial<TraumStoreData>, version?: number, updatedAt?: string): TraumStoreData {
  const mergedSettings = {
    ...initialTraumData.settings,
    ...(parsed.settings || {}),
  };

  // Ensure official email is traumflyfishing9@gmail.com if old placeholder is still present
  if (
    !mergedSettings.email ||
    mergedSettings.email === "contacto@traumflycast.com"
  ) {
    mergedSettings.email = "traumflyfishing9@gmail.com";
  }
  if (!mergedSettings.notificationEmail) {
    mergedSettings.notificationEmail = "traumflyfishing9@gmail.com";
  }
  if (!mergedSettings.web3FormsAccessKey) {
    mergedSettings.web3FormsAccessKey = "fa183ece-13f6-4360-8085-ff84ba3ea870";
  }

  const normalizedDestinations = (
    parsed.destinations || initialTraumData.destinations
  ).map((dest) => {
    // Fix Río Malleo pin location if still on the old -39.7765 coordinate
    if (dest.id === "dest-malleo" && Math.abs(dest.lat - -39.7765) < 0.01) {
      return {
        ...dest,
        lat: -39.6225,
        lng: -71.1865,
        location: "Parque Nacional Lanín · Ruta Prov. 23, Neuquén",
        distanceFromJunin:
          "35 km al norte de Junín de los Andes por RP 60 / RP 23",
      };
    }
    return dest;
  });

  return {
    ...initialTraumData,
    ...parsed,
    version: version ?? parsed.version ?? initialTraumData.version ?? 1,
    updatedAt: updatedAt ?? parsed.updatedAt ?? new Date().toISOString(),
    settings: mergedSettings,
    destinations: normalizedDestinations,
    siteImages: {
      ...initialTraumData.siteImages,
      ...(parsed.siteImages || {}),
    },
    paymentConfig: {
      ...initialTraumData.paymentConfig,
      ...(parsed.paymentConfig || {}),
    },
    reviews: parsed.reviews || initialTraumData.reviews,
    inquiries: parsed.inquiries || [],
    cookieConsents: parsed.cookieConsents || [],
    regretRequests: parsed.regretRequests || [],
  };
}

async function ensureTables() {
  const sql = neon(NEON_DATABASE_URL);
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
  return sql;
}

export async function getTraumStore(): Promise<TraumStoreData> {
  // 1. Primary: Neon PostgreSQL Cloud Database (shared across all visitors in real time)
  if (NEON_DATABASE_URL) {
    try {
      const sql = await ensureTables();
      const rows = await sql.query(
        "SELECT content, version, updated_at FROM traum_site_store WHERE id = 1 LIMIT 1"
      );

      if (rows && rows.length > 0 && rows[0].content) {
        const raw = rows[0].content;
        const parsed = (typeof raw === "string" ? JSON.parse(raw) : raw) as Partial<TraumStoreData>;
        if (parsed && Object.keys(parsed).length > 0) {
          // Also fetch latest 100 cookie consents from dedicated table
          let dbConsents: CookieConsentRecord[] = parsed.cookieConsents || [];
          try {
            const cRows = await sql.query(
              "SELECT id, visitor_id, decision, preferences, google_email, user_agent, created_at, updated_at FROM traum_cookie_consents ORDER BY updated_at DESC LIMIT 100"
            );
            if (cRows && cRows.length > 0) {
              dbConsents = cRows.map((r: Record<string, unknown>) => ({
                id: String(r.id),
                visitorId: String(r.visitor_id),
                decision: (r.decision as "accepted" | "rejected" | "custom") || "accepted",
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
      const initialNormalized = normalizeStore(initialTraumData, 1, new Date().toISOString());
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

  // 1. Save permanently in Neon PostgreSQL
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

  // 2. Also mirror to local JSON file when writable (dev/local)
  try {
    await fs.mkdir(path.dirname(DATA_FILE_PATH), { recursive: true });
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(normalized, null, 2), "utf-8");
  } catch {
    // Ignore read-only filesystem on serverless
  }

  return normalized;
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
