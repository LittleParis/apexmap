import type { PagesFunction } from '@cloudflare/workers-types';

const UPSTREAM_BASE = 'https://apexlegendsstatus.com/assets/maps/';
const CACHE_TTL = 86400; // 24 小时

export const onRequest: PagesFunction = async (context) => {
  const { name } = context.params;

  if (!name || typeof name !== 'string') {
    return new Response('Bad Request', { status: 400 });
  }

  const upstreamUrl = `${UPSTREAM_BASE}${encodeURIComponent(name)}`;
  const cacheKey = new Request(context.request.url, context.request);
  const cache = (caches as any).default;

  // 尝试从边缘缓存读取
  let response = await cache.match(cacheKey);

  if (!response) {
    // 缓存未命中，从上游获取
    const upstreamResponse = await fetch(upstreamUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      },
      cf: {
        cacheTtl: CACHE_TTL,
        cacheEverything: true,
      },
    } as any);

    if (!upstreamResponse.ok) {
      return new Response('Image not found', { status: 404 });
    }

    // 构造带缓存头的响应
    response = new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: new Headers(upstreamResponse.headers),
    });

    response.headers.set('Cache-Control', `public, max-age=${CACHE_TTL}`);
    response.headers.set('Access-Control-Allow-Origin', '*');

    // 写入边缘缓存
    context.waitUntil(cache.put(cacheKey, response.clone()));
  }

  return response;
};
