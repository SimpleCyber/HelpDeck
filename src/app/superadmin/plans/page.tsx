"use client";

import { useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanConfig {
  maxWorkspaces: number;
  maxMembersPerWorkspace: number;
  maxCustomers: number;
  allowImageUpload: boolean;
}

interface PlansState {
  trial: PlanConfig;
  basic: PlanConfig;
  premium: PlanConfig;
}

export default function PlansConfigPage() {
  const [plans, setPlans] = useState<PlansState>({
    trial: {
      maxWorkspaces: 2,
      maxMembersPerWorkspace: 1,
      maxCustomers: 50,
      allowImageUpload: false,
    },
    basic: {
      maxWorkspaces: 5,
      maxMembersPerWorkspace: 2,
      maxCustomers: 100,
      allowImageUpload: true,
    },
    premium: {
      maxWorkspaces: 15,
      maxMembersPerWorkspace: 5,
      maxCustomers: 1000,
      allowImageUpload: true,
    },
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleChange = (plan: keyof PlansState, field: keyof PlanConfig, value: number | boolean) => {
    setPlans(prev => ({
      ...prev,
      [plan]: {
        ...prev[plan],
        [field]: value,
      },
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call - in production, this would save to Firestore
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const renderPlanCard = (
    planKey: keyof PlansState, 
    title: string, 
    badge: { text: string; color: string }
  ) => {
    const plan = plans[planKey];
    
    return (
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[var(--border-color)]" />
            <h3 className="font-bold text-[var(--text-main)]">{title}</h3>
          </div>
          <span className={cn(
            "px-3 py-1 rounded-full text-xs font-bold uppercase",
            badge.color
          )}>
            {badge.text}
          </span>
        </div>

        {/* Config Fields */}
        <div className="space-y-5">
          {/* Max Workspaces */}
          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Max Workspaces
            </label>
            <input
              type="number"
              value={plan.maxWorkspaces}
              onChange={(e) => handleChange(planKey, "maxWorkspaces", parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[var(--text-main)] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-blue-500 mt-1">Accounts user can link</p>
          </div>

          {/* Max Members Per Workspace */}
          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Members / Workspace
            </label>
            <input
              type="number"
              value={plan.maxMembersPerWorkspace}
              onChange={(e) => handleChange(planKey, "maxMembersPerWorkspace", parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[var(--text-main)] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-blue-500 mt-1">Team members per workspace</p>
          </div>

          {/* Max Customers */}
          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Max Customers
            </label>
            <input
              type="number"
              value={plan.maxCustomers}
              onChange={(e) => handleChange(planKey, "maxCustomers", parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[var(--text-main)] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-blue-500 mt-1">Total support customers allowed</p>
          </div>

          {/* Allow Image Upload */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Allow Image Upload
              </label>
              <p className="text-xs text-blue-500 mt-1">Enable media attachments</p>
            </div>
            <button
              onClick={() => handleChange(planKey, "allowImageUpload", !plan.allowImageUpload)}
              className={cn(
                "w-12 h-7 rounded-full transition-colors relative",
                plan.allowImageUpload ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
              )}
            >
              <div className={cn(
                "absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all",
                plan.allowImageUpload ? "left-6" : "left-1"
              )} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="flex-1 overflow-y-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm text-[var(--text-muted)] mb-1">Admin / Plan Config</p>
          <h1 className="text-3xl font-black text-[var(--text-main)]">Plan Configuration</h1>
          <p className="text-[var(--text-muted)] mt-1">Configure limits for Free Trial, Basic, and Pro tiers.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all",
            saved 
              ? "bg-emerald-500" 
              : "bg-emerald-600 hover:bg-emerald-700 active:scale-95"
          )}
        >
          {saving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Save size={18} />
          )}
          {saved ? "Saved!" : saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {renderPlanCard("trial", "Free Trial", { text: "Trial", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300" })}
        {renderPlanCard("basic", "Basic Plan", { text: "Basic", color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" })}
        {renderPlanCard("premium", "Pro Plan", { text: "Pro", color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" })}
      </div>

      {/* Pricing Summary */}
      <div className="mt-8 p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl border border-[var(--border-color)]">
        <h3 className="font-bold text-[var(--text-main)] mb-4">Current Pricing</h3>
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-2xl font-black text-[var(--text-main)]">$0</div>
            <div className="text-sm text-[var(--text-muted)]">Free Trial (7 days)</div>
          </div>
          <div>
            <div className="text-2xl font-black text-blue-500">$14<span className="text-sm font-normal">/mo</span></div>
            <div className="text-sm text-[var(--text-muted)]">Basic Plan</div>
          </div>
          <div>
            <div className="text-2xl font-black text-purple-500">$25<span className="text-sm font-normal">/mo</span></div>
            <div className="text-sm text-[var(--text-muted)]">Pro Plan</div>
          </div>
        </div>
      </div>
    </main>
  );
}
