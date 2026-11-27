"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Loader2,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  RefreshCw,
  Settings,
  AlertTriangle,
  BarChart2,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyticsDashboardProps {
  workspaceId: string;
  workspaceName?: string;
}

type DateRange = 1 | 7 | 30;
type ChartMetric = "visitors" | "pageviews";
type SourceTab = "referrer" | "channel";
type SystemTab = "browser" | "os" | "device";

interface BreakdownRow {
  name: string;
  value: number;
  icon?: React.ReactNode;
}

function formatDuration(ms: number): string {
  if (!ms || ms <= 0) return "—";
  const totalSec = Math.round(ms / 1000);
  if (totalSec < 60) return `${totalSec}s`;
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

function BreakdownCard({
  tabs,
  activeTab,
  onTabChange,
  rows,
  emptyText,
}: {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onTabChange: (id: string) => void;
  rows: BreakdownRow[];
  emptyText: string;
}) {
  const maxVal = rows.reduce((m, r) => Math.max(m, r.value), 0) || 1;

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col min-h-[280px]">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)]">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onTabChange(t.id)}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-semibold transition-all",
                activeTab === t.id
                  ? "bg-[var(--bg-card)] text-[var(--text-main)] shadow-xs border border-[var(--border-color)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-main)]",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <span className="text-xs font-semibold text-[var(--text-muted)]">
          All ({rows.length})
        </span>
      </div>

      {rows.length > 0 ? (
        <div className="space-y-1.5 flex-1">
          {rows.map((row, idx) => {
            const pct = Math.max(4, Math.round((row.value / maxVal) * 100));
            return (
              <div
                key={`${row.name}-${idx}`}
                className="relative flex items-center justify-between px-3 py-2 rounded-lg overflow-hidden group"
              >
                <div
                  className="absolute inset-y-0 left-0 bg-sky-500/12 dark:bg-sky-400/15 rounded-lg transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
                <div className="relative flex items-center gap-2.5 min-w-0 pr-3">
                  {row.icon && (
                    <span className="shrink-0 flex items-center justify-center text-[var(--text-muted)]">
                      {row.icon}
                    </span>
                  )}
                  <span
                    className="text-xs font-semibold text-[var(--text-main)] truncate"
                    title={row.name}
                  >
                    {row.name}
                  </span>
                </div>
                <span className="relative text-xs font-bold text-[var(--text-main)] tabular-nums shrink-0">
                  {row.value.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-xs text-[var(--text-muted)] italic py-10">
          {emptyText}
        </div>
      )}
    </div>
  );
}

export function AnalyticsDashboard({
  workspaceId,
  workspaceName,
}: AnalyticsDashboardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [days, setDays] = useState<DateRange>(7);
  const [chartMetric, setChartMetric] = useState<ChartMetric>("visitors");
  const [sourceTab, setSourceTab] = useState<SourceTab>("referrer");
  const [systemTab, setSystemTab] = useState<SystemTab>("browser");

  const fetchData = useCallback(
    async (isBackground = false) => {
      if (!workspaceId) return;
      if (!isBackground) setRefreshing(true);
      try {
        const res = await fetch(`/api/analytics/${workspaceId}?days=${days}`);
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error("Failed to fetch analytics", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [workspaceId, days],
  );

  useEffect(() => {
    setLoading(true);
    fetchData();

    const interval = setInterval(() => {
      fetchData(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin h-7 w-7 text-sky-500" />
      </div>
    );
  }

  if (!data) return null;

  const {
    daily = [],
    devices = {},
    geo = [],
    live = 0,
    pages = [],
    referrers = [],
    browsers = [],
    os = [],
  } = data;

  const totalVisitors = daily.reduce(
    (acc: number, d: any) => acc + (d.visitors || 0),
    0,
  );
  const totalPageviews = daily.reduce(
    (acc: number, d: any) => acc + (d.pageviews || 0),
    0,
  );
  const totalSessions = daily.reduce(
    (acc: number, d: any) => acc + (d.sessions || 0),
    0,
  );

  const nonZeroDurations = daily.filter((d: any) => (d.avgDuration || 0) > 0);
  const avgDurationMs =
    nonZeroDurations.length > 0
      ? Math.round(
          nonZeroDurations.reduce(
            (acc: number, d: any) => acc + (d.avgDuration || 0),
            0,
          ) / nonZeroDurations.length,
        )
      : 0;

  const totalReferrerVisits = referrers.reduce(
    (acc: number, r: any) => acc + (r.value || 0),
    0,
  );
  const directVisits = Math.max(0, totalPageviews - totalReferrerVisits);

  const sourceRows: BreakdownRow[] =
    sourceTab === "referrer"
      ? referrers.map((r: any) => ({
          name: r.name,
          value: r.value,
          icon: <Globe size={14} />,
        }))
      : [
          ...(directVisits > 0
            ? [
                {
                  name: "Direct",
                  value: directVisits,
                  icon: <Globe size={14} />,
                },
              ]
            : []),
          ...(totalReferrerVisits > 0
            ? [
                {
                  name: "Referral",
                  value: totalReferrerVisits,
                  icon: <Globe size={14} />,
                },
              ]
            : []),
        ];

  const pageRows: BreakdownRow[] = pages.map((p: any) => ({
    name: p.name,
    value: p.value,
  }));

  const geoRows: BreakdownRow[] = geo.map((g: any) => {
    const countryName =
      g.country === "Unknown"
        ? "Unknown"
        : new Intl.DisplayNames(["en"], { type: "region" }).of(g.country) ||
          g.country;
    return {
      name: countryName,
      value: g.visitors,
      icon:
        g.country === "Unknown" ? (
          <Globe size={14} />
        ) : (
          <img
            src={`https://flagcdn.com/w40/${g.country.toLowerCase()}.png`}
            width={18}
            height={12}
            alt={countryName}
            className="w-4.5 h-3 object-cover rounded-[2px] border border-black/10"
          />
        ),
    };
  });

  const deviceRows: BreakdownRow[] = [
    {
      name: "desktop",
      value: devices.desktop || 0,
      icon: <Monitor size={14} />,
    },
    {
      name: "mobile",
      value: devices.mobile || 0,
      icon: <Smartphone size={14} />,
    },
    {
      name: "tablet",
      value: devices.tablet || 0,
      icon: <Tablet size={14} />,
    },
    {
      name: "other",
      value: devices.other || 0,
      icon: <Globe size={14} />,
    },
  ].filter((d) => d.value > 0);

  const systemRows: BreakdownRow[] =
    systemTab === "browser"
      ? browsers.map((b: any) => ({
          name: b.name,
          value: b.value,
          icon: <Globe size={14} />,
        }))
      : systemTab === "os"
        ? os.map((o: any) => ({
            name: o.name,
            value: o.value,
            icon: <Monitor size={14} />,
          }))
        : deviceRows;

  const hasAnyTraffic = totalVisitors > 0 || totalPageviews > 0;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Top Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs text-xs font-bold text-[var(--text-main)]">
            <span className="w-5 h-5 rounded-md bg-sky-500/15 text-sky-600 flex items-center justify-center">
              <BarChart2 size={12} />
            </span>
            <span className="truncate max-w-[200px]">
              {workspaceName || workspaceId}
            </span>
          </div>

          <Link
            href={`/admin/workspace/${workspaceId}/install`}
            className="w-8 h-8 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
            title="Installation & Tracking Script"
          >
            <Settings size={14} />
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs">
            <Calendar size={13} className="text-[var(--text-muted)] ml-2 mr-1" />
            {(
              [
                { value: 1, label: "Today" },
                { value: 7, label: "Last 7 days" },
                { value: 30, label: "Last 30 days" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDays(opt.value)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all",
                  days === opt.value
                    ? "bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] shadow-2xs"
                    : "text-[var(--text-muted)] hover:text-[var(--text-main)]",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => fetchData(false)}
            disabled={refreshing}
            className="w-8 h-8 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
            title="Refresh"
          >
            <RefreshCw
              size={14}
              className={cn(refreshing && "animate-spin text-sky-500")}
            />
          </button>
        </div>
      </div>

      {/* Main Unified KPI + Chart Card */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-sm overflow-hidden relative">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 border-b border-[var(--border-color)]">
          <button
            type="button"
            onClick={() => setChartMetric("visitors")}
            className={cn(
              "text-left px-5 py-4 border-b sm:border-b-0 sm:border-r border-[var(--border-color)] transition-colors",
              chartMetric === "visitors"
                ? "bg-sky-500/[0.04]"
                : "hover:bg-[var(--bg-main)]/60",
            )}
          >
            <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] mb-1">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              Visitors
            </div>
            <div className="text-2xl font-black text-[var(--text-main)] tabular-nums">
              {hasAnyTraffic ? totalVisitors.toLocaleString() : "—"}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setChartMetric("pageviews")}
            className={cn(
              "text-left px-5 py-4 border-b sm:border-b-0 lg:border-r border-[var(--border-color)] transition-colors",
              chartMetric === "pageviews"
                ? "bg-sky-500/[0.04]"
                : "hover:bg-[var(--bg-main)]/60",
            )}
          >
            <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] mb-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Pageviews
            </div>
            <div className="text-2xl font-black text-[var(--text-main)] tabular-nums">
              {hasAnyTraffic ? totalPageviews.toLocaleString() : "—"}
            </div>
          </button>

          <div className="px-5 py-4 border-b lg:border-b-0 sm:border-r border-[var(--border-color)]">
            <div className="text-xs font-medium text-[var(--text-muted)] mb-1">
              Sessions
            </div>
            <div className="text-2xl font-black text-[var(--text-main)] tabular-nums">
              {hasAnyTraffic ? totalSessions.toLocaleString() : "—"}
            </div>
          </div>

          <div className="px-5 py-4 border-r border-[var(--border-color)]">
            <div className="text-xs font-medium text-[var(--text-muted)] mb-1">
              Session time
            </div>
            <div className="text-2xl font-black text-[var(--text-main)] tabular-nums">
              {formatDuration(avgDurationMs)}
            </div>
          </div>

          <div className="px-5 py-4 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] mb-1">
              Online
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </div>
            <div className="text-2xl font-black text-[var(--text-main)] tabular-nums">
              {live || 0}
            </div>
          </div>
        </div>

        {/* Chart Area */}
        <div className="p-4 sm:p-6 relative">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={daily}
                margin={{ top: 12, right: 12, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="dfSkyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border-color)"
                  opacity={0.7}
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                  tickFormatter={(val) =>
                    new Date(val + "T00:00:00").toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--bg-card)",
                    borderRadius: "12px",
                    border: "1px solid var(--border-color)",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.12)",
                    fontSize: "12px",
                  }}
                  labelFormatter={(val) =>
                    new Date(val + "T00:00:00").toLocaleDateString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
                <Area
                  type="monotone"
                  dataKey={chartMetric}
                  stroke="#60a5fa"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#dfSkyGrad)"
                  activeDot={{ r: 5, fill: "#3b82f6", strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Awaiting First Event Callout */}
          {!hasAnyTraffic && (
            <div className="mt-4 sm:mt-0 sm:absolute sm:bottom-8 sm:left-8 max-w-xs bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800/60 rounded-xl p-4 shadow-md text-amber-950 dark:text-amber-100">
              <div className="flex items-center gap-2 font-bold text-xs mb-2">
                <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                Awaiting the first event...
              </div>
              <ol className="text-[11px] space-y-1 text-amber-900/80 dark:text-amber-200/80 list-decimal list-inside">
                <li>
                  Install the script from{" "}
                  <Link
                    href={`/admin/workspace/${workspaceId}/install`}
                    className="underline font-semibold"
                  >
                    Installation
                  </Link>
                </li>
                <li>Visit your website to register the first pageview</li>
                <li>Refresh your dashboard</li>
              </ol>
            </div>
          )}
        </div>
      </div>

      {/* 2x2 Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BreakdownCard
          tabs={[
            { id: "referrer", label: "Referrer" },
            { id: "channel", label: "Channel" },
          ]}
          activeTab={sourceTab}
          onTabChange={(id) => setSourceTab(id as SourceTab)}
          rows={sourceRows}
          emptyText="No referrer data yet"
        />

        <BreakdownCard
          tabs={[{ id: "page", label: "Page" }]}
          activeTab="page"
          onTabChange={() => {}}
          rows={pageRows}
          emptyText="No pageview data yet"
        />

        <BreakdownCard
          tabs={[{ id: "country", label: "Country" }]}
          activeTab="country"
          onTabChange={() => {}}
          rows={geoRows}
          emptyText="No geographical data yet"
        />

        <BreakdownCard
          tabs={[
            { id: "browser", label: "Browser" },
            { id: "os", label: "OS" },
            { id: "device", label: "Device" },
          ]}
          activeTab={systemTab}
          onTabChange={(id) => setSystemTab(id as SystemTab)}
          rows={systemRows}
          emptyText="No system data yet"
        />
      </div>
    </div>
  );
}
