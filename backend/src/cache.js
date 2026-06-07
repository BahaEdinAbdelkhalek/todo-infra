import { createClient } from 'redis';
let client;

export async function connectRedis() {
  client = createClient({ url: process.env.REDIS_URL || 'redis://redis:6379' });
  client.on('error', (err) => console.error('Redis error:', err));
  await client.connect();
  console.log('Redis connected');
}

const DEFAULT_TTL = 60;

export async function cacheGet(key) {
  try { const val = await client.get(key); return val ? JSON.parse(val) : null; }
  catch { return null; }
}

export async function cacheSet(key, value, ttl = DEFAULT_TTL) {
  try { await client.setEx(key, ttl, JSON.stringify(value)); }
  catch (err) { console.warn('Cache write failed:', err.message); }
}

export async function cacheInvalidatePattern(pattern) {
  try { const keys = await client.keys(pattern); if (keys.length) await client.del(keys); }
  catch (err) { console.warn('Cache invalidation failed:', err.message); }
}
