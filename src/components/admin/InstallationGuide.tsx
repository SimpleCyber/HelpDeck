import { useState } from "react";
import { Save, Copy, Code, FileCode, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function InstallationGuide({ workspaceId, ownerId }: { workspaceId: string, ownerId: string }) {
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'html' | 'jsx' | 'tsx'>('html');
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

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

  const copy = (txt: string, id: string) => {
    navigator.clipboard.writeText(txt);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const tabs = [
    { id: 'html', label: 'HTML/Script', icon: Code },
    { id: 'jsx', label: 'React (JSX)', icon: FileCode },
    { id: 'tsx', label: 'Next.js (TSX)', icon: FileCode },
  ];

  const currentPlatformSnippets = (snippets as any)[activeTab];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-12">
        {/* Basic Installation Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-xl text-[var(--text-main)] tracking-tight">Basic Installation</h3>
            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest bg-[var(--bg-main)] px-3 py-1 rounded-full border border-[var(--border-color)]">Static integration</span>
          </div>
          <p className="text-[var(--text-muted)] text-sm font-medium">Perfect for simple websites. Asks users for details in-chat.</p>
          <div className="relative group p-8 bg-slate-900 rounded-[32px] border border-slate-800 shadow-2xl overflow-hidden">
            <pre className="text-slate-300 overflow-x-auto font-mono text-[11px] leading-relaxed">
              {currentPlatformSnippets.standard}
            </pre>
            <Button 
              variant="secondary" 
              icon={copied === activeTab + 'standard' ? Check : Copy} 
              onClick={() => copy(currentPlatformSnippets.standard, activeTab + 'standard')} 
              className={cn(
                "absolute top-6 right-6 transition-all",
                copied === activeTab + 'standard' 
                  ? "bg-green-600 text-white border-none" 
                  : "bg-slate-800/80 text-slate-300 border-none backdrop-blur-sm hover:bg-slate-700"
              )}
            >
              Copy Code
            </Button>
          </div>
        </section>

        {/* Dynamic Identification Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-xl text-[var(--text-main)] tracking-tight">Dynamic Identification (Recommended)</h3>
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-800/50">User sync</span>
          </div>
          <p className="text-[var(--text-muted)] text-sm font-medium">Pass user data from your backend. Automatically resumes chat history and personalizes the experience.</p>
          <div className="relative group p-8 bg-slate-900 rounded-[32px] border border-slate-800 shadow-2xl overflow-hidden">
            <pre className="text-slate-300 overflow-x-auto font-mono text-[11px] leading-relaxed">
              {currentPlatformSnippets.dynamic}
            </pre>
            <Button 
              variant="secondary" 
              icon={copied === activeTab + 'dynamic' ? Check : Copy} 
              onClick={() => copy(currentPlatformSnippets.dynamic, activeTab + 'dynamic')} 
              className={cn(
                "absolute top-6 right-6 transition-all",
                copied === activeTab + 'dynamic' 
                  ? "bg-green-600 text-white border-none" 
                  : "bg-slate-800/80 text-slate-300 border-none backdrop-blur-sm hover:bg-slate-700"
              )}
            >
              Copy Code
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
