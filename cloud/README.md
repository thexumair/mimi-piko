# Mimi Piko Cloud (Vercel)

The cloud part of Mimi Piko. Mimi sends a reading every minute. This project stores the readings, shows a live dashboard and sends a "Mimi is thirsty!" phone alert.

```
mimi-cloud/
  index.html        live dashboard (mood, moisture, 24 h chart, waterings, alert)
  api/reading.js    POST: Mimi sends readings here (protected by DEVICE_KEY)
  api/data.js       GET: the dashboard reads data from here
  api/_db.js        Redis connection (Upstash, from the Vercel Marketplace)
  package.json
```

## 1. Put it on Vercel

1. Create a free account at vercel.com (sign in with GitHub is easiest).
2. Upload this `mimi-cloud` folder to a new GitHub repository.
3. In Vercel: **Add New > Project**, import that repository, keep Framework Preset as **Other**, click **Deploy**.
4. You get a link like `https://mimi-cloud-xyz.vercel.app`. That's your dashboard.

## 2. Add the database

1. In your Vercel project open the **Storage** tab.
2. Choose **Upstash (Redis)** from the Marketplace, create a database on the free plan, and connect it to this project.
3. Vercel adds the database keys to the project automatically. The code accepts either `KV_REST_API_URL` / `KV_REST_API_TOKEN` or `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`.

## 3. Add your settings

Project **Settings > Environment Variables**:

| Name | Example | What it does |
|---|---|---|
| `DEVICE_KEY` | `mimi-7f3k9q2x` | Secret password Mimi sends. Put the same text in the Arduino code. |
| `NTFY_TOPIC` | `mimi-piko-umair-4821` | Phone alert channel. Make it hard to guess. |
| `ALERT_AFTER_MIN` | `60` | Minutes of dry soil before the alert. Use `2` for a live demo. |

Then go to **Deployments** and **Redeploy** so the settings take effect.

## 4. Get alerts on your phone

Install the free **ntfy** app (Android or iPhone), tap **+**, and subscribe to the same topic name as `NTFY_TOPIC`.

## 5. Test without the pot (optional)

```
curl -X POST https://YOUR-PROJECT.vercel.app/api/reading \
  -H "Content-Type: application/json" -H "x-device-key: YOUR_DEVICE_KEY" \
  -d "{\"raw\":3100,\"pct\":17,\"dry\":true,\"waterings\":0}"
```

Open the dashboard. The reading should appear within 15 seconds.

## 6. Mimi (Arduino)

In `Mimi_Piko_Cloud.ino` set `WIFI_SSID`, `WIFI_PASS`, `CLOUD_URL` (`https://YOUR-PROJECT.vercel.app/api/reading`) and `DEVICE_KEY`.

Keep the original wiring (AO on GPIO 14). The code turns WiFi on only for a few seconds each minute to upload, because GPIO 14 can't be read while WiFi is on.

## Notes

- The database keeps the last 24 hours of readings (1 per minute) and the last 100 waterings.
- Upstash's free plan has a monthly request limit. One reading a minute plus a dashboard open now and then fits a class project. Check usage in the Upstash console if you leave it running for weeks.
