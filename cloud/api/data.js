// GET /api/data  -> everything the dashboard needs
import { redis, K } from "./_db.js";

export default async function handler(req, res) {
  const [latest, history, waterings, count, alert] = await Promise.all([
    redis.get(K.latest),
    redis.lrange(K.history, 0, 1439),
    redis.lrange(K.waterings, 0, 19),
    redis.get(K.count),
    redis.get(K.alert),
  ]);
  const now = Date.now();
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({
    now,
    online: !!latest && now - latest.t < 3 * 60 * 1000,
    latest: latest || null,
    history: (history || []).reverse(),          // oldest first, for the chart
    waterings: (waterings || []).map(Number),     // newest first
    waterCount: Number(count || 0),
    alert: alert || { dryStart: null, alerted: false },
    alertAfterMin: Number(process.env.ALERT_AFTER_MIN || 60),
  });
}
