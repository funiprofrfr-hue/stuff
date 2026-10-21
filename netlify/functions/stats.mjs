import { getDatabase } from "@netlify/database";
import { createHash } from "node:crypto";

export const config = { path: "/api/stats" };

const RANKS = ["Founder", "Captain", "Head Of Military Affairs", "Chief", "Commander", "Head of Planning", "Head of Preparation", "Head of Military Preparation", "Head of Music", "Lieutenant", "Soldier", "Recruit", "Member"];
const MAX_JOINS_PER_IP = 5; // friends sharing wifi still fit
const best = (r) => Math.min(...r.map((x) => RANKS.indexOf(x)).filter((i) => i >= 0), 99);
const json = (o, status = 200) => Response.json(o, { status, headers: { "Cache-Control": "no-store" } });

async function state(db, vid) {
  const c = await db.pool.query("SELECT clicks FROM stats WHERE id = 1");
  const m = await db.pool.query("SELECT visitor_id, name, real_name, ranks FROM members WHERE name IS NOT NULL ORDER BY joined_at");
  const list = m.rows.map((r) => ({ id: r.visitor_id, name: r.name, real: r.real_name, ranks: [...r.ranks].sort((a, b) => RANKS.indexOf(a) - RANKS.indexOf(b)) }));
  const me = list.find((r) => r.id === vid);
  // Real names are only sent to people who have joined.
  const roster = list.map(({ name, ranks, real }) => (me ? { name, ranks, real } : { name, ranks })).sort((a, b) => best(a.ranks) - best(b.ranks)).slice(0, 200);
  return { clicks: Number(c.rows[0].clicks), members: list.length, roster, me: me ? { name: me.name, ranks: me.ranks, real: me.real } : null };
}

export default async (req, context) => {
  const db = getDatabase();
  if (req.method === "GET") return json(await state(db, req.headers.get("x-visitor-id") || ""));
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let body;
  try { body = await req.json(); } catch { return json({ error: "Bad request" }, 400); }
  const vid = String(body.visitorId || "");
  if (!/^[\w-]{20,64}$/.test(vid)) return json({ error: "Bad visitor id" }, 400);

  if (body.action === "click") {
    await db.pool.query("UPDATE stats SET clicks = clicks + 1 WHERE id = 1"); // atomic
  } else if (body.action === "join") {
    const name = String(body.name || "").normalize("NFKC").trim().replace(/\s+/g, " ");
    if (!/^[\p{L}\p{N} _.\-]{2,20}$/u.test(name))
      return json({ error: "Names are 2-20 letters, numbers, spaces, _ . or -" }, 400);
    const real = String(body.realName || "").normalize("NFKC").trim().replace(/\s+/g, " ");
    if (!/^[\p{L} .'\-]{2,40}$/u.test(real))
      return json({ error: "Enter your real name (2-40 letters)." }, 400);
    const key = name.toLowerCase();
    const ex = await db.pool.query("SELECT name FROM members WHERE visitor_id = $1", [vid]);
    if (!(ex.rows[0] && ex.rows[0].name)) {
      const ipHash = createHash("sha256").update(String(context?.ip || "unknown")).digest("hex");
      const n = await db.pool.query("SELECT count(*) AS c FROM members WHERE ip_hash = $1", [ipHash]);
      if (Number(n.rows[0].c) >= MAX_JOINS_PER_IP && !ex.rows[0])
        return json({ error: "Too many people have joined from this connection." }, 429);
      try {
        if (ex.rows[0]) await db.pool.query("UPDATE members SET name = $2, name_key = $3, real_name = $4 WHERE visitor_id = $1", [vid, name, key, real]);
        else await db.pool.query("INSERT INTO members (visitor_id, ip_hash, name, name_key, real_name) VALUES ($1, $2, $3, $4, $5)", [vid, ipHash, name, key, real]);
      } catch (e) {
        if (e && e.code === "23505") return json({ error: "That name is already taken." }, 409);
        throw e;
      }
    }
  } else return json({ error: "Unknown action" }, 400);

  return json(await state(db, vid));
};
