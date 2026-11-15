// POST /api/reading  <- called by Mimi Piko every minute
// Header:  x-device-key: <DEVICE_KEY>
// Body:    { "raw": 3120, "pct": 18, "dry": true, "waterings": 0 }
import { redis, K, HISTORY_MAX } from "./_db.js";

const ALERT_AFTER_MIN = Number(process.env.ALERT_AFTER_MIN || 60); // dry this long -> alert

async function notify(title, message, tags) {
  const topic = process.env.NTFY_TOPIC;
  if (!topic) return;
  try {
    await fetch(`https://ntfy.sh/${encodeURIComponent(topic)}`, {
      method: "POST",
      headers: { Title: title, Tags: tags, Priority: "high" },
      body: message,
    });
  } catch (e) {
    console.error("ntfy failed", e);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!process.env.DEVICE_KEY || req.headers["x-device-key"] !== process.env.DEVICE_KEY) {
    return res.status(401).json({ error: "bad device key" });
  }

  const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const raw = Math.round(Number(b.raw));
  const pct = Math.max(0, Math.min(100, Math.round(Number(b.pct))));
  const dry = Boolean(b.dry);
  const waterings = Math.max(0, Math.min(10, Math.round(Number(b.waterings) || 0)));
  if (!Number.isFinite(raw)) return res.status(400).json({ error: "raw missing" });

  const t = Date.now();
  const reading = { t, raw, pct, dry };

  const p = redis.pipeline();
  p.set(K.latest, reading);
  p.lpush(K.history, reading);
  p.ltrim(K.history, 0, HISTORY_MAX - 1);
  for (let i = 0; i < waterings; i++) p.lpush(K.waterings, t);
  if (waterings) {
    p.ltrim(K.waterings, 0, 99);
    p.incrby(K.count, waterings);
  }
  await p.exec();

  // ---- thirsty alert ----
  const alert = (await redis.get(K.alert)) || { dryStart: null, alerted: false };
  if (dry) {
    if (!alert.dryStart) alert.dryStart = t;
    const dryMin = (t - alert.dryStart) / 60000;
    if (!alert.alerted && dryMin >= ALERT_AFTER_MIN) {
      await notify("Mimi is thirsty!", `The soil has been dry for ${Math.round(dryMin)} minutes. Please water me.`, "potted_plant,droplet");
      alert.alerted = true;
    }
  } else {
    if (alert.alerted) await notify("Thank you!", "Mimi got water and is happy again.", "potted_plant,smile");
    alert.dryStart = null;
    alert.alerted = false;
  }
  await redis.set(K.alert, alert);

  return res.status(200).json({ ok: true, t });
}
