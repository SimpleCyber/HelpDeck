// import { redis } from "@/lib/redis";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL!,
  token: process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN!,
});

export interface DailyStats {
  date: string;
  pageviews: number;
  visitors: number;
  avgDuration: number;
}

export interface DeviceStats {
  desktop: number;
  mobile: number;
  tablet: number;
  other: number;
}

export interface GeoStats {
  country: string;
  visitors: number;
}

export async function getDailyStats(
  websiteId: string,
  days: number = 7,
): Promise<DailyStats[]> {
  const stats: DailyStats[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().split("T")[0];

    // Fetch stats for this day
    const statsKey = `analytics:${websiteId}:${dateKey}`;

    // Use pipeline for efficiency? Maybe not needed for loop of 7.
    // Let's just get the hash and pfcount
    const [pageviews, durationSum, durationCount, visitors] = await Promise.all(
      [
        redis.hget(statsKey, "pageviews"),
        redis.hget(statsKey, "total_duration"),
        redis.hget(statsKey, "sessions_with_duration"),
        redis.pfcount(`analytics:${websiteId}:${dateKey}:visitors`), // HyperLogLog count
      ],
    );

    const pv = parseInt((pageviews as string) || "0");
    const durSum = parseInt((durationSum as string) || "0");
    const durCount = parseInt((durationCount as string) || "0");

    stats.push({
      date: dateKey,
      pageviews: pv,
      visitors: visitors,
      avgDuration: durCount > 0 ? Math.round(durSum / durCount) : 0,
    });
  }

  return stats;
}

export async function getDeviceStats(
  websiteId: string,
  days: number = 7,
): Promise<DeviceStats> {
  // Aggregate over last X days
  const devices = { desktop: 0, mobile: 0, tablet: 0, other: 0 };
  const today = new Date();

  // This is a bit inefficient to loop, but for small scale fine.
  // Ideally, we'd maintain a "weekly" counter too or use Redis TimeSeries
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().split("T")[0];

    const data = await redis.hgetall<Record<string, number>>(
      `analytics:${websiteId}:${dateKey}:devices`,
    );

    if (data) {
      devices.desktop += data.desktop || 0;
      // Mobile sometimes comes as 'mobile', 'console', 'smarttv', etc.
      devices.mobile += data.mobile || 0;
      devices.tablet += data.tablet || 0;
      devices.other +=
        (data.console || 0) +
        (data.smarttv || 0) +
        (data.wearable || 0) +
        (data.embedded || 0);
    }
  }

  return devices;
}

export async function getGeoStats(
  websiteId: string,
  days: number = 7,
): Promise<GeoStats[]> {
  const countries: Record<string, number> = {};
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().split("T")[0];

    const dayData = await redis.hgetall<Record<string, number>>(
      `analytics:${websiteId}:${dateKey}:countries`,
    );
    if (dayData) {
      Object.entries(dayData).forEach(([country, count]) => {
        countries[country] = (countries[country] || 0) + (count as number);
      });
    }
  }

  return Object.entries(countries)
    .map(([country, visitors]) => ({ country, visitors }))
    .sort((a, b) => b.visitors - a.visitors)
    .slice(0, 10); // Top 10
}
