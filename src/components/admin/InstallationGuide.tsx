"use client";

import { Save, Copy } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function InstallationGuide({ workspaceId }: { workspaceId: string }) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const basic = `<script>\n  window.CRISP_WEBSITE_ID = "${workspaceId}";\n  (function() {\n    var s = document.createElement("script");\n    s.src = "${origin}/widget-loader.js";\n    s.async = 1;\n    document.head.appendChild(s);\n  })();\n</script>`;

  const advanced = `<script>\n  window.CRISP_WEBSITE_ID = "${workspaceId}";\n  window.HELPDECK_USER = {\n    name: "John Doe",\n    email: "john@example.com",\n    userId: "12345" // Optional: unique ID from your system\n  };\n  (function() {\n    var s = document.createElement("script");\n    s.src = "${origin}/widget-loader.js";\n    s.async = 1;\n    document.head.appendChild(s);\n  })();\n</script>`;

  const copy = (txt: string) => {
    navigator.clipboard.writeText(txt);
    alert("Code copied!");
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="space-y-4">
        <h3 className="font-black text-xl text-[var(--text-main)] tracking-tight">Basic Installation</h3>
        <p className="text-[var(--text-muted)] text-sm font-medium">Best for static sites. Asks for user details in-chat.</p>
        <div className="relative group">
          <pre className="bg-slate-900 text-slate-300 p-8 rounded-[32px] overflow-x-auto font-mono text-[11px] leading-relaxed border border-slate-800 shadow-2xl">{basic}</pre>
          <Button variant="secondary" icon={Copy} onClick={() => copy(basic)} className="absolute top-6 right-6 bg-slate-800/80 text-slate-300 border-none backdrop-blur-sm hover:bg-slate-700">Copy Code</Button>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-black text-xl text-[var(--text-main)] tracking-tight">Dynamic Identification (Recommended)</h3>
        <p className="text-[var(--text-muted)] text-sm font-medium">Pass user data from your backend. Automatically resumes chat history.</p>
        <div className="relative group">
          <pre className="bg-slate-900 text-slate-300 p-8 rounded-[32px] overflow-x-auto font-mono text-[11px] leading-relaxed border border-slate-800 shadow-2xl">{advanced}</pre>
          <Button variant="secondary" icon={Copy} onClick={() => copy(advanced)} className="absolute top-6 right-6 bg-slate-800/80 text-slate-300 border-none backdrop-blur-sm hover:bg-slate-700">Copy Code</Button>
        </div>
      </section>
    </div>
  );
}
