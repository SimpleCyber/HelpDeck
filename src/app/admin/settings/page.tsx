"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTheme } from "@/lib/theme-context";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/Button";
import { Moon, Sun, Monitor, Palette, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function GlobalSettings() {
  const { user, loading: authL } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (!authL && !user) router.push("/admin");
  }, [user, authL, router]);

  if (authL) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
    </div>
  );

  return (
    <div className="flex h-screen bg-[var(--bg-main)] text-[var(--text-main)] overflow-hidden">
      <AdminSidebar activeTab="settings-global" />
      
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-12">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 text-blue-600 font-bold mb-2">
              <Sparkles size={20} />
              <span>Personalization</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight">App Settings</h1>
            <p className="text-[var(--text-muted)] font-medium mt-2">Manage your global preferences and appearance.</p>
          </div>

          <div className="space-y-12">
            {/* Appearance Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                  <Palette size={20} />
                </div>
                <h2 className="text-2xl font-black">Appearance</h2>
              </div>

              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[32px] p-8 shadow-sm">
                <p className="text-[var(--text-muted)] font-bold text-sm mb-6 uppercase tracking-widest">Select Theme</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {[
                    { id: 'light', label: 'Light Mode', icon: Sun, desc: 'Clean and bright interface' },
                    { id: 'dark', label: 'Dark Mode', icon: Moon, desc: 'Eyelid-friendly dark palette' },
                    { id: 'system', label: 'System', icon: Monitor, desc: 'Sync with your device settings' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id as any)}
                      className={cn(
                        "flex flex-col items-start gap-4 p-6 rounded-2xl border-2 transition-all group text-left",
                        theme === t.id 
                          ? "bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/20" 
                          : "bg-[var(--bg-main)] border-[var(--border-color)] text-[var(--text-main)] hover:border-blue-400"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                        theme === t.id ? "bg-white/20" : "bg-[var(--bg-card)] border border-[var(--border-color)] group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30"
                      )}>
                        <t.icon size={24} className={theme === t.id ? "text-white" : "text-blue-600"} />
                      </div>
                      <div>
                        <div className="font-bold">{t.label}</div>
                        <div className={cn(
                          "text-xs font-medium mt-1",
                          theme === t.id ? "text-blue-100" : "text-[var(--text-muted)]"
                        )}>
                          {t.desc}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Account Info Placeholder */}
            <section className="space-y-6 opacity-60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
                  <Monitor size={20} />
                </div>
                <h2 className="text-2xl font-black text-[var(--text-main)]">Account</h2>
              </div>
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[32px] p-8 border-dashed">
                <p className="text-[var(--text-muted)] font-medium text-center py-4">More user settings coming soon...</p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
