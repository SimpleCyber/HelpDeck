"use client";

import { Redis } from "@upstash/redis";

// Upstash Redis client - REST API based, works in Edge and browser
const redis = new Redis({
  url: process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL!,
  token: process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN!,
});

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  USER_PROFILE: 60 * 60 * 24, // 24 hours
  WORKSPACE_META: 60 * 60,    // 1 hour
  STATS: 60 * 5,              // 5 minutes
} as const;

// Cache key generators
export const cacheKeys = {
  user: (uid: string) => `user:${uid}`,
  workspace: (wsId: string) => `workspace:${wsId}`,
  workspaceStats: (wsId: string) => `stats:${wsId}`,
  userWorkspaces: (uid: string) => `user_workspaces:${uid}`,
};

// Generic cache get with type safety
export async function getFromCache<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get<T>(key);
    return data;
  } catch (error) {
    console.error("Redis get error:", error);
    return null;
  }
}

// Generic cache set
export async function setInCache<T>(
  key: string,
  value: T,
  ttlSeconds: number = CACHE_TTL.STATS
): Promise<boolean> {
  try {
    await redis.set(key, value, { ex: ttlSeconds });
    return true;
  } catch (error) {
    console.error("Redis set error:", error);
    return false;
  }
}

// Invalidate cache
export async function invalidateCache(key: string): Promise<boolean> {
  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.error("Redis delete error:", error);
    return false;
  }
}

// Invalidate multiple keys with pattern
export async function invalidateCachePattern(pattern: string): Promise<boolean> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    return true;
  } catch (error) {
    console.error("Redis pattern delete error:", error);
    return false;
  }
}

// Increment counter in cache (for batched updates)
export async function incrementCacheCounter(
  key: string,
  field: string,
  amount: number = 1
): Promise<number> {
  try {
    const result = await redis.hincrby(key, field, amount);
    return result;
  } catch (error) {
    console.error("Redis increment error:", error);
    return 0;
  }
}

// Get all counters from a hash
export async function getCacheCounters(key: string): Promise<Record<string, number>> {
  try {
    const data = await redis.hgetall<Record<string, number>>(key);
    return data || {};
  } catch (error) {
    console.error("Redis hgetall error:", error);
    return {};
  }
}

// Reset hash and return old values (for flushing to Firestore)
export async function flushCacheCounters(key: string): Promise<Record<string, number>> {
  try {
    const data = await redis.hgetall<Record<string, number>>(key);
    if (data && Object.keys(data).length > 0) {
      await redis.del(key);
    }
    return data || {};
  } catch (error) {
    console.error("Redis flush error:", error);
    return {};
  }
}

export { redis };
