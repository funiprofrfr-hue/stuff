import { getDatabase } from "@netlify/database";
import { createHash } from "node:crypto";

export const config = { path: "/api/stats" };

// Max members that can join from one IP address (friends sharing wifi still fit).
const MAX_JOINS_PER_IP = 5;

async function counts(db) {
  const { rows } = await db.pool.query(
    "SELECT (SELECT clicks FROM stats WHERE id = 1) AS clicks, (SELECT count(*) FROM members) AS members"
  );
  return { clicks: Number(rows[0].clicks), members: Number(rows[0].members) };
}

export default async (req, context) => {
  const db = getDatabase();

  if (req.method === "POST") {
    let body = {};
    try { body = await req.json(); } catch { return new Response("Bad request", { status: 400 }); }

    if (body.action === "click") {
      // Atomic increment: simultaneous clicks are all counted.
      await db.pool.query("UPDATE stats SET clicks = clicks + 1 WHERE id = 1");
    } else if (body.action === "join") {
      const id = String(body.visitorId || "");
      if (!/^[\w-]{20,64}$/.test(id)) return new Response("Bad visitor id", { status: 400 });
      const ipHash = createHash("sha256").update(String(context?.ip || "unknown")).digest("hex");
      const { rows } = await db.pool.query("SELECT count(*) AS c FROM members WHERE ip_hash = $1", [ipHash]);
      if (Number(rows[0].c) < MAX_JOINS_PER_IP) {
        // Same visitor id can only ever exist once.
        await db.pool.query(
          "INSERT INTO members (visitor_id, ip_hash) VALUES ($1, $2) ON CONFLICT (visitor_id) DO NOTHING",
          [id, ipHash]
        );
      }
    } else {
      return new Response("Unknown action", { status: 400 });
    }
  } else if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  return Response.json(await counts(db), { headers: { "Cache-Control": "no-store" } });
};
