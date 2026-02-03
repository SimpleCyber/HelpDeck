import { NextRequest, NextResponse } from "next/server";
import { UAParser } from "ua-parser-js";
import { redis } from "@/lib/redis";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, websiteId, payload } = body;

    // 1. Basic Validation
    if (!websiteId || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400, headers: corsHeaders },
      );
    }

    // 2. Server-side Bot Detection
    const uaString = req.headers.get("user-agent") || payload.ua || "";
    const lowerUA = uaString.toLowerCase();

    // Simple block list for obvious bots
    const isBot =
      lowerUA.includes("bot") ||
      lowerUA.includes("crawl") ||
      lowerUA.includes("spider") ||
      lowerUA.includes("headless") ||
      lowerUA.includes("lighthouse");

    if (isBot) {
      return NextResponse.json(
        { success: true, ignored: true },
        { headers: corsHeaders },
      );
    }

    const dateKey = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const parser = new UAParser(uaString);
    const device = parser.getDevice();
    const browser = parser.getBrowser();
    const os = parser.getOS();
    const country = req.headers.get("x-vercel-ip-country") || "Unknown";

    const pipeline = redis.pipeline();
    const statsKey = `analytics:${websiteId}:${dateKey}`;
    const TTL = 60 * 60 * 24 * 90; // 90 Days retention

    // Track Live Visitors (Any activity refreshes presence)
    const visitorId =
      payload.visitorId ||
      payload.sessionId ||
      req.headers.get("x-forwarded-for") ||
      "unknown";
    if (visitorId) {
      const timestamp = Date.now();
      pipeline.zadd(`analytics:${websiteId}:live`, {
        score: timestamp,
        member: visitorId,
      });
      // Keep only last 60 minutes in the set to keep it small
      pipeline.zremrangebyscore(
        `analytics:${websiteId}:live`,
        0,
        timestamp - 60 * 60 * 1000,
      );
      pipeline.expire(`analytics:${websiteId}:live`, TTL);
    }

    if (type === "pageview") {
      // Counters
      pipeline.hincrby(statsKey, "pageviews", 1);
      pipeline.expire(statsKey, TTL);

      // Unique Visitors (Use visitorId if available, fallback to session or IP)
      // Switch to visitorId for true unique counts over long term
      if (visitorId) {
        pipeline.pfadd(`analytics:${websiteId}:${dateKey}:visitors`, visitorId);
        pipeline.expire(`analytics:${websiteId}:${dateKey}:visitors`, TTL);
      }

      // Unique Sessions (Daily)
      if (payload.sessionId) {
        pipeline.pfadd(
          `analytics:${websiteId}:${dateKey}:sessions`,
          payload.sessionId,
        );
        pipeline.expire(`analytics:${websiteId}:${dateKey}:sessions`, TTL);
      }

      // Pages
      if (payload.path || payload.url) {
        const path = payload.path || new URL(payload.url).pathname;
        pipeline.zincrby(`analytics:${websiteId}:${dateKey}:pages`, 1, path);
        pipeline.expire(`analytics:${websiteId}:${dateKey}:pages`, TTL);
      }

      // Referrers
      if (payload.referrer) {
        try {
          const refUrl = new URL(payload.referrer);
          // Only track external referrers
          const currentHost = new URL(payload.url || "http://localhost")
            .hostname;
          if (refUrl.hostname !== currentHost) {
            pipeline.zincrby(
              `analytics:${websiteId}:${dateKey}:referrers`,
              1,
              refUrl.hostname,
            );
            pipeline.expire(`analytics:${websiteId}:${dateKey}:referrers`, TTL);
          }
        } catch (e) {}
      }

      // Metadata
      const deviceType = device.type || "desktop";
      pipeline.hincrby(
        `analytics:${websiteId}:${dateKey}:devices`,
        deviceType,
        1,
      );
      pipeline.expire(`analytics:${websiteId}:${dateKey}:devices`, TTL);

      pipeline.hincrby(
        `analytics:${websiteId}:${dateKey}:browsers`,
        browser.name || "Unknown",
        1,
      );
      pipeline.expire(`analytics:${websiteId}:${dateKey}:browsers`, TTL);

      pipeline.hincrby(
        `analytics:${websiteId}:${dateKey}:os`,
        os.name || "Unknown",
        1,
      );
      pipeline.expire(`analytics:${websiteId}:${dateKey}:os`, TTL);

      pipeline.hincrby(
        `analytics:${websiteId}:${dateKey}:countries`,
        country,
        1,
      );
      pipeline.expire(`analytics:${websiteId}:${dateKey}:countries`, TTL);
    }

    if (type === "session_end") {
      if (
        payload.duration &&
        payload.duration > 0 &&
        payload.duration < 86400000
      ) {
        pipeline.hincrby(
          statsKey,
          "total_duration",
          Math.round(payload.duration),
        );
        pipeline.hincrby(statsKey, "sessions_with_duration", 1);
      }
    }

    if (type === "vitals") {
      if (payload.metric && payload.value) {
        const metricKey = payload.metric.toLowerCase();
        pipeline.hincrby(
          statsKey,
          `vitals_${metricKey}_sum`,
          Math.round(payload.value),
        );
        pipeline.hincrby(statsKey, `vitals_${metricKey}_count`, 1);
        pipeline.expire(statsKey, TTL);

        if (payload.rating) {
          pipeline.hincrby(
            `analytics:${websiteId}:${dateKey}:vitals:${metricKey}`,
            payload.rating,
            1,
          );
          pipeline.expire(
            `analytics:${websiteId}:${dateKey}:vitals:${metricKey}`,
            TTL,
          );
        }
      }
    }

    await pipeline.exec();

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    console.error("Analytics Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: corsHeaders },
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: "Analytics API Operational" });
}
