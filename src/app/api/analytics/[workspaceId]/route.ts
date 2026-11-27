import { NextRequest, NextResponse } from "next/server";
import {
  getDailyStats,
  getDeviceStats,
  getGeoStats,
  getLiveVisitors,
  getTopPages,
  getTopReferrers,
  getBrowserStats,
  getOsStats,
} from "@/lib/analytics";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const { workspaceId } = await params;

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Missing workspace ID" },
        { status: 400 },
      );
    }

    const daysParam = Number(req.nextUrl.searchParams.get("days") || "7");
    const days = [1, 7, 30].includes(daysParam) ? daysParam : 7;

    const [daily, devices, geo, live, pages, referrers, browsers, os] =
      await Promise.all([
        getDailyStats(workspaceId, days),
        getDeviceStats(workspaceId, days),
        getGeoStats(workspaceId, days),
        getLiveVisitors(workspaceId),
        getTopPages(workspaceId, days),
        getTopReferrers(workspaceId, days),
        getBrowserStats(workspaceId, days),
        getOsStats(workspaceId, days),
      ]);

    return NextResponse.json({
      daily,
      devices,
      geo,
      live,
      pages,
      referrers,
      browsers,
      os,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
