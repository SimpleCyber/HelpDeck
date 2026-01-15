"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle } from "lucide-react";
import { doc, deleteDoc, collection, getDocs, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/Button";

export function DeleteWorkspace({ workspaceId, name }: { workspaceId: string, name: string }) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      // 1. Delete conversations (shallow cleanup for basic implementation)
      const convs = await getDocs(collection(db, "workspaces", workspaceId, "conversations"));
      const batch = writeBatch(db);
      convs.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();

      // 2. Delete the workspace itself
      await deleteDoc(doc(db, "workspaces", workspaceId));
      
      router.push("/admin/dashboard");
    } catch (e) {
      alert("Error deleting workspace");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="bg-red-50 border border-red-100 p-6 rounded-2xl flex gap-4">
        <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shrink-0">
          <AlertTriangle size={24} />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-red-900">Danger Zone</h3>
          <p className="text-red-700 text-sm">Deleting this workspace will permanently remove all conversations, analytics, and settings. This action cannot be undone.</p>
        </div>
      </div>

      <div className="card p-8 flex flex-col items-center text-center space-y-4">
        <div className="text-gray-400"><Trash2 size={40} /></div>
        <h4 className="font-bold">Delete "{name}"</h4>
        <p className="text-gray-500 text-sm max-w-sm">This will stop the chatbot widget from working on any website using this ID.</p>
        <Button variant="danger" className="h-12 px-8" onClick={() => setShowConfirm(true)}>Delete Workspace</Button>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-gray-900">Are you sure?</h3>
              <p className="text-gray-500 font-medium">This is permanent. You will lose all data for <b>{name}</b>.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1 h-14" onClick={() => setShowConfirm(false)}>Cancel</Button>
              <Button variant="danger" className="flex-1 h-14" loading={loading} onClick={handleDelete}>Yes, Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
