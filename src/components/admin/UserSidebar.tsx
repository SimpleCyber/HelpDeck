"use client";

import { useState, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  User,
  Mail,
  Hash,
  MapPin,
  Globe,
  Clock,
} from "lucide-react";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

interface UserSidebarProps {
  workspaceId: string;
  ownerId: string;
  conversation: any;
  isOpen: boolean;
  onClose: () => void;
}

interface CustomField {
  id: string;
  label: string;
  key: string;
  type: string;
}

export function UserSidebar({
  workspaceId,
  ownerId,
  conversation,
  isOpen,
  onClose,
}: UserSidebarProps) {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newKey, setNewKey] = useState("");

  // Fetch custom fields definition
  useEffect(() => {
    if (!workspaceId || !ownerId) return;

    const q = query(
      collection(
        db,
        "users",
        ownerId,
        "workspaces",
        workspaceId,
        "custom_fields",
      ),
      orderBy("createdAt", "asc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFields(
        snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as CustomField),
      );
    });

    return () => unsubscribe();
  }, [workspaceId, ownerId]);

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel || !newKey) return;

    try {
      await addDoc(
        collection(
          db,
          "users",
          ownerId,
          "workspaces",
          workspaceId,
          "custom_fields",
        ),
        {
          label: newLabel,
          key: newKey, // e.g., "phoneNumber"
          type: "text",
          createdAt: serverTimestamp(),
        },
      );
      setNewLabel("");
      setNewKey("");
      setIsAdding(false);
    } catch (error) {
      console.error("Error adding custom field:", error);
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this field definition? Data stored in conversations will remain but be hidden.",
      )
    )
      return;
    try {
      await deleteDoc(
        doc(
          db,
          "users",
          ownerId,
          "workspaces",
          workspaceId,
          "custom_fields",
          fieldId,
        ),
      );
    } catch (error) {
      console.error("Error deleting custom field:", error);
    }
  };

  const handleUpdateValue = async (key: string, value: string) => {
    if (!conversation?.id) return;
    try {
      await updateDoc(
        doc(
          db,
          "users",
          ownerId,
          "workspaces",
          workspaceId,
          "conversations",
          conversation.id,
        ),
        {
          [`customData.${key}`]: value,
        },
      );
    } catch (error) {
      console.error("Error updating custom data:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-[320px] bg-[var(--bg-card)] border-l border-[var(--border-color)] flex flex-col shrink-0 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="h-24 px-6 border-b border-[var(--border-color)] flex items-center justify-between shrink-0">
        <h3 className="font-black text-lg text-[var(--text-main)]">
          User Details
        </h3>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full hover:bg-[var(--bg-main)] flex items-center justify-center text-[var(--text-muted)] transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Profile Card */}
        <div className="flex flex-col items-center p-6 bg-[var(--bg-main)] rounded-2xl border border-[var(--border-color)]">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-lg shadow-blue-500/20 mb-4">
            {conversation?.userName?.[0]?.toUpperCase() || <User />}
          </div>
          <h4 className="font-bold text-lg text-[var(--text-main)] text-center">
            {conversation?.userName || "Unknown User"}
          </h4>
          <p className="text-sm text-[var(--text-muted)] font-medium text-center opacity-80">
            {conversation?.userEmail || "No email"}
          </p>
        </div>

        {/* Standard Info */}
        <section className="space-y-4">
          <h5 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">
            Core Information
          </h5>

          <div className="space-y-3">
            <div className="bg-[var(--bg-main)] p-3 rounded-xl border border-[var(--border-color)] flex gap-3 items-center">
              <Mail size={16} className="text-[var(--text-muted)] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">
                  Email
                </p>
                <p className="text-sm font-bold text-[var(--text-main)] truncate">
                  {conversation?.userEmail}
                </p>
              </div>
            </div>

            <div className="bg-[var(--bg-main)] p-3 rounded-xl border border-[var(--border-color)] flex gap-3 items-center">
              <Hash size={16} className="text-[var(--text-muted)] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">
                  User ID
                </p>
                <p
                  className="text-xs font-mono font-medium text-[var(--text-main)] truncate"
                  title={conversation?.externalId || conversation?.id}
                >
                  {conversation?.externalId || conversation?.id}
                </p>
              </div>
            </div>

            {/* Simulated Location/IP data if we had it */}
            {(conversation?.location || conversation?.ip) && (
              <div className="bg-[var(--bg-main)] p-3 rounded-xl border border-[var(--border-color)] flex gap-3 items-center">
                <MapPin
                  size={16}
                  className="text-[var(--text-muted)] shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">
                    Location
                  </p>
                  <p className="text-sm font-bold text-[var(--text-main)] truncate">
                    {conversation.location || "Unknown"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Custom Data - Dynamically Displayed */}
        {conversation?.customData &&
          Object.keys(conversation.customData).length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">
                  Custom Data
                </h5>
              </div>

              <div className="space-y-3">
                {Object.entries(conversation.customData).map(([key, value]) => (
                  <div
                    key={key}
                    className="bg-[var(--bg-main)] p-3 rounded-xl border border-[var(--border-color)] flex gap-3 items-center group relative hover:border-blue-500/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-0.5">
                        {key.replace(/([A-Z])/g, " $1").trim()}{" "}
                        {/* Simple camelCase to Space */}
                      </p>
                      <p
                        className="text-sm font-bold text-[var(--text-main)] truncate"
                        title={String(value)}
                      >
                        {String(value)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
      </div>
    </div>
  );
}
