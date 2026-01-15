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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
      <section className="space-y-4">
        <h3 className="font-bold text-lg">Basic Installation</h3>
        <p className="text-gray-500 text-sm">Best for static sites. Asks for user details in-chat.</p>
        <div className="relative group">
          <pre className="bg-gray-900 text-gray-300 p-6 rounded-2xl overflow-x-auto font-mono text-[10px] leading-relaxed border border-gray-800 shadow-inner">{basic}</pre>
          <Button variant="secondary" icon={Copy} onClick={() => copy(basic)} className="absolute top-4 right-4 bg-gray-800/50 text-gray-400">Copy</Button>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-bold text-lg">Dynamic Identification (Recommended)</h3>
        <p className="text-gray-500 text-sm">Pass user data from your backend. Automatically resumes chat history.</p>
        <div className="relative group">
          <pre className="bg-gray-900 text-gray-300 p-6 rounded-2xl overflow-x-auto font-mono text-[10px] leading-relaxed border border-gray-800 shadow-inner">{advanced}</pre>
          <Button variant="secondary" icon={Copy} onClick={() => copy(advanced)} className="absolute top-4 right-4 bg-gray-800/50 text-gray-400">Copy</Button>
        </div>
      </section>
    </div>
  );
}
