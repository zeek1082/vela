import type { VercelRequest, VercelResponse } from "@vercel/node";
import { neon } from "@neondatabase/serverless";

/**
 * Lead capture endpoint.
 *
 * POST /api/lead  { email, profile, result }
 *
 * Storage is optional so the site deploys and works before a database exists:
 *   - If a Postgres connection string is configured, the lead is inserted.
 *   - If not, the lead is logged to the function log and the request still succeeds,
 *     so the results page unlocks either way.
 *
 * The variable name depends on how the database was provisioned: Vercel's Neon
 * integration names it after whatever prefix you chose, and a project that
 * already has a DATABASE_URL forces a different one. So rather than depend on a
 * single name, this checks the plausible ones in order. The resolved name is
 * logged on every cold start, because a silently wrong variable and no variable
 * at all look identical from the outside — the endpoint returns 200 either way.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Connection string variables to check, in order of preference.
 *
 * Variables provisioned by the Neon integration come first, deliberately.
 * DATABASE_URL is a name anything might claim — this project already had one of
 * unknown origin before Neon was attached — so it ranks below the names only a
 * real provisioning step creates.
 *
 * NO_SSL is last: it is the same database reached without TLS, which is a
 * fallback, not a preference.
 */
const CONNECTION_VARS = [
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
  "NEON_URL",
  "STORAGE_URL",
  "DATABASE_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NO_SSL",
] as const;

/**
 * The first configured Postgres connection string, with the variable it came
 * from. Only accepts postgres:// or postgresql:// values — a leftover MySQL or
 * placeholder string would otherwise be picked up and fail on every request.
 */
function resolveConnection(): { name: string; value: string } | null {
  for (const name of CONNECTION_VARS) {
    const value = process.env[name];
    if (!value) continue;
    if (!/^postgres(ql)?:\/\//i.test(value)) {
      console.warn(`[lead] ignoring ${name}: not a postgres connection string`);
      continue;
    }
    return { name, value };
  }
  return null;
}

let schemaReady = false;

async function ensureSchema(sql: ReturnType<typeof neon<false, false>>) {
  if (schemaReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS leads (
      id          bigserial PRIMARY KEY,
      email       text NOT NULL UNIQUE,
      profile     jsonb,
      result      jsonb,
      source      text,
      created_at  timestamptz NOT NULL DEFAULT now()
    )
  `;
  schemaReady = true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = typeof req.body === "string" ? safeParse(req.body) : req.body;
  const email = String(body?.email ?? "").trim().toLowerCase();

  if (!EMAIL_RE.test(email) || email.length > 320) {
    return res.status(400).json({ error: "Invalid email address" });
  }

  const profile = body?.profile ?? null;
  const result = body?.result ?? null;
  const source = typeof body?.source === "string" ? body.source.slice(0, 64) : "optimizer";

  const connection = resolveConnection();

  if (!connection) {
    console.log(
      `[lead] no Postgres connection string configured (checked ${CONNECTION_VARS.join(", ")}) — not persisted`,
      { email, source }
    );
    return res.status(200).json({ ok: true, persisted: false, reason: "no-database" });
  }

  try {
    const sql = neon(connection.value);
    await ensureSchema(sql);
    await sql`
      INSERT INTO leads (email, profile, result, source)
      VALUES (${email}, ${profile}, ${result}, ${source})
      ON CONFLICT (email) DO UPDATE
        SET profile = EXCLUDED.profile,
            result  = EXCLUDED.result,
            source  = EXCLUDED.source
    `;
    console.log(`[lead] persisted via ${connection.name}`, { email, source });
    return res.status(200).json({ ok: true, persisted: true, via: connection.name });
  } catch (err) {
    // Never block the user's unlock on a storage failure — but make the failure
    // loud in the logs, since the caller cannot see it.
    console.error(`[lead] persist FAILED using ${connection.name}`, err);
    return res.status(200).json({ ok: true, persisted: false, reason: "write-failed" });
  }
}

function safeParse(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
