import { useState } from "react";
import {
  Copy,
  Code,
  FileCode,
  Check,
  MessageSquare,
  Inbox,
  Eye,
  EyeOff,
  Type,
  Sliders,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

const FONT_OPTIONS = [
  { label: "Inter (Default)", value: "Inter" },
  { label: "Poppins", value: "Poppins" },
  { label: "Roboto", value: "Roboto" },
  { label: "Plus Jakarta Sans", value: "Plus Jakarta Sans" },
  { label: "DM Sans", value: "DM Sans" },
  { label: "Open Sans", value: "Open Sans" },
  { label: "Lato", value: "Lato" },
  { label: "JetBrains Mono", value: "JetBrains Mono" },
  { label: "System UI", value: "system-ui, sans-serif" },
  { label: "Custom Font...", value: "__custom__" },
];

export function InstallationGuide({
  workspaceId,
  ownerId,
  defaultColor = "#3b82f6",
}: {
  workspaceId: string;
  ownerId: string;
  defaultColor?: string;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const [embedMode, setEmbedMode] = useState<"widget" | "inbox">("widget");
  const [activeTab, setActiveTab] = useState<"html" | "jsx" | "tsx">("html");
  const [inboxTab, setInboxTab] = useState<"iframe" | "script" | "jsx" | "tsx">(
    "iframe",
  );
  const [showPreview, setShowPreview] = useState(false);

  // Live Inbox customization state
  const [fontPreset, setFontPreset] = useState("Inter");
  const [customFont, setCustomFont] = useState("");
  const [fontSize, setFontSize] = useState<"sm" | "md" | "lg">("md");
  const [theme, setTheme] = useState<"system" | "light" | "dark">("system");
  const [accentColor, setAccentColor] = useState(defaultColor);
  const [inboxTitle, setInboxTitle] = useState("Messages");
  const [width, setWidth] = useState("100%");
  const [height, setHeight] = useState("700px");
  const [borderRadius, setBorderRadius] = useState("16px");
  const [showSearch, setShowSearch] = useState(true);
  const [showUserSidebar, setShowUserSidebar] = useState(true);
  const [showResolveButton, setShowResolveButton] = useState(true);
  const [showImageUpload, setShowImageUpload] = useState(true);
  const [compact, setCompact] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const resolvedFont =
    fontPreset === "__custom__" ? customFont.trim() || "Inter" : fontPreset;

  const getInboxUrl = () => {
    const params = new URLSearchParams();
    if (ownerId) params.set("owner", ownerId);
    if (resolvedFont && resolvedFont !== "Inter")
      params.set("font", resolvedFont);
    if (fontSize !== "md") params.set("fontSize", fontSize);
    if (theme !== "system") params.set("theme", theme);
    if (accentColor) params.set("accent", accentColor);
    if (inboxTitle && inboxTitle !== "Messages")
      params.set("title", inboxTitle);
    if (!showSearch) params.set("search", "false");
    if (!showUserSidebar) params.set("sidebar", "false");
    if (!showResolveButton) params.set("resolve", "false");
    if (!showImageUpload) params.set("upload", "false");
    if (compact) params.set("compact", "true");
    if (borderRadius && borderRadius !== "16px")
      params.set("radius", borderRadius);
    return `${origin}/inbox/${workspaceId}?${params.toString()}`;
  };

  const inboxUrl = getInboxUrl();

  const getInboxSnippets = () => {
    const iframeSnippet = `<iframe
  src="${inboxUrl}"
  style="width: ${width}; height: ${height}; border: 1px solid rgba(148, 163, 184, 0.25); border-radius: ${borderRadius}; overflow: hidden;"
  allow="clipboard-write"
  title="${inboxTitle || "Live Inbox"}"
></iframe>`;

    const settingsObj = {
      containerSelector: "#helpdeck-live-inbox",
      fontFamily: resolvedFont,
      fontSize,
      theme,
      accentColor,
      inboxTitle,
      width,
      height,
      borderRadius,
      showSearch,
      showUserSidebar,
      showResolveButton,
      showImageUpload,
      compact,
    };

    const scriptSnippet = `<div id="helpdeck-live-inbox"></div>
<script>
  window.CRISP_WEBSITE_ID = "${workspaceId}";
  window.CRISP_OWNER_ID = "${ownerId}";
  window.HELPDECK_INBOX_SETTINGS = ${JSON.stringify(settingsObj, null, 2)};
  (function() {
    var s = document.createElement("script");
    s.src = "${origin}/inbox-loader.js";
    s.async = 1;
    document.head.appendChild(s);
  })();
</script>`;

    const jsxSnippet = `export default function HelpDeckLiveInbox() {
  return (
    <iframe
      src="${inboxUrl}"
      style={{
        width: "${width}",
        height: "${height}",
        border: "1px solid rgba(148, 163, 184, 0.25)",
        borderRadius: "${borderRadius}",
        overflow: "hidden",
      }}
      allow="clipboard-write"
      title="${inboxTitle || "Live Inbox"}"
    />
  );
}`;

    const tsxSnippet = `"use client";

export default function HelpDeckLiveInbox() {
  return (
    <iframe
      src="${inboxUrl}"
      style={{
        width: "${width}",
        height: "${height}",
        border: "1px solid rgba(148, 163, 184, 0.25)",
        borderRadius: "${borderRadius}",
        overflow: "hidden",
      }}
      allow="clipboard-write"
      title="${inboxTitle || "Live Inbox"}"
    />
  );
}`;

    return {
      iframe: iframeSnippet,
      script: scriptSnippet,
      jsx: jsxSnippet,
      tsx: tsxSnippet,
    };
  };

  const getSnippets = (id: string, oid: string, origin: string) => {
    const htmlStandard = `<script>
  window.CRISP_WEBSITE_ID = "${id}";
  window.CRISP_OWNER_ID = "${oid}";
  (function() {
    var s = document.createElement("script");
    s.src = "${origin}/widget-loader.js";
    s.async = 1;
    document.head.appendChild(s);
  })();
</script>`;

    const htmlDynamic = `<script>
  window.CRISP_WEBSITE_ID = "${id}";
  window.CRISP_OWNER_ID = "${oid}";
  window.HELPDECK_USER = {
    name: "John Doe",
    email: "john@example.com",
    userId: "12345"
    // You can add more fields (e.g. company, plan) to see them in your sidebar
  };
  (function() {
    var s = document.createElement("script");
    s.src = "${origin}/widget-loader.js";
    s.async = 1;
    document.head.appendChild(s);
  })();
</script>`;

    const jsxStandard = `import { useEffect } from 'react';

const HelpDeckWidget = () => {
  useEffect(() => {
    window.CRISP_WEBSITE_ID = "${id}";
    window.CRISP_OWNER_ID = "${oid}";
    const s = document.createElement("script");
    s.src = "${origin}/widget-loader.js";
    s.async = true;
    document.head.appendChild(s);
  }, []);

  return null;
};

export default HelpDeckWidget;`;

    const jsxDynamic = `import { useEffect } from 'react';

const HelpDeckWidget = () => {
  useEffect(() => {
    window.CRISP_WEBSITE_ID = "${id}";
    window.CRISP_OWNER_ID = "${oid}";
    window.HELPDECK_USER = {
      name: "John Doe",
      email: "john@example.com",
      userId: "12345"
      // You can add more fields (e.g. company, plan) to see them in your sidebar
    };
    const s = document.createElement("script");
    s.src = "${origin}/widget-loader.js";
    s.async = true;
    document.head.appendChild(s);
  }, []);

  return null;
};

export default HelpDeckWidget;`;

    const tsxStandard = `"use client";
import { useEffect } from 'react';

export default function HelpDeckWidget() {
  useEffect(() => {
    (window as any).CRISP_WEBSITE_ID = "${id}";
    (window as any).CRISP_OWNER_ID = "${oid}";
    const s = document.createElement("script");
    s.src = "${origin}/widget-loader.js";
    s.async = true;
    document.head.appendChild(s);
  }, []);

  return null;
}`;

    const tsxDynamic = `"use client";
import { useEffect } from 'react';

export default function HelpDeckWidget() {
  useEffect(() => {
    (window as any).CRISP_WEBSITE_ID = "${id}";
    (window as any).CRISP_OWNER_ID = "${oid}";
    (window as any).HELPDECK_USER = {
      name: "John Doe",
      email: "john@example.com",
      userId: "12345"
      // You can add more fields (e.g. company, plan) to see them in your sidebar
    };
    const s = document.createElement("script");
    s.src = "${origin}/widget-loader.js";
    s.async = true;
    document.head.appendChild(s);
  }, []);

  return null;
}`;

    return {
      html: { standard: htmlStandard, dynamic: htmlDynamic },
      jsx: { standard: jsxStandard, dynamic: jsxDynamic },
      tsx: { standard: tsxStandard, dynamic: tsxDynamic },
    };
  };

  const snippets = getSnippets(workspaceId, ownerId, origin);
  const inboxSnippets = getInboxSnippets();

  const copy = (txt: string, id: string) => {
    navigator.clipboard.writeText(txt);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const tabs = [
    { id: "html", label: "HTML/Script", icon: Code },
    { id: "jsx", label: "React (JSX)", icon: FileCode },
    { id: "tsx", label: "Next.js (TSX)", icon: FileCode },
  ];

  const inboxTabs = [
    { id: "iframe", label: "HTML (Iframe)", icon: Code },
    { id: "script", label: "Script Loader", icon: Code },
    { id: "jsx", label: "React (JSX)", icon: FileCode },
    { id: "tsx", label: "Next.js (TSX)", icon: FileCode },
  ];

  const currentPlatformSnippets = (snippets as any)[activeTab];
  const currentInboxSnippet = (inboxSnippets as any)[inboxTab];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Mode Switcher: Chat Widget vs Live Inbox Embed */}
      <div className="flex flex-wrap items-center gap-3 p-1.5 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] w-fit shadow-sm">
        <button
          onClick={() => setEmbedMode("widget")}
          className={cn(
            "flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-black transition-all",
            embedMode === "widget"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "text-[var(--text-muted)] hover:text-[var(--text-main)]",
          )}
        >
          <MessageSquare size={16} />
          Chat Widget
        </button>
        <button
          onClick={() => setEmbedMode("inbox")}
          className={cn(
            "flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-black transition-all",
            embedMode === "inbox"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "text-[var(--text-muted)] hover:text-[var(--text-main)]",
          )}
        >
          <Inbox size={16} />
          Live Inbox Embed
        </button>
      </div>

      {embedMode === "widget" ? (
        <>
          {/* Platform Selector */}
          <div className="flex bg-[var(--bg-main)] p-1.5 rounded-2xl border border-[var(--border-color)] w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
                  activeTab === tab.id
                    ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm border border-[var(--border-color)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-main)]",
                )}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-12">
            {/* Dynamic Identification Section (Recommended) */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-xl text-[var(--text-main)] tracking-tight">
                  Dynamic Identification (Recommended)
                </h3>
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-800/50">
                  User sync
                </span>
              </div>
              <p className="text-[var(--text-muted)] text-sm font-medium">
                Pass user data from your backend. Automatically resumes chat
                history and personalizes the experience.
              </p>
              <div className="relative group p-8 bg-slate-900 rounded-[32px] border border-slate-800 shadow-2xl overflow-hidden">
                <pre className="text-slate-300 overflow-x-auto font-mono text-[11px] leading-relaxed">
                  {currentPlatformSnippets.dynamic}
                </pre>
                <Button
                  variant="secondary"
                  icon={copied === activeTab + "dynamic" ? Check : Copy}
                  onClick={() =>
                    copy(
                      currentPlatformSnippets.dynamic,
                      activeTab + "dynamic",
                    )
                  }
                  className={cn(
                    "absolute top-6 right-6 transition-all",
                    copied === activeTab + "dynamic"
                      ? "bg-green-600 text-white border-none"
                      : "bg-slate-800/80 text-slate-300 border-none backdrop-blur-sm hover:bg-slate-700",
                  )}
                >
                  Copy Code
                </Button>
              </div>
            </section>

            {/* Basic Installation Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-xl text-[var(--text-main)] tracking-tight">
                  Basic Installation
                </h3>
                <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest bg-[var(--bg-main)] px-3 py-1 rounded-full border border-[var(--border-color)]">
                  Static integration
                </span>
              </div>
              <p className="text-[var(--text-muted)] text-sm font-medium">
                Perfect for simple websites. Asks users for details in-chat.
              </p>
              <div className="relative group p-8 bg-slate-900 rounded-[32px] border border-slate-800 shadow-2xl overflow-hidden">
                <pre className="text-slate-300 overflow-x-auto font-mono text-[11px] leading-relaxed">
                  {currentPlatformSnippets.standard}
                </pre>
                <Button
                  variant="secondary"
                  icon={copied === activeTab + "standard" ? Check : Copy}
                  onClick={() =>
                    copy(
                      currentPlatformSnippets.standard,
                      activeTab + "standard",
                    )
                  }
                  className={cn(
                    "absolute top-6 right-6 transition-all",
                    copied === activeTab + "standard"
                      ? "bg-green-600 text-white border-none"
                      : "bg-slate-800/80 text-slate-300 border-none backdrop-blur-sm hover:bg-slate-700",
                  )}
                >
                  Copy Code
                </Button>
              </div>
            </section>

            <section className="space-y-6 pt-6 border-t border-[var(--border-color)]">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-xl text-[var(--text-main)] tracking-tight">
                  Advanced Customization
                </h3>
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-800/50">
                  New Features
                </span>
              </div>
              <p className="text-[var(--text-muted)] text-sm font-medium">
                Take full control of the widget&apos;s behavior and appearance.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-[var(--bg-main)] rounded-3xl border border-[var(--border-color)] space-y-3">
                  <h4 className="font-bold text-[var(--text-main)] flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xs">
                      1
                    </span>
                    Custom Button Attachment
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    Connect the widget to your own UI elements. Provide a CSS
                    selector (like <code>#my-chat-btn</code>) and we&apos;ll
                    automatically bind the toggle action.
                  </p>
                </div>

                <div className="p-6 bg-[var(--bg-main)] rounded-3xl border border-[var(--border-color)] space-y-3">
                  <h4 className="font-bold text-[var(--text-main)] flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-green-100 text-green-600 flex items-center justify-center text-xs">
                      2
                    </span>
                    Custom Initial Position
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    Set where the widget should first appear. You can specify{" "}
                    <code>bottom</code>, <code>right</code>, <code>top</code>,
                    or <code>left</code> offsets.
                  </p>
                </div>

                <div className="p-6 bg-[var(--bg-main)] rounded-3xl border border-[var(--border-color)] space-y-3 md:col-span-2">
                  <h4 className="font-bold text-[var(--text-main)] flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-xs">
                      3
                    </span>
                    Hidden Launcher Mode
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    Want to hide the default bubble icon? Enable{" "}
                    <code>hideLauncher</code> to make the bubble invisible. The
                    widget will only appear when triggered by your custom button
                    or programmatic API.
                  </p>
                </div>
              </div>

              <div className="relative group p-8 bg-slate-900 rounded-[32px] border border-slate-800 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Implementation Example
                  </span>
                </div>
                <pre className="text-slate-300 overflow-x-auto font-mono text-[11px] leading-relaxed">
                  {`window.HELPDECK_SETTINGS = {
  buttonSelector: "#chat-with-us", // Attach to your button
  hideLauncher: true,             // Hide the default bubble
  draggable: true,                // Allow users to drag the widget
  position: { 
    bottom: "24px", 
    right: "24px" 
  }
};`}
                </pre>
                <Button
                  variant="secondary"
                  icon={copied === "advanced" ? Check : Copy}
                  onClick={() =>
                    copy(
                      `window.HELPDECK_SETTINGS = {
  buttonSelector: "#chat-with-us",
  hideLauncher: true,
  draggable: true,
  position: { 
    bottom: "24px", 
    right: "24px" 
  }
};`,
                      "advanced",
                    )
                  }
                  className={cn(
                    "absolute top-6 right-6 transition-all",
                    copied === "advanced"
                      ? "bg-green-600 text-white border-none"
                      : "bg-slate-800/80 text-slate-300 border-none backdrop-blur-sm hover:bg-slate-700",
                  )}
                >
                  Copy Settings
                </Button>
              </div>
            </section>
          </div>
        </>
      ) : (
        <div className="space-y-10">
          {/* Header Info */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-black text-xl text-[var(--text-main)] tracking-tight">
                Embed Live Inbox on Your Website
              </h3>
              <p className="text-[var(--text-muted)] text-sm font-medium mt-1">
                Customize the font style, theme, layout, and features of your
                live inbox, then copy the generated code into your site or
                dashboard.
              </p>
            </div>
            <Button
              variant="secondary"
              icon={showPreview ? EyeOff : Eye}
              onClick={() => setShowPreview((v) => !v)}
              className="rounded-xl"
            >
              {showPreview ? "Hide Live Preview" : "Show Live Preview"}
            </Button>
          </div>

          {/* Live Preview */}
          {showPreview && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">
                  Live Preview
                </span>
                <span className="text-xs font-mono text-[var(--text-muted)]">
                  Font: {resolvedFont} · Theme: {theme}
                </span>
              </div>
              <iframe
                src={inboxUrl}
                style={{
                  width: "100%",
                  height: "560px",
                  border: "1px solid var(--border-color)",
                  borderRadius,
                }}
                title="Live Inbox Preview"
              />
            </div>
          )}

          {/* Customizer Card */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[32px] p-8 space-y-8 shadow-sm">
            <div className="flex items-center gap-2.5 text-sm font-black uppercase tracking-wider text-[var(--text-main)]">
              <Type size={16} className="text-blue-600" />
              Typography & Appearance
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Font Style */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[var(--text-main)]">
                  Font Style
                </label>
                <select
                  value={fontPreset}
                  onChange={(e) => setFontPreset(e.target.value)}
                  className="input-field text-sm font-medium"
                >
                  {FONT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Font Input if selected */}
              {fontPreset === "__custom__" ? (
                <Input
                  label="Custom Font Name (Google Font or CSS family)"
                  placeholder="e.g. Merriweather, Space Grotesk"
                  value={customFont}
                  onChange={(e) => setCustomFont(e.target.value)}
                />
              ) : (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[var(--text-main)]">
                    Font Size
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["sm", "md", "lg"] as const).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setFontSize(sz)}
                        className={cn(
                          "py-2.5 rounded-xl text-xs font-bold border transition-all capitalize",
                          fontSize === sz
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-[var(--bg-main)] text-[var(--text-muted)] border-[var(--border-color)] hover:text-[var(--text-main)]",
                        )}
                      >
                        {sz === "sm"
                          ? "Compact"
                          : sz === "md"
                            ? "Default"
                            : "Large"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Theme */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[var(--text-main)]">
                  Theme
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["system", "light", "dark"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTheme(t)}
                      className={cn(
                        "py-2.5 rounded-xl text-xs font-bold border transition-all capitalize",
                        theme === t
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-[var(--bg-main)] text-[var(--text-muted)] border-[var(--border-color)] hover:text-[var(--text-main)]",
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Color */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[var(--text-main)]">
                  Accent Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-11 h-11 rounded-xl border-none p-0 overflow-hidden cursor-pointer shadow-sm shrink-0"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="input-field font-mono text-xs font-bold"
                  />
                </div>
              </div>

              {/* Inbox Title */}
              <Input
                label="Inbox Header Title"
                value={inboxTitle}
                onChange={(e) => setInboxTitle(e.target.value)}
                placeholder="Messages"
              />

              {/* Dimensions */}
              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="Width"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  placeholder="100%"
                />
                <Input
                  label="Height"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="700px"
                />
                <Input
                  label="Radius"
                  value={borderRadius}
                  onChange={(e) => setBorderRadius(e.target.value)}
                  placeholder="16px"
                />
              </div>
            </div>

            {/* Feature Toggles */}
            <div className="pt-6 border-t border-[var(--border-color)] space-y-4">
              <div className="flex items-center gap-2.5 text-sm font-black uppercase tracking-wider text-[var(--text-main)]">
                <Sliders size={16} className="text-blue-600" />
                Features & Layout Controls
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  {
                    label: "Search Bar",
                    checked: showSearch,
                    onChange: setShowSearch,
                  },
                  {
                    label: "Customer Details Sidebar",
                    checked: showUserSidebar,
                    onChange: setShowUserSidebar,
                  },
                  {
                    label: "Resolve / Unresolve Button",
                    checked: showResolveButton,
                    onChange: setShowResolveButton,
                  },
                  {
                    label: "Image Upload",
                    checked: showImageUpload,
                    onChange: setShowImageUpload,
                  },
                  {
                    label: "Compact Mode",
                    checked: compact,
                    onChange: setCompact,
                  },
                ].map((toggle) => (
                  <label
                    key={toggle.label}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)] cursor-pointer hover:border-blue-500/40 transition-colors"
                  >
                    <span className="text-xs font-bold text-[var(--text-main)]">
                      {toggle.label}
                    </span>
                    <input
                      type="checkbox"
                      checked={toggle.checked}
                      onChange={(e) => toggle.onChange(e.target.checked)}
                      className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Code Output Tabs */}
          <div className="space-y-4">
            <div className="flex flex-wrap bg-[var(--bg-main)] p-1.5 rounded-2xl border border-[var(--border-color)] w-fit">
              {inboxTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setInboxTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
                    inboxTab === tab.id
                      ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm border border-[var(--border-color)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-main)]",
                  )}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative group p-8 bg-slate-900 rounded-[32px] border border-slate-800 shadow-2xl overflow-hidden">
              <pre className="text-slate-300 overflow-x-auto font-mono text-[11px] leading-relaxed">
                {currentInboxSnippet}
              </pre>
              <Button
                variant="secondary"
                icon={copied === "inbox-" + inboxTab ? Check : Copy}
                onClick={() => copy(currentInboxSnippet, "inbox-" + inboxTab)}
                className={cn(
                  "absolute top-6 right-6 transition-all",
                  copied === "inbox-" + inboxTab
                    ? "bg-green-600 text-white border-none"
                    : "bg-slate-800/80 text-slate-300 border-none backdrop-blur-sm hover:bg-slate-700",
                )}
              >
                Copy Code
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
