"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import {
  Loader2,
  TrendingUp,
  Users,
  Clock,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyticsDashboardProps {
  workspaceId: string;
}

export function AnalyticsDashboard({ workspaceId }: AnalyticsDashboardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch data function
  const fetchData = async (isPolling = false) => {
    if (!workspaceId) return;
    try {
      const res = await fetch(`/api/analytics/${workspaceId}`);
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Failed to fetch analytics", error);
    } finally {
      if (!isPolling) setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchData();

    // Poll every 5 seconds for live data
    const interval = setInterval(() => {
      fetchData(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [workspaceId]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
      </div>
    );
  }

  if (!data) return null;

  const { daily, devices, geo, live } = data;

  // Calculate totals
  const totalVisitors = daily.reduce(
    (acc: number, d: any) => acc + (d.visitors || 0),
    0,
  );
  const totalPageviews = daily.reduce(
    (acc: number, d: any) => acc + (d.pageviews || 0),
    0,
  );
  const avgDuration =
    daily.length > 0
      ? Math.round(
          daily.reduce((acc: number, d: any) => acc + (d.avgDuration || 0), 0) /
            daily.length /
            1000,
        )
      : 0; // seconds

  const deviceData = [
    { name: "Desktop", value: devices.desktop || 0, color: "#3b82f6" },
    { name: "Mobile", value: devices.mobile || 0, color: "#8b5cf6" },
    { name: "Tablet", value: devices.tablet || 0, color: "#f59e0b" },
    { name: "Other", value: devices.other || 0, color: "#64748b" },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {totalVisitors === 0 && !loading && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-4 text-amber-900">
          <div className="bg-amber-100 p-3 rounded-xl">
            <AlertTriangle className="text-amber-600" size={24} />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-lg">No Analytics Data Yet</h4>
            <p className="text-sm text-amber-800/80">
              We haven't received any data for this workspace. Ensure the widget
              is embedded on your website and visitors are accessing it.
            </p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Live Users Card */}
        <div className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border-color)] shadow-sm relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 bg-green-500/10 w-24 h-24 rounded-full group-hover:bg-green-500/20 transition-all" />
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-green-50 text-green-600 p-3 rounded-xl relative">
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--text-muted)]">
                Live Now
              </p>
              <h3 className="text-2xl font-black text-[var(--text-main)]">
                {live || 0}
              </h3>
            </div>
          </div>
          <div className="h-1 w-full bg-green-100 rounded-full overflow-hidden mt-4">
            <div className="h-full bg-green-500 animate-pulse w-full" />
          </div>
        </div>

        {/* Total Visitors Card */}
        <div className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border-color)] shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--text-muted)]">
                Total Visitors
              </p>
              <h3 className="text-2xl font-black text-[var(--text-main)]">
                {totalVisitors}
              </h3>
            </div>
          </div>
          <div className="h-1 w-full bg-blue-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 w-2/3" />
            {/* Placeholder progress */}
          </div>
        </div>

        {/* Page Views Card */}
        <div className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border-color)] shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-purple-50 text-purple-600 p-3 rounded-xl">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--text-muted)]">
                Page Views
              </p>
              <h3 className="text-2xl font-black text-[var(--text-main)]">
                {totalPageviews}
              </h3>
            </div>
          </div>
        </div>

        {/* Avg Duration Card */}
        <div className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border-color)] shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-orange-50 text-orange-600 p-3 rounded-xl">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--text-muted)]">
                Avg. Duration
              </p>
              <h3 className="text-2xl font-black text-[var(--text-main)]">
                {avgDuration}s
              </h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-[var(--bg-card)] p-8 rounded-[32px] border border-[var(--border-color)] shadow-sm">
          <h3 className="text-xl font-black text-[var(--text-main)] mb-6">
            Traffic Overview
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={daily}>
                <defs>
                  <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border-color)"
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                  tickFormatter={(val) =>
                    new Date(val).toLocaleDateString(undefined, {
                      weekday: "short",
                    })
                  }
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--bg-card)",
                    borderRadius: "12px",
                    border: "1px solid var(--border-color)",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="pageviews"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorPv)"
                />
                <Area
                  type="monotone"
                  dataKey="visitors"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  fillOpacity={0}
                  fill="transparent"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Device Distribution */}
        <div className="bg-[var(--bg-card)] p-8 rounded-[32px] border border-[var(--border-color)] shadow-sm">
          <h3 className="text-xl font-black text-[var(--text-main)] mb-6">
            Devices
          </h3>
          <div className="h-[200px] w-full flex items-center justify-center">
            {deviceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--bg-card)",
                      borderRadius: "12px",
                      border: "1px solid var(--border-color)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-[var(--text-muted)] text-sm">
                No data yet
              </div>
            )}
          </div>
          <div className="mt-6 space-y-3">
            {deviceData.map((d, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ background: d.color }}
                  />
                  <span className="text-sm font-bold text-[var(--text-muted)]">
                    {d.name}
                  </span>
                </div>
                <span className="text-sm font-bold text-[var(--text-main)]">
                  {d.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Geo Data */}
      <div className="bg-[var(--bg-card)] p-8 rounded-[32px] border border-[var(--border-color)] shadow-sm">
        <h3 className="text-xl font-black text-[var(--text-main)] mb-6">
          Top Countries
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            {geo && geo.length > 0 ? (
              geo.map((g: any, i: number) => {
                const countryName =
                  g.country === "Unknown"
                    ? "Unknown Region"
                    : new Intl.DisplayNames(["en"], { type: "region" }).of(
                        g.country,
                      ) || g.country;

                return (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--bg-main)] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {g.country === "Unknown" ? (
                        <Globe size={16} className="text-blue-500" />
                      ) : (
                        <img
                          src={`https://flagcdn.com/w40/${g.country.toLowerCase()}.png`}
                          srcSet={`https://flagcdn.com/w80/${g.country.toLowerCase()}.png 2x`}
                          width={24}
                          height={16}
                          alt={countryName}
                          className="w-6 h-4 object-cover rounded shadow-sm border border-black/5"
                        />
                      )}
                      <span
                        className="font-bold text-[var(--text-main)] truncate max-w-[140px]"
                        title={countryName}
                      >
                        {countryName}
                      </span>
                    </div>
                    <span className="font-mono text-sm font-bold text-[var(--text-muted)]">
                      {g.visitors}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-[var(--text-muted)] italic">
                No geographical data available yet.
              </div>
            )}
          </div>

          {/* Info/Upsell area */}
          <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-6 flex flex-col justify-center items-center text-center border border-blue-500/20">
            <Globe size={48} className="text-blue-500 mb-4 opacity-50" />
            <h4 className="font-bold text-lg text-[var(--text-main)] mb-2">
              Global Reach
            </h4>
            <p className="text-sm text-[var(--text-muted)]">
              Your chatbot is serving users from {geo?.length || 0} different
              regions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
