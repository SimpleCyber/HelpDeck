import { NextRequest, NextResponse } from "next/server";
import {
  getDailyStats,
  getDeviceStats,
  getGeoStats,
  getLiveVisitors,
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

    // Fetch all stats in parallel
    const [daily, devices, geo, live] = await Promise.all([
      getDailyStats(workspaceId, 7),
      getDeviceStats(workspaceId, 7),
      getGeoStats(workspaceId, 7),
      getLiveVisitors(workspaceId),
    ]);

    return NextResponse.json({
      daily,
      devices,
      geo,
      live,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
