// Shared Redis client. Works with the env var names from either the
// Vercel Marketplace (KV_REST_API_*) or Upstash directly (UPSTASH_REDIS_REST_*).
import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

export const K = {
  latest: "mimi:latest",       // last reading
  history: "mimi:history",     // list of readings, newest first
  waterings: "mimi:waterings", // list of watering times (ms), newest first
  count: "mimi:waterCount",    // total waterings
  alert: "mimi:alert",         // { dryStart, alerted }
};

export const HISTORY_MAX = 1440; // 1 reading/min = last 24 hours
