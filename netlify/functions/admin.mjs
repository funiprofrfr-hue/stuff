import { getDatabase } from "@netlify/database";
import { createHash, timingSafeEqual } from "node:crypto";

export const config = { path: "/api/admin" };

const RANKS = ["Founder", "Captain", "Head Of Military Affairs", "Chief", "Commander", "Head of Planning", "Head of Preparation", "Head of Military Preparation", "Head of Music", "Lieutenant", "Soldier", "Recruit", "Member"];
const h = (s) => createHash("sha256").update(String(s)).digest();
const json = (o, status = 200) => Response.json(o, { status, headers: { "Cache-Control": "no-store" } });

export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  // Hardcoded fallback password. If you set ADMIN_PASSWORD in Netlify, that is used instead.
  const pw = process.env.ADMIN_PASSWORD || "babychairgangyeah";
  if (!pw) return json({ error: "Set the ADMIN_PASSWORD environment variable in Netlify first." }, 503);
  let b;
  try { b = await req.json(); } catch { return json({ error: "Bad request" }, 400); }
  if (!timingSafeEqual(h(b.password || ""), h(pw))) {
    await new Promise((r) => setTimeout(r, 700));
    return json({ error: "Wrong password" }, 401);
  }
  const db = getDatabase();
  const key = String(b.name || "").toLowerCase();
  if (b.action === "setRanks") {
    let ranks = RANKS.filter((r) => (b.ranks || []).includes(r));
    if (!ranks.length) ranks = ["Member"];
    await db.pool.query("UPDATE members SET ranks = $2 WHERE name_key = $1", [key, ranks]);
  } else if (b.action === "remove") {
    await db.pool.query("DELETE FROM members WHERE name_key = $1", [key]);
  } else if (b.action !== "list") return json({ error: "Unknown action" }, 400);
  const { rows } = await db.pool.query("SELECT name, real_name, ranks, joined_at FROM members WHERE name IS NOT NULL ORDER BY joined_at");
  return json({ ranks: RANKS, members: rows });
};
