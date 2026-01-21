"use client";

import { 
  doc, 
  writeBatch, 
  increment, 
  updateDoc, 
  getDoc, 
  setDoc,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { db } from "./firebase";
import { 
  incrementCacheCounter, 
  flushCacheCounters, 
  cacheKeys,
  getFromCache,
  setInCache,
  invalidateCache,
  CACHE_TTL
} from "./redis";

// ============================================
// Types
// ============================================

export interface UserProfile {
  name: string;
  email: string;
  photoBase64: string;
  createdAt: Timestamp | null;
  lastLoginAt: Timestamp | null;
  subscription: {
    plan: "trial" | "basic" | "premium";
    startDate: Timestamp | null;
    endDate: Timestamp | null;
    status: "active" | "expired" | "cancelled";
  };
}

export interface WorkspaceData {
  name: string;
  ownerId: string;
  ownerEmail: string;
  createdAt: Timestamp | null;
  lastVisitedAt: Timestamp | null;
  settings: {
    color: string;
    name: string;
    logo: string;
  };
  memberEmails: string[];
  stats: {
    conversationCount: number;
    messageCount: number;
    unresolvedCount: number;
    unreadCount: number;
  };
}

// ============================================
// Counter Queue for Batched Updates
// ============================================

interface CounterUpdate {
  wsId: string;
  field: string;
  amount: number;
}

class CounterQueue {
  private queue: Map<string, CounterUpdate[]> = new Map();
  private flushTimeout: NodeJS.Timeout | null = null;
  private flushIntervalMs = 5000; // 5 seconds
  private ownerIdMap: Map<string, string> = new Map(); // wsId -> ownerId

  setOwnerForWorkspace(wsId: string, ownerId: string) {
    this.ownerIdMap.set(wsId, ownerId);
  }

  add(wsId: string, field: string, amount: number = 1) {
    // Queue in Redis for persistence
    const cacheKey = cacheKeys.workspaceStats(wsId);
    incrementCacheCounter(cacheKey, field, amount);

    // Also maintain local queue for batch flush
    if (!this.queue.has(wsId)) {
      this.queue.set(wsId, []);
    }
    this.queue.get(wsId)!.push({ wsId, field, amount });

    // Schedule flush if not already scheduled
    if (!this.flushTimeout) {
      this.flushTimeout = setTimeout(() => this.flush(), this.flushIntervalMs);
    }
  }

  async flush() {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }

    const workspaceIds = Array.from(this.queue.keys());
    if (workspaceIds.length === 0) return;

    // Process each workspace
    for (const wsId of workspaceIds) {
      const updates = this.queue.get(wsId) || [];
      if (updates.length === 0) continue;

      // Aggregate updates by field
      const aggregated: Record<string, number> = {};
      for (const update of updates) {
        aggregated[update.field] = (aggregated[update.field] || 0) + update.amount;
      }

      // Get ownerId for this workspace
      const ownerId = this.ownerIdMap.get(wsId);
      if (!ownerId) {
        console.warn(`No ownerId found for workspace ${wsId}, skipping batch update`);
        continue;
      }

      try {
        const batch = writeBatch(db);
        const wsRef = doc(db, "users", ownerId, "workspaces", wsId);

        // Build increment updates
        const firestoreUpdates: Record<string, any> = {};
        for (const [field, amount] of Object.entries(aggregated)) {
          firestoreUpdates[`stats.${field}`] = increment(amount);
        }

        batch.update(wsRef, firestoreUpdates);
        await batch.commit();

        // Clear Redis counter cache after successful flush
        await flushCacheCounters(cacheKeys.workspaceStats(wsId));

        // Invalidate workspace cache so next read gets fresh data
        await invalidateCache(cacheKeys.workspace(wsId));

      } catch (error) {
        console.error(`Error flushing counters for workspace ${wsId}:`, error);
      }
    }

    // Clear local queue
    this.queue.clear();
  }

  // Force immediate flush (call on page unload)
  async forceFlush() {
    await this.flush();
  }
}

export const counterQueue = new CounterQueue();

// ============================================
// User Profile Helpers
// ============================================

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  // Try cache first
  const cached = await getFromCache<UserProfile>(cacheKeys.user(uid));
  if (cached) {
    return cached;
  }

  // Fallback to Firestore
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const data = userDoc.data() as UserProfile;
      // Cache it
      await setInCache(cacheKeys.user(uid), data, CACHE_TTL.USER_PROFILE);
      return data;
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
  }

  return null;
}

export async function createOrUpdateUser(
  uid: string, 
  data: Partial<UserProfile>,
  isNewUser: boolean = false
): Promise<boolean> {
  try {
    const userRef = doc(db, "users", uid);
    
    if (isNewUser) {
      // Calculate trial end date (7 days from now)
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 7);

      const newUserData: UserProfile = {
        name: data.name || "",
        email: data.email || "",
        photoBase64: data.photoBase64 || "",
        createdAt: serverTimestamp() as unknown as Timestamp,
        lastLoginAt: serverTimestamp() as unknown as Timestamp,
        subscription: {
          plan: "trial",
          startDate: serverTimestamp() as unknown as Timestamp,
          endDate: Timestamp.fromDate(trialEnd),
          status: "active",
        },
      };

      await setDoc(userRef, newUserData);
    } else {
      await updateDoc(userRef, {
        ...data,
        lastLoginAt: serverTimestamp(),
      });
    }

    // Invalidate cache
    await invalidateCache(cacheKeys.user(uid));

    return true;
  } catch (error) {
    console.error("Error creating/updating user:", error);
    return false;
  }
}

// ============================================
// Workspace Helpers
// ============================================

export async function getWorkspaceWithCache(
  ownerId: string,
  wsId: string
): Promise<WorkspaceData | null> {
  // Try cache first
  const cached = await getFromCache<WorkspaceData>(cacheKeys.workspace(wsId));
  if (cached) {
    return cached;
  }

  // Fallback to Firestore
  try {
    const wsDoc = await getDoc(doc(db, "users", ownerId, "workspaces", wsId));
    if (wsDoc.exists()) {
      const data = wsDoc.data() as WorkspaceData;
      // Cache it
      await setInCache(cacheKeys.workspace(wsId), data, CACHE_TTL.WORKSPACE_META);
      return data;
    }
  } catch (error) {
    console.error("Error fetching workspace:", error);
  }

  return null;
}

export async function updateWorkspaceStats(
  ownerId: string,
  wsId: string,
  field: "conversationCount" | "messageCount" | "unresolvedCount" | "unreadCount",
  amount: number = 1
) {
  // Set owner mapping for batch flush
  counterQueue.setOwnerForWorkspace(wsId, ownerId);
  
  // Queue the update
  counterQueue.add(wsId, field, amount);
}

// ============================================
// Image Compression Utility
// ============================================

export async function compressGooglePhoto(photoURL: string): Promise<string> {
  if (!photoURL) return "";

  try {
    // Fetch the image
    const response = await fetch(photoURL);
    const blob = await response.blob();

    // Create an image element
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas and resize
        const canvas = document.createElement("canvas");
        const maxSize = 128; // Small profile image
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert to base64 with compression
        const base64 = canvas.toDataURL("image/jpeg", 0.7);
        resolve(base64);
      };

      img.onerror = () => resolve("");
      img.crossOrigin = "anonymous";
      img.src = URL.createObjectURL(blob);
    });
  } catch (error) {
    console.error("Error compressing Google photo:", error);
    return "";
  }
}

// ============================================
// Flush on page unload
// ============================================

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    counterQueue.forceFlush();
  });
}
