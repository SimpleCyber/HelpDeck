import { NextRequest, NextResponse } from "next/server";
import { UAParser } from "ua-parser-js";
import { redis } from "@/lib/redis";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, websiteId, payload } = body;

    if (!websiteId || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400, headers: corsHeaders },
      );
    }

    const dateKey = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // Parse User Agent
    const uaString = req.headers.get("user-agent") || "";
    const parser = new UAParser();
    parser.setUA(uaString);
    const device = parser.getDevice();
    const browser = parser.getBrowser();
    const os = parser.getOS();

    // Get Country from Vercel headers (or fallback)
    const country = req.headers.get("x-vercel-ip-country") || "Unknown";

    // 1. Process Event based on Type
    const pipeline = redis.pipeline();

    // Base keys
    const statsKey = `analytics:${websiteId}:${dateKey}`;

    if (type === "pageview") {
      // Increment total pageviews
      pipeline.hincrby(statsKey, "pageviews", 1);

      // Track valid unique visitors
      if (payload.sessionId) {
        pipeline.pfadd(
          `analytics:${websiteId}:${dateKey}:visitors`,
          payload.sessionId,
        );
      }

      // Track URL specific views
      if (payload.url) {
        pipeline.zincrby(
          `analytics:${websiteId}:${dateKey}:pages`,
          1,
          payload.url,
        );
      }

      // Track Referrer
      if (payload.referrer) {
        try {
          const refUrl = new URL(payload.referrer);
          pipeline.zincrby(
            `analytics:${websiteId}:${dateKey}:referrers`,
            1,
            refUrl.hostname,
          );
        } catch (e) {
          // ignore invalid referrers
        }
      }

      // Track Device/Browser/OS
      const deviceType = device.type || "desktop";
      pipeline.hincrby(
        `analytics:${websiteId}:${dateKey}:devices`,
        deviceType,
        1,
      );
      pipeline.hincrby(
        `analytics:${websiteId}:${dateKey}:browsers`,
        browser.name || "Unknown",
        1,
      );
      pipeline.hincrby(
        `analytics:${websiteId}:${dateKey}:os`,
        os.name || "Unknown",
        1,
      );
      pipeline.hincrby(
        `analytics:${websiteId}:${dateKey}:countries`,
        country,
        1,
      );
    }

    if (type === "session_end") {
      if (payload.duration) {
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

        if (payload.rating) {
          pipeline.hincrby(
            `analytics:${websiteId}:${dateKey}:vitals:${metricKey}`,
            payload.rating,
            1,
          );
        }
      }
    }

    await pipeline.exec();

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    console.error("Analytics Error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500, headers: corsHeaders },
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: "Analytics API Operational" });
}
