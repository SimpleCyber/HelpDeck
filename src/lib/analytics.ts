import { redis } from "@/lib/redis";

export interface DailyStats {
  date: string;
  pageviews: number;
  visitors: number;
  sessions: number;
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

export interface BreakdownItem {
  name: string;
  value: number;
}

function getDateKeys(days: number): string[] {
  const keys: string[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    keys.push(d.toISOString().split("T")[0]);
  }
  return keys;
}

export async function getDailyStats(
  websiteId: string,
  days: number = 7,
): Promise<DailyStats[]> {
  const dateKeys = getDateKeys(days);

  return Promise.all(
    dateKeys.map(async (dateKey) => {
      const statsKey = `analytics:${websiteId}:${dateKey}`;
      const [pageviews, durationSum, durationCount, visitors, sessions] =
        await Promise.all([
          redis.hget(statsKey, "pageviews"),
          redis.hget(statsKey, "total_duration"),
          redis.hget(statsKey, "sessions_with_duration"),
          redis.pfcount(`analytics:${websiteId}:${dateKey}:visitors`),
          redis.pfcount(`analytics:${websiteId}:${dateKey}:sessions`),
        ]);

      const pv = parseInt((pageviews as string) || "0");
      const durSum = parseInt((durationSum as string) || "0");
      const durCount = parseInt((durationCount as string) || "0");

      return {
        date: dateKey,
        pageviews: pv,
        visitors: visitors || 0,
        sessions: sessions || 0,
        avgDuration: durCount > 0 ? Math.round(durSum / durCount) : 0,
      };
    }),
  );
}

export async function getDeviceStats(
  websiteId: string,
  days: number = 7,
): Promise<DeviceStats> {
  const devices = { desktop: 0, mobile: 0, tablet: 0, other: 0 };
  const dateKeys = getDateKeys(days);

  const results = await Promise.all(
    dateKeys.map((dateKey) =>
      redis.hgetall<Record<string, number>>(
        `analytics:${websiteId}:${dateKey}:devices`,
      ),
    ),
  );

  for (const data of results) {
    if (data) {
      devices.desktop += Number(data.desktop || 0);
      devices.mobile += Number(data.mobile || 0);
      devices.tablet += Number(data.tablet || 0);
      devices.other +=
        Number(data.console || 0) +
        Number(data.smarttv || 0) +
        Number(data.wearable || 0) +
        Number(data.embedded || 0);
    }
  }

  return devices;
}

async function aggregateHashStats(
  websiteId: string,
  days: number,
  suffix: string,
  limit: number = 10,
): Promise<BreakdownItem[]> {
  const totals: Record<string, number> = {};
  const dateKeys = getDateKeys(days);

  const results = await Promise.all(
    dateKeys.map((dateKey) =>
      redis.hgetall<Record<string, number>>(
        `analytics:${websiteId}:${dateKey}:${suffix}`,
      ),
    ),
  );

  for (const dayData of results) {
    if (dayData) {
      Object.entries(dayData).forEach(([key, count]) => {
        totals[key] = (totals[key] || 0) + Number(count || 0);
      });
    }
  }

  return Object.entries(totals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

async function aggregateZsetStats(
  websiteId: string,
  days: number,
  suffix: string,
  limit: number = 10,
): Promise<BreakdownItem[]> {
  const totals: Record<string, number> = {};
  const dateKeys = getDateKeys(days);

  const results = await Promise.all(
    dateKeys.map((dateKey) =>
      redis.zrange<Array<string | number>>(
        `analytics:${websiteId}:${dateKey}:${suffix}`,
        0,
        -1,
        { withScores: true },
      ),
    ),
  );

  for (const list of results) {
    if (Array.isArray(list)) {
      for (let i = 0; i < list.length; i += 2) {
        const member = String(list[i]);
        const score = Number(list[i + 1] || 0);
        if (member) {
          totals[member] = (totals[member] || 0) + score;
        }
      }
    }
  }

  return Object.entries(totals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export async function getGeoStats(
  websiteId: string,
  days: number = 7,
): Promise<GeoStats[]> {
  const items = await aggregateHashStats(websiteId, days, "countries", 10);
  return items.map((item) => ({ country: item.name, visitors: item.value }));
}

export async function getTopPages(
  websiteId: string,
  days: number = 7,
): Promise<BreakdownItem[]> {
  return aggregateZsetStats(websiteId, days, "pages", 10);
}

export async function getTopReferrers(
  websiteId: string,
  days: number = 7,
): Promise<BreakdownItem[]> {
  return aggregateZsetStats(websiteId, days, "referrers", 10);
}

export async function getBrowserStats(
  websiteId: string,
  days: number = 7,
): Promise<BreakdownItem[]> {
  return aggregateHashStats(websiteId, days, "browsers", 10);
}

export async function getOsStats(
  websiteId: string,
  days: number = 7,
): Promise<BreakdownItem[]> {
  return aggregateHashStats(websiteId, days, "os", 10);
}

export async function getLiveVisitors(websiteId: string): Promise<number> {
  const timestamp = Date.now();
  const thirtyMinsAgo = timestamp - 30 * 60 * 1000;

  try {
    const count = await redis.zcount(
      `analytics:${websiteId}:live`,
      thirtyMinsAgo,
      "+inf",
    );
    return count || 0;
  } catch (error) {
    console.error("Error fetching live visitors:", error);
    return 0;
  }
}
