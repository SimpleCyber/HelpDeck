"use client";

import { useState } from "react";
import { Loader2, Globe, X } from "lucide-react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface CreateWorkspaceModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CreateWorkspaceModal({ userId, isOpen, onClose }: CreateWorkspaceModalProps) {
  const router = useRouter();
  const [newWsName, setNewWsName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const createWs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim() || !userId || isCreating) return;
    
    setIsCreating(true);
    try {
      const docRef = await addDoc(collection(db, "workspaces"), {
        name: newWsName, ownerId: userId, createdAt: serverTimestamp(),
        settings: { color: "#3b82f6", name: newWsName, logo: "" }
      });
      router.push(`/admin/workspace/${docRef.id}`);
      onClose();
    } catch (error) {
      console.error("Error creating workspace", error);
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

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
