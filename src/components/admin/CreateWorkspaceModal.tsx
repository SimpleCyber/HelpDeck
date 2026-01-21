"use client";

import { useState, useEffect } from "react";
import { Loader2, Globe, X, AlertCircle } from "lucide-react";
import { doc, setDoc, serverTimestamp, getDocs, collection, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { invalidateCache, cacheKeys } from "@/lib/redis";
import { PricingPopup } from "./PricingPopup";

interface CreateWorkspaceModalProps {
  userId: string;
  userEmail: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CreateWorkspaceModal({ userId, userEmail, isOpen, onClose }: CreateWorkspaceModalProps) {
  const router = useRouter();
  const [newWsName, setNewWsName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [loading, setLoading] = useState(true);
  const [limitReached, setLimitReached] = useState(false);
  const [userPlan, setUserPlan] = useState("trial");

  useEffect(() => {
    const checkLimit = async () => {
      if (!isOpen) return;
      setLoading(true);
      try {
        const planConfigSnap = await getDoc(doc(db, "plans_config", "global"));
        const planConfig = planConfigSnap.exists() ? planConfigSnap.data() : null;
        
        const userWorkspacesSnap = await getDocs(collection(db, "users", userId, "workspaces"));
        const currentCount = userWorkspacesSnap.size;

        const userDocSnap = await getDoc(doc(db, "users", userId));
        const userData = userDocSnap.data();
        const plan = userData?.subscription?.plan || "trial";
        setUserPlan(plan);

        const limit = planConfig?.[plan]?.maxWorkspaces ?? (plan === 'premium' ? 15 : plan === 'basic' ? 5 : 2);
        
        if (currentCount >= limit) {
          setLimitReached(true);
        } else {
          setLimitReached(false);
        }
      } catch (error) {
        console.error("Error checking limits:", error);
        setLimitReached(false);
      } finally {
        setLoading(false);
      }
    };
    checkLimit();
  }, [isOpen, userId]);

  const createWs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim() || !userId || isCreating) return;
    
    setIsCreating(true);
    try {
      const wsId = `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const wsRef = doc(db, "users", userId, "workspaces", wsId);
      await setDoc(wsRef, {
        name: newWsName,
        ownerId: userId,
        ownerEmail: userEmail,
        createdAt: serverTimestamp(),
        lastVisitedAt: serverTimestamp(),
        settings: { 
          color: "#3b82f6", 
          name: newWsName, 
          logo: "" 
        },
        memberEmails: [],
        stats: {
          conversationCount: 0,
          messageCount: 0,
          unresolvedCount: 0,
          unreadCount: 0
        }
      });

      await invalidateCache(cacheKeys.userWorkspaces(userId));
      
      router.push(`/admin/workspace/${wsId}?owner=${userId}`);
      onClose();
    } catch (error) {
      console.error("Error creating workspace", error);
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in">
        <Loader2 className="animate-spin text-white w-10 h-10" />
      </div>
    );
  }

  // 1. If Upgrade Popup is shown, render ONLY it.
  if (showUpgrade) {
    return <PricingPopup isOpen={showUpgrade} onClose={() => { setShowUpgrade(false); }} />;
  }

  // 2. If Limit Reached, render Limit Card
  if (limitReached) {
    return (
      <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-white dark:bg-[#1e293b] rounded-[32px] p-8 w-full max-w-sm shadow-2xl relative text-center border border-slate-100 dark:border-slate-700">
          {/* Icon */}
          <div className="w-16 h-16 bg-orange-50 dark:bg-orange-900/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={32} className="text-orange-500" />
          </div>
          
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Limit Reached</h3>
          
          <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed text-sm">
            You've used all available workspaces for the <strong className="capitalize text-slate-900 dark:text-white">{userPlan}</strong> plan. Upgrade to create more.
          </p>

          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="flex-1 py-3 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => setShowUpgrade(true)}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 transition-all transform active:scale-95"
            >
              Upgrade
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Normal Form
  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
      <div 
        className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[40px] p-10 w-full max-w-xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300"
      >
        {/* Background decorative blob */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-50 dark:bg-blue-900/10 rounded-full blur-3xl opacity-50 -z-10" />
        
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
        >
          <X size={24} />
        </button>

        <div className="mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white mb-6 shadow-xl shadow-blue-200">
            <Globe size={32} />
          </div>
          <h3 className="text-3xl font-black text-[var(--text-main)] tracking-tight mb-2">Create Workspace</h3>
          <p className="text-[var(--text-muted)] font-medium">Build a dedicated space for your support team.</p>
        </div>

        <form onSubmit={createWs} className="space-y-8">
          <div className="space-y-2">
            <label className="text-sm font-bold text-[var(--text-muted)] ml-1">Workspace Name</label>
            <Input 
              value={newWsName} 
              onChange={e => setNewWsName(e.target.value)} 
              placeholder="e.g. Acme Support" 
              autoFocus 
              className="h-14 text-lg px-6 rounded-2xl border-[var(--border-color)] bg-[var(--bg-main)] focus:bg-[var(--bg-card)] transition-all shadow-none"
            />
          </div>

          <div className="flex gap-4">
            <Button 
              type="button"
              variant="secondary" 
              onClick={onClose} 
              className="flex-1 h-14 rounded-2xl font-bold bg-[var(--border-color)] text-[var(--text-main)] border-none hover:bg-opacity-80 shadow-none transition-all"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!newWsName.trim() || isCreating} 
              className="flex-1 h-14 rounded-2xl font-bold shadow-xl shadow-blue-500/20"
            >
              {isCreating ? (
                <div className="flex items-center gap-2">
                  <Loader2 size={20} className="animate-spin" />
                  Creating...
                </div>
              ) : "Create Workspace"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
