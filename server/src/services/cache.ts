import NodeCache from 'node-cache';
import { fetchMapRotation } from './scraper.js';
import type { MapRotationResponse } from '../types/index.js';

const CACHE_TTL = 30; // 缓存 30 秒
const STALE_TTL = 300; // 5 分钟后标记为 stale

const cache = new NodeCache({
  stdTTL: CACHE_TTL,
  checkperiod: 10,
  deleteOnExpire: false,
});

const CACHE_KEY = 'map_rotation';

interface CacheEntry {
  data: MapRotationResponse;
  stale: boolean;
  cachedAt: string;
}

async function refreshCache(): Promise<void> {
  try {
    const data = await fetchMapRotation();
    const entry: CacheEntry = {
      data,
      stale: false,
      cachedAt: new Date().toISOString(),
    };
    cache.set(CACHE_KEY, entry, CACHE_TTL);
  } catch (error) {
    console.error('[Cache] Failed to refresh:', error);
    // 标记旧数据为 stale
    const existing = cache.get<CacheEntry>(CACHE_KEY);
    if (existing) {
      existing.stale = true;
      cache.set(CACHE_KEY, existing, STALE_TTL);
    }
  }
}

export async function getMapRotation(): Promise<CacheEntry | null> {
  let entry = cache.get<CacheEntry>(CACHE_KEY);

  if (!entry) {
    await refreshCache();
    entry = cache.get<CacheEntry>(CACHE_KEY);
  }

  if (entry) {
    // 检查是否 stale（超过 5 分钟未更新）
    const age = Date.now() - new Date(entry.cachedAt).getTime();
    if (age > STALE_TTL * 1000) {
      entry.stale = true;
    }
  }

  return entry || null;
}

// 自动刷新缓存（每 30 秒）
setInterval(async () => {
  await refreshCache();
}, CACHE_TTL * 1000);

// 启动时立即获取
refreshCache();
