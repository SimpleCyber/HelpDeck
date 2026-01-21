"use client";

import { useState, useEffect } from "react";
import { X, Check, Zap, Crown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { addDoc, collection, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";

interface PricingPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PlanConfig {
  maxWorkspaces: number;
  maxMembersPerWorkspace: number;
  maxCustomers: number;
  allowImageUpload: boolean;
}

interface PlansState {
  free: PlanConfig;
  basic: PlanConfig;
  premium: PlanConfig;
}

const defaultPlans: PlansState = {
  free: { maxWorkspaces: 2, maxMembersPerWorkspace: 1, maxCustomers: 20, allowImageUpload: false },
  basic: { maxWorkspaces: 5, maxMembersPerWorkspace: 2, maxCustomers: 100, allowImageUpload: true },
  premium: { maxWorkspaces: 15, maxMembersPerWorkspace: 5, maxCustomers: 1000, allowImageUpload: true },
};

export function PricingPopup({ isOpen, onClose }: PricingPopupProps) {
  const { user } = useAuth();
  const [isYearly, setIsYearly] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"basic" | "premium" | null>(null);
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<PlansState>(defaultPlans);

  useEffect(() => {
    if (isOpen) {
      const fetchPlans = async () => {
        try {
          const docSnap = await getDoc(doc(db, "plans_config", "global"));
          if (docSnap.exists()) {
            const data = docSnap.data();
            // Handle migration from 'trial' to 'free' if needed
            const mergedPlans: PlansState = {
              ...defaultPlans,
              ...data,
              free: data.free || data.trial || defaultPlans.free,
              basic: data.basic || defaultPlans.basic,
              premium: data.premium || defaultPlans.premium,
            };
            setPlans(mergedPlans);
          }
        } catch (error) {
          console.error("Error fetching plans config:", error);
        }
      };
      fetchPlans();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const basicPrice = isYearly ? 12 : 14;
  const premiumPrice = isYearly ? 21 : 25;

  const handleSubscribe = async (plan: "basic" | "premium") => {
    if (!user) return;
    setSelectedPlan(plan);
    setLoading(true);
    
    try {
      await addDoc(collection(db, "upgrade_requests"), {
        userId: user.uid,
        userEmail: user.email,
        plan,
        period: isYearly ? "yearly" : "monthly",
        status: "pending",
        createdAt: serverTimestamp()
      });
      alert(`Request sent! An admin will review your upgrade to the ${plan} plan shortly.`);
      onClose();
    } catch (error) {
      console.error("Error requesting upgrade:", error);
      alert("Failed to send request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[var(--bg-card)] rounded-3xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-[var(--bg-main)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors z-10"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="text-center pt-8 pb-4 px-6">
          <h2 className="text-2xl font-black text-[var(--text-main)] mb-1">
            Choose Your Plan
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            Unlock the full potential of HelpDeck
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <span className={cn(
              "text-xs font-bold transition-colors",
              !isYearly ? "text-[var(--text-main)]" : "text-[var(--text-muted)]"
            )}>
              Monthly
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={cn(
                "w-12 h-6 rounded-full transition-colors relative",
                isYearly ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all",
                isYearly ? "left-7" : "left-1"
              )} />
            </button>
            <span className={cn(
              "text-xs font-bold transition-colors flex items-center gap-2",
              isYearly ? "text-[var(--text-main)]" : "text-[var(--text-muted)]"
            )}>
              Yearly
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full text-[10px]">
                Save 15%
              </span>
            </span>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-4 p-6 pb-8 overflow-y-auto max-h-[70vh]">
          {/* Free Plan */}
          <div className="bg-[var(--bg-main)] rounded-2xl p-5 border border-[var(--border-color)] opacity-75 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gray-500 flex items-center justify-center text-white">
                <Zap size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-[var(--text-main)]">Free</h3>
                <p className="text-xs text-[var(--text-muted)]">Forever free</p>
              </div>
            </div>
            
            <div className="mb-4">
              <span className="text-3xl font-black text-[var(--text-main)]">$0</span>
            </div>

            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-xs text-[var(--text-main)]">
                <Check size={14} className="text-emerald-500 shrink-0" />
                <strong>{plans.free.maxWorkspaces} workspaces</strong>
              </li>
              <li className="flex items-center gap-2 text-xs text-[var(--text-main)]">
                <Check size={14} className="text-emerald-500 shrink-0" />
                <strong>{plans.free.maxMembersPerWorkspace} member / workspace</strong>
              </li>
              <li className="flex items-center gap-2 text-xs text-[var(--text-main)]">
                <Check size={14} className="text-emerald-500 shrink-0" />
                <strong>{plans.free.maxCustomers} customers</strong>
              </li>
              <li className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <X size={14} className="text-red-500 shrink-0" />
                No image uploads
              </li>
            </ul>

            <button
               disabled
               className="w-full py-2.5 bg-gray-200 dark:bg-gray-800 text-[var(--text-muted)] rounded-xl font-bold text-sm cursor-not-allowed"
            >
              Current Plan
            </button>
          </div>

          {/* Basic Plan */}
          <div className="bg-[var(--bg-main)] rounded-2xl p-5 border border-[var(--border-color)] hover:border-blue-500/50 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white">
                <Zap size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-[var(--text-main)]">Basic</h3>
                <p className="text-xs text-[var(--text-muted)]">For small teams</p>
              </div>
            </div>
            
            <div className="mb-4">
              <span className="text-3xl font-black text-[var(--text-main)]">${basicPrice}</span>
              <span className="text-[var(--text-muted)] text-sm">/{isYearly ? "mo" : "month"}</span>
              {isYearly && (
                <div className="text-[10px] text-[var(--text-muted)] mt-1">
                  billed annually (${basicPrice * 12})
                </div>
              )}
            </div>

            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-xs text-[var(--text-main)]">
                <Check size={14} className="text-emerald-500 shrink-0" />
                <strong>{plans.basic.maxWorkspaces} workspaces</strong>
              </li>
              <li className="flex items-center gap-2 text-xs text-[var(--text-main)]">
                <Check size={14} className="text-emerald-500 shrink-0" />
                <strong>{plans.basic.maxMembersPerWorkspace} members / workspace</strong>
              </li>
              <li className="flex items-center gap-2 text-xs text-[var(--text-main)]">
                <Check size={14} className="text-emerald-500 shrink-0" />
                <strong>{plans.basic.maxCustomers} customers</strong>
              </li>
              <li className="flex items-center gap-2 text-xs text-[var(--text-main)]">
                <Check size={14} className="text-emerald-500 shrink-0" />
                <strong>Email support</strong>
              </li>
              <li className="flex items-center gap-2 text-xs text-[var(--text-main)]">
                <Check size={14} className="text-emerald-500 shrink-0" />
                <strong>Image uploads</strong>
              </li>
            </ul>

            <button
              onClick={() => handleSubscribe("basic")}
              disabled={loading}
              className="w-full py-2.5 bg-blue-500 text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && selectedPlan === 'basic' && <Loader2 size={16} className="animate-spin" />}
              Upgrade
            </button>
          </div>

          {/* Premium Plan */}
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-5 border-2 border-purple-500/50 relative overflow-hidden">
            {/* Popular Badge */}
            <div className="absolute top-3 right-3 px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold rounded-full">
              Popular
            </div>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                <Crown size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-[var(--text-main)]">Premium</h3>
                <p className="text-xs text-[var(--text-muted)]">For growing</p>
              </div>
            </div>
            
            <div className="mb-4">
              <span className="text-3xl font-black text-[var(--text-main)]">${premiumPrice}</span>
              <span className="text-[var(--text-muted)] text-sm">/{isYearly ? "mo" : "month"}</span>
              {isYearly && (
                <div className="text-[10px] text-[var(--text-muted)] mt-1">
                  billed annually (${premiumPrice * 12})
                </div>
              )}
            </div>

            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-xs text-[var(--text-main)]">
                <Check size={14} className="text-purple-500 shrink-0" />
                <strong>{plans.premium.maxWorkspaces} workspaces</strong>
              </li>
              <li className="flex items-center gap-2 text-xs text-[var(--text-main)]">
                <Check size={14} className="text-purple-500 shrink-0" />
                <strong>{plans.premium.maxMembersPerWorkspace} members / workspace</strong>
              </li>
              <li className="flex items-center gap-2 text-xs text-[var(--text-main)]">
                <Check size={14} className="text-purple-500 shrink-0" />
                <strong>{plans.premium.maxCustomers.toLocaleString()} customers</strong>
              </li>
              <li className="flex items-center gap-2 text-xs text-[var(--text-main)]">
                <Check size={14} className="text-purple-500 shrink-0" />
                <strong>Priority support</strong>
              </li>
              <li className="flex items-center gap-2 text-xs text-[var(--text-main)]">
                <Check size={14} className="text-purple-500 shrink-0" />
                <strong>Advanced analytics</strong>
              </li>
            </ul>

            <button
              onClick={() => handleSubscribe("premium")}
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && selectedPlan === 'premium' && <Loader2 size={16} className="animate-spin" />}
              Upgrade
            </button>
          </div>
        </div>
        
        {/* Enterprise / Contact */}
        <div className="px-6 pb-8">
           <div className="bg-[var(--bg-main)] rounded-2xl p-4 border border-[var(--border-color)] flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                  <h3 className="text-base font-black text-[var(--text-main)]">Enterprise</h3>
                  <p className="text-xs text-[var(--text-muted)]">Unlimited workspaces, 99.9% SLA, SSO, and dedicated support.</p>
              </div>
              <a href="mailto:sales@helpdeck.com" className="px-5 py-2.5 bg-[var(--text-main)] text-[var(--bg-main)] rounded-xl text-xs font-bold whitespace-nowrap hover:opacity-90 transition-opacity">
                Contact Sales
              </a>
           </div>
        </div>
      </div>
    </div>
  );
}
