"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

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

const defaultPlans: PlansState = {
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
};

export default function PlansConfigPage() {
  const [plans, setPlans] = useState<PlansState>(defaultPlans);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const docRef = doc(db, "plans_config", "global");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPlans(docSnap.data() as PlansState);
        } else {
          // Initialize if empty
          await setDoc(docRef, defaultPlans);
        }
      } catch (error) {
        console.error("Error fetching plans config:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleChange = (plan: keyof PlansState, field: keyof PlanConfig, value: number | boolean) => {
    setPlans(prev => ({
      ...prev,
      [plan]: { ...prev[plan], [field]: value },
    }));
    setHasChanges(true);
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "plans_config", "global"), plans);
      setSaved(true);
      setHasChanges(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving plans:", error);
      alert("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const PlanCard = ({ 
    planKey, 
    title, 
    colorClass 
  }: { 
    planKey: keyof PlansState; 
    title: string; 
    colorClass: string;
  }) => {
    const plan = plans[planKey];
    
    return (
      <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col h-full">
        {/* Card Header */}
        <div className={cn("px-6 py-4 border-b border-slate-100 dark:border-slate-700", colorClass)}>
          <h3 className="font-bold text-slate-800 dark:text-white">{title}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 uppercase tracking-wide">Configuration</p>
        </div>

        {/* Card Body */}
        <div className="p-6 space-y-6 flex-1">
          <div className="space-y-4">
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Workspaces Limit</label>
                <div className="relative">
                  <input
                    type="number"
                    value={plan.maxWorkspaces}
                    onChange={(e) => handleChange(planKey, "maxWorkspaces", parseInt(e.target.value) || 0)}
                    className="w-full pl-4 pr-12 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-700 transition-all"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                    Max
                  </div>
                </div>
             </div>

             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Members / Workspace</label>
                <input
                  type="number"
                  value={plan.maxMembersPerWorkspace}
                  onChange={(e) => handleChange(planKey, "maxMembersPerWorkspace", parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-700 transition-all"
                />
             </div>

             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Customers Limit</label>
                <input
                  type="number"
                  value={plan.maxCustomers}
                  onChange={(e) => handleChange(planKey, "maxCustomers", parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-700 transition-all"
                />
             </div>
          </div>

          <div className="pt-4 mt-auto border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
             <div className="text-sm font-bold text-slate-700 dark:text-slate-300">Image Uploads</div>
             <button
              onClick={() => handleChange(planKey, "allowImageUpload", !plan.allowImageUpload)}
              className={cn(
                "w-12 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                plan.allowImageUpload ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-600"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200",
                plan.allowImageUpload ? "left-7" : "left-1"
              )} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full bg-slate-50 dark:bg-[#0f172a]">
        <Loader2 className="animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-[#0f172a] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Plan Configuration</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage feature limits for each subscription tier.</p>
          </div>
          
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className={cn(
               "flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed",
               saved ? "bg-emerald-500 hover:bg-emerald-600" : "bg-blue-600 hover:bg-blue-700"
            )}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
            {saved ? "Updates Saved" : saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PlanCard 
            planKey="trial" 
            title="Free Trial" 
            colorClass="bg-slate-50/50 dark:bg-slate-800/50" 
          />
          <PlanCard 
            planKey="basic" 
            title="Basic Plan" 
            colorClass="bg-blue-50/50 dark:bg-blue-900/20" 
          />
          <PlanCard 
            planKey="premium" 
            title="Premium Plan" 
            colorClass="bg-purple-50/50 dark:bg-purple-900/20" 
          />
        </div>

        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden ring-1 ring-white/10">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
           
           <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
             <div>
               <h3 className="text-xl font-bold mb-2">Pricing Overview</h3>
               <p className="text-slate-400 text-sm max-w-md">
                 Current live pricing shown to customers. To update pricing, please contact the development team to update the Stripe/Payment gateway configuration.
               </p>
             </div>
             
             <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="text-3xl font-black">$0</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Trial</div>
                </div>
                <div className="w-px h-12 bg-white/10" />
                <div className="text-center">
                  <div className="text-3xl font-black">$14</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Basic</div>
                </div>
                <div className="w-px h-12 bg-white/10" />
                <div className="text-center">
                  <div className="text-3xl font-black text-purple-400">$25</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Pro</div>
                </div>
             </div>
           </div>
        </div>
      </div>
    </main>
  );
}
