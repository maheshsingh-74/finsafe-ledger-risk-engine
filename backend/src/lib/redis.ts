import Redis from "ioredis";
import { env } from "./env";

// In-memory fallback cache if Redis is not available
class InMemoryCache {
  private store = new Map<string, { value: string; expiresAt: number }>();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async setex(key: string, ttlSeconds: number, value: string): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
}

const memoryStore = new InMemoryCache();
let redisClient: Redis | null = null;
let useRedis = false;

try {
  redisClient = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    retryStrategy: () => null, // don't infinitely retry if server is offline
    lazyConnect: true,
  });

  redisClient.connect().then(() => {
    useRedis = true;
    console.log("✅ Redis connected");
  }).catch(() => {
    console.log("ℹ️  Redis not available — using in-memory store for idempotency & rate limits");
    useRedis = false;
  });
} catch {
  console.log("ℹ️  Running in-memory cache mode (zero-dependency setup)");
}

export const redis = redisClient;

export const IDEMPOTENCY_TTL = 60 * 60 * 24; // 24 hours

export async function getIdempotencyResult(key: string): Promise<Record<string, unknown> | null> {
  try {
    if (useRedis && redisClient) {
      const data = await redisClient.get(`idempotency:${key}`);
      return data ? JSON.parse(data) : null;
    }
  } catch {
    // fallback to memory
  }
  const memData = await memoryStore.get(`idempotency:${key}`);
  return memData ? JSON.parse(memData) : null;
}

export async function setIdempotencyResult(
  key: string,
  result: Record<string, unknown>
): Promise<void> {
  const serialized = JSON.stringify(result);
  try {
    if (useRedis && redisClient) {
      await redisClient.setex(`idempotency:${key}`, IDEMPOTENCY_TTL, serialized);
      return;
    }
  } catch {
    // fallback to memory
  }
  await memoryStore.setex(`idempotency:${key}`, IDEMPOTENCY_TTL, serialized);
}
