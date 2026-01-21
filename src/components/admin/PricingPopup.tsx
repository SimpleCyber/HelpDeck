"use client";

import { useState } from "react";
import { X, Check, Zap, Crown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";

interface PricingPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PricingPopup({ isOpen, onClose }: PricingPopupProps) {
  const { user } = useAuth();
  const [isYearly, setIsYearly] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"basic" | "premium" | null>(null);
  const [loading, setLoading] = useState(false);

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
        <div className="text-center pt-10 pb-6 px-6">
          <h2 className="text-3xl font-black text-[var(--text-main)] mb-2">
            Choose Your Plan
          </h2>
          <p className="text-[var(--text-muted)]">
            Unlock the full potential of HelpDeck
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <span className={cn(
              "text-sm font-bold transition-colors",
              !isYearly ? "text-[var(--text-main)]" : "text-[var(--text-muted)]"
            )}>
              Monthly
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={cn(
                "w-14 h-8 rounded-full transition-colors relative",
                isYearly ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
              )}
            >
              <div className={cn(
                "absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all",
                isYearly ? "left-7" : "left-1"
              )} />
            </button>
            <span className={cn(
              "text-sm font-bold transition-colors flex items-center gap-2",
              isYearly ? "text-[var(--text-main)]" : "text-[var(--text-muted)]"
            )}>
              Yearly
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full text-xs">
                Save 15%
              </span>
            </span>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-6 p-6">
          {/* Basic Plan */}
          <div className="bg-[var(--bg-main)] rounded-2xl p-6 border border-[var(--border-color)] hover:border-blue-500/50 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center text-white">
                <Zap size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-[var(--text-main)]">Basic</h3>
                <p className="text-sm text-[var(--text-muted)]">For small teams</p>
              </div>
            </div>
            
            <div className="mb-6">
              <span className="text-4xl font-black text-[var(--text-main)]">${basicPrice}</span>
              <span className="text-[var(--text-muted)]">/{isYearly ? "mo" : "month"}</span>
              {isYearly && (
                <div className="text-sm text-[var(--text-muted)]">
                  billed annually (${basicPrice * 12}/year)
                </div>
              )}
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-3 text-sm text-[var(--text-main)]">
                <Check size={16} className="text-emerald-500 shrink-0" />
                Create up to <strong>5 workspaces</strong>
              </li>
              <li className="flex items-center gap-3 text-sm text-[var(--text-main)]">
                <Check size={16} className="text-emerald-500 shrink-0" />
                Add maximum <strong>2 people</strong> per workspace
              </li>
              <li className="flex items-center gap-3 text-sm text-[var(--text-main)]">
                <Check size={16} className="text-emerald-500 shrink-0" />
                Attend up to <strong>100 customers</strong>
              </li>
              <li className="flex items-center gap-3 text-sm text-[var(--text-main)]">
                <Check size={16} className="text-emerald-500 shrink-0" />
                Email support
              </li>
            </ul>

            <button
              onClick={() => handleSubscribe("basic")}
              disabled={loading}
              className="w-full py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && selectedPlan === 'basic' && <Loader2 size={18} className="animate-spin" />}
              Get Started
            </button>
          </div>

          {/* Premium Plan */}
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border-2 border-purple-500/50 relative overflow-hidden">
            {/* Popular Badge */}
            <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full">
              Most Popular
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                <Crown size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-[var(--text-main)]">Premium</h3>
                <p className="text-sm text-[var(--text-muted)]">For growing businesses</p>
              </div>
            </div>
            
            <div className="mb-6">
              <span className="text-4xl font-black text-[var(--text-main)]">${premiumPrice}</span>
              <span className="text-[var(--text-muted)]">/{isYearly ? "mo" : "month"}</span>
              {isYearly && (
                <div className="text-sm text-[var(--text-muted)]">
                  billed annually (${premiumPrice * 12}/year)
                </div>
              )}
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-3 text-sm text-[var(--text-main)]">
                <Check size={16} className="text-purple-500 shrink-0" />
                Create <strong>10-15 workspaces</strong>
              </li>
              <li className="flex items-center gap-3 text-sm text-[var(--text-main)]">
                <Check size={16} className="text-purple-500 shrink-0" />
                Add <strong>3-4 extra people</strong> per workspace
              </li>
              <li className="flex items-center gap-3 text-sm text-[var(--text-main)]">
                <Check size={16} className="text-purple-500 shrink-0" />
                Attend up to <strong>1,000 customers</strong>
              </li>
              <li className="flex items-center gap-3 text-sm text-[var(--text-main)]">
                <Check size={16} className="text-purple-500 shrink-0" />
                Priority support
              </li>
              <li className="flex items-center gap-3 text-sm text-[var(--text-main)]">
                <Check size={16} className="text-purple-500 shrink-0" />
                 Advanced analytics
              </li>
            </ul>

            <button
              onClick={() => handleSubscribe("premium")}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:opacity-90 transition-opacity active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && selectedPlan === 'premium' && <Loader2 size={18} className="animate-spin" />}
              Upgrade Now
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pb-8 px-6">
          <p className="text-sm text-[var(--text-muted)]">
            All plans include a 14-day money-back guarantee. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
