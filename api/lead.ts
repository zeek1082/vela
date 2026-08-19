import type { VercelRequest, VercelResponse } from "@vercel/node";
import { neon } from "@neondatabase/serverless";

/**
 * Lead capture endpoint.
 *
 * POST /api/lead  { email, profile, result }
 *
 * Storage is optional so the site deploys and works before a database exists:
 *   - If DATABASE_URL is set (Neon Postgres), the lead is inserted.
 *   - If not, the lead is logged to the function log and the request still succeeds,
 *     so the results page unlocks either way.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.log("[lead] (no DATABASE_URL — not persisted)", { email, source });
    return res.status(200).json({ ok: true, persisted: false });
  }

  try {
    const sql = neon(connectionString);
    await ensureSchema(sql);
    await sql`
      INSERT INTO leads (email, profile, result, source)
      VALUES (${email}, ${profile}, ${result}, ${source})
      ON CONFLICT (email) DO UPDATE
        SET profile = EXCLUDED.profile,
            result  = EXCLUDED.result,
            source  = EXCLUDED.source
    `;
    return res.status(200).json({ ok: true, persisted: true });
  } catch (err) {
    // Never block the user's unlock on a storage failure.
    console.error("[lead] persist failed", err);
    return res.status(200).json({ ok: true, persisted: false });
  }
}

function safeParse(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
