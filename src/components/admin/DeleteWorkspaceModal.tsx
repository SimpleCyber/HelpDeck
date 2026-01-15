"use client";

import { useState } from "react";
import { Loader2, AlertTriangle, X } from "lucide-react";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

interface DeleteWorkspaceModalProps {
  workspaceId: string;
  workspaceName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteWorkspaceModal({ workspaceId, workspaceName, isOpen, onClose, onSuccess }: DeleteWorkspaceModalProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmName, setConfirmName] = useState("");

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmName !== workspaceName || isDeleting) return;
    
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "workspaces", workspaceId));
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error deleting workspace", error);
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
      <div 
        className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[40px] p-10 w-full max-w-lg shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300"
      >
         {/* Background decorative blob */}
         <div className="absolute -top-24 -right-24 w-64 h-64 bg-red-50 dark:bg-red-900/10 rounded-full blur-3xl opacity-50 -z-10" />

        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
        >
          <X size={24} />
        </button>

        <div className="mb-8 text-center">
          <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-3xl flex items-center justify-center text-red-500 mx-auto mb-6 shadow-xl shadow-red-200/50 dark:shadow-none">
            <AlertTriangle size={40} />
          </div>
          <h3 className="text-3xl font-black text-[var(--text-main)] tracking-tight mb-2">Delete Workspace?</h3>
          <p className="text-[var(--text-muted)] font-medium">
            This action cannot be undone. All conversations and data will be permanently lost.
          </p>
        </div>

        <form onSubmit={handleDelete} className="space-y-6">
          <div className="space-y-3">
             <label className="text-sm font-bold text-[var(--text-muted)] ml-1">
               Type <span className="text-[var(--text-main)] font-black">"{workspaceName}"</span> to confirm
             </label>
             <input 
                value={confirmName}
                onChange={e => setConfirmName(e.target.value)}
                placeholder={workspaceName}
                className="w-full h-14 text-lg px-6 rounded-2xl border-2 border-red-100 dark:border-red-900/30 bg-[var(--bg-main)] focus:bg-[var(--bg-card)] focus:border-red-500 transition-all shadow-none text-center font-bold"
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
              disabled={confirmName !== workspaceName || isDeleting} 
              className="flex-1 h-14 rounded-2xl font-bold shadow-xl shadow-red-500/20 bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <div className="flex items-center gap-2">
                  <Loader2 size={20} className="animate-spin" />
                  Deleting...
                </div>
              ) : "Delete Forever"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
