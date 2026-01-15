"use client";

import { useState } from "react";
import { Plus, Trash2, UserPlus, Mail, Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";

interface MembersManagerProps {
  workspaceId: string;
  memberEmails: string[];
  ownerEmail: string;
  isOwner: boolean;
}

import { X } from "lucide-react";

export function MembersManager({ workspaceId, memberEmails = [], ownerEmail, isOwner }: MembersManagerProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading || !isOwner) return;
    const lowerEmail = email.toLowerCase().trim();
    if (memberEmails.includes(lowerEmail)) {
        alert("User is already a member");
        return;
    }

    setLoading(true);
    setEmail(""); // Optimistic clear
    try {
      await updateDoc(doc(db, "workspaces", workspaceId), {
        memberEmails: arrayUnion(lowerEmail)
      });
    } catch (err) {
      console.error("Error adding member:", err);
      setEmail(lowerEmail); // Restore on error
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (m: string) => {
    if (!isOwner) return;
    setDeleting(null); // Optimistic close
    try {
      await updateDoc(doc(db, "workspaces", workspaceId), {
        memberEmails: arrayRemove(m)
      });
    } catch (err) {
      console.error("Error removing member:", err);
      // Optional: Restore modal or show error toast if it fails
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest ml-1 opacity-50">Team Members</h3>
            <p className="text-sm text-[var(--text-muted)] mt-1 ml-1">People who can access this workspace's chats</p>
          </div>
          {isOwner && (
             <div className="px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
                Owner View
             </div>
          )}
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[32px] p-8 shadow-sm space-y-8">
          {/* Add Member Form */}
          {isOwner && (
            <form onSubmit={addMember} className="flex gap-4">
              <div className="flex-1 relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-blue-500 transition-colors" size={18} />
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Collaborator's email address..."
                  className="w-full pl-12 pr-4 h-14 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-[var(--text-muted)]/50"
                  required
                />
              </div>
              <Button 
                type="submit" 
                loading={loading && !deleting}
                className="h-14 px-8 rounded-2xl shadow-lg shadow-blue-500/20"
                icon={UserPlus}
              >
                Add Members
              </Button>
            </form>
          )}

          {/* Members List */}
          <div className="space-y-3">
            {/* Owner Row */}
            <div className="flex items-center justify-between p-4 bg-[var(--bg-main)]/50 rounded-2xl border border-transparent">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/10">
                  <Shield size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--text-main)]">{ownerEmail}</p>
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest opacity-60">Workspace Owner</p>
                </div>
              </div>
            </div>

            {/* Members Rows */}
            {memberEmails.map((m) => (
              <div key={m} className="flex items-center justify-between p-4 bg-[var(--bg-main)]/50 rounded-2xl border border-[var(--border-color)] group hover:border-blue-500/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <Mail size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--text-main)]">{m}</p>
                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-60">Member</p>
                  </div>
                </div>
                {isOwner && (
                  <button 
                    onClick={() => setDeleting(m)}
                    className="p-2 text-[var(--text-muted)] hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}

            {memberEmails.length === 0 && (
              <div className="text-center p-8 opacity-40">
                <p className="text-sm font-bold text-[var(--text-muted)]">No members added yet</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      {deleting && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[40px] p-10 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setDeleting(null)}
              className="absolute top-6 right-6 p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
            >
              <X size={24} />
            </button>

            <div className="mb-8">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-3xl flex items-center justify-center mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-2xl font-black text-[var(--text-main)] tracking-tight mb-2">Remove Member?</h3>
              <p className="text-[var(--text-muted)] font-medium leading-relaxed">
                Remove <span className="text-[var(--text-main)] font-black">{deleting}</span> from workspace?
              </p>
            </div>

            <div className="flex gap-4">
              <Button 
                variant="secondary" 
                onClick={() => setDeleting(null)} 
                className="flex-1 h-14 rounded-2xl font-bold bg-[var(--border-color)] text-[var(--text-main)] border-none hover:bg-opacity-80 transition-all shadow-none"
              >
                Cancel
              </Button>
              <Button 
                variant="primary"
                loading={loading}
                onClick={() => removeMember(deleting)} 
                className="flex-1 h-14 rounded-2xl font-bold bg-red-600 hover:bg-red-700 text-white border-none shadow-xl shadow-red-500/20"
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
