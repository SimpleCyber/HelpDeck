"use client";

import { Save, Copy } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function InstallationGuide({ workspaceId }: { workspaceId: string }) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const code = `<script>\n  window.CRISP_WEBSITE_ID = "${workspaceId}";\n  (function() {\n    var s = document.createElement("script");\n    s.src = "${origin}/widget-loader.js";\n    s.async = 1;\n    document.head.appendChild(s);\n  })();\n</script>`;

  const copy = () => {
    navigator.clipboard.writeText(code);
    alert("Code copied!");
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
      <p className="text-gray-600 text-sm">Copy this code into your website's <code className="bg-gray-100 px-1 rounded text-red-500">&lt;head&gt;</code> tag.</p>
      <div className="relative group">
        <pre className="bg-gray-900 text-gray-300 p-6 rounded-2xl overflow-x-auto font-mono text-xs leading-relaxed border border-gray-800 shadow-inner">
          {code}
        </pre>
        <Button variant="secondary" icon={Copy} onClick={copy} className="absolute top-4 right-4 bg-gray-800/50 border border-gray-700 text-gray-300 hover:text-white px-3 py-1.5 text-xs">Copy</Button>
      </div>
    </div>
  );
}
