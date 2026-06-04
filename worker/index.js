/**
 * ApexMap Live - Cloudflare Worker
 * 处理 API 请求并托管前端静态文件
 */

const SOURCE_URL = 'https://apexlegendsstatus.com/current-map';
const MAP_IMAGE_BASE = 'https://apexlegendsstatus.com/assets/maps/';

const MODE_CONFIG = [
  { containerClass: 'sdcat',    mode: 'pubs',     modeName: 'BR Pubs',    modeNameZh: '匹配赛' },
  { containerClass: 'brranked', mode: 'ranked',   modeName: 'BR Ranked',  modeNameZh: '排位赛' },
  { containerClass: 'mixtape',  mode: 'mixtape',  modeName: 'Mixtape',    modeNameZh: '娱乐模式' },
  { containerClass: 'wildcard', mode: 'wildcard',  modeName: 'Wildcard',   modeNameZh: '外卡' },
];

const MAP_ZH = {
  'Kings Canyon': '诸王峡谷',
  "World's Edge": '世界边缘',
  'Olympus': '奥林匹斯',
  'Storm Point': '风暴点',
  'Broken Moon': '残月',
  'E-District': 'E区',
  'Caustic Treatment': '腐蚀处理厂',
  'Phase Runner': '相位跑道',
  'Drop-Off': '投放点',
  'Habitat': '栖息地',
  'Siphon': '虹吸',
  'Thunder Watch': '雷霆穹顶',
  'Skull Town': '骷髅镇',
  'Skulltown': '骷髅镇',
  'Estate': '庄园',
  'Estates': '庄园',
  'Fragment': '碎片',
  'Lava Siphon': '熔岩虹吸',
  'Party Crasher': '派对破坏者',
  'Monument': '纪念碑',
  'Encore': '再来一局',
  'Overflow': '溢出',
  'Barometer': '气压计',
  'Resort': '度假村',
  'Cascade Falls': '瀑布',
  'Deathwatch': '死亡观察',
  'Zeus Station': '宙斯空间站',
  'Launch Site': '发射场',
  'Countdown': '倒计时',
  'Lava Filtors': '熔岩过滤厂',
  'Habitat Orbital': '轨道栖息地',
  'Hammond Labs': '哈蒙德实验室',
  'No Map Data': '未知地图',
};

const SUB_MODE_ZH = {
  'TDM': '团队死斗',
  'Gun Run': '枪战',
  'Control': '控制',
};

function getMapZhName(englishName) {
  if (MAP_ZH[englishName]) return MAP_ZH[englishName];
  const parts = englishName.split(' - ');
  const baseName = parts[0].trim();
  const subMode = parts[1]?.trim();
  if (MAP_ZH[baseName]) {
    const subZh = subMode ? SUB_MODE_ZH[subMode] || subMode : '';
    return subZh ? `${MAP_ZH[baseName]}-${subZh}` : MAP_ZH[baseName];
  }
  return englishName;
}

function getMapImageUrl(name) {
  const cleaned = name.split(' - ')[0].trim();
  const formatted = cleaned.replace(/\s+/g, '_');
  return `${MAP_IMAGE_BASE}${formatted}.png`;
}

function parseTimeRange(text) {
  const matches = [...text.matchAll(/data-tz="(\d+)"/g)];
  if (matches.length < 2) return null;
  return { from: parseInt(matches[0][1]), to: parseInt(matches[1][1]) };
}

// KV 缓存键
const CACHE_KEY = 'map-rotation-data';
const CACHE_TTL = 30; // 秒

async function fetchMapRotation(env) {
  // 尝试从 KV 读取缓存
  if (env.MAP_CACHE) {
    const cached = await env.MAP_CACHE.get(CACHE_KEY, 'json');
    if (cached && Date.now() - cached._cachedAt < CACHE_TTL * 1000) {
      return cached;
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(SOURCE_URL, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    if (!response.ok) throw new Error(`Upstream fetch failed: ${response.status}`);

    const html = await response.text();
    const modes = scrapeModes(html);
    const result = { lastUpdated: new Date().toISOString(), modes, _cachedAt: Date.now() };

    // 写入 KV 缓存
    if (env.MAP_CACHE) {
      await env.MAP_CACHE.put(CACHE_KEY, JSON.stringify(result), { expirationTtl: 120 });
    }

    return result;
  } finally {
    clearTimeout(timeout);
  }
}

function scrapeModes(html) {
  const modes = {};

  for (const config of MODE_CONFIG) {
    // 用正则定位容器区域（Cloudflare Workers 无法使用 cheerio）
    const containerRegex = new RegExp(
      `class="curmap-overview-card[^"]*"[\\s\\S]*?class="[^"]*${config.containerClass}[^"]*"([\\s\\S]*?)(?=class="curmap-overview-card|$)`,
      'i'
    );

    // 更宽松的匹配：找到包含目标 class 的 overview-card 区块
    const sectionRegex = new RegExp(
      `class="[^"]*\\b${config.containerClass}\\b[^"]*"([\\s\\S]*?)(?=</div>\\s*</div>\\s*</div>|<div[^>]*class="[^"]*curmap-overview-card)`,
      'i'
    );

    const sectionMatch = html.match(sectionRegex);
    if (!sectionMatch) {
      console.warn(`Container not found for mode: ${config.mode}`);
      continue;
    }

    const section = sectionMatch[0];

    // 提取当前地图名 - h2 标签
    const h2Match = section.match(/<h2[^>]*>(.*?)<\/h2>/i);
    const currentMapName = h2Match ? h2Match[1].trim() : 'Unknown';

    // 提取时间数据 - data-tz 属性
    const tzMatches = [...section.matchAll(/data-tz="(\d+)"/g)];
    const startTime = tzMatches.length >= 1 ? parseInt(tzMatches[0][1]) : 0;
    const endTime = tzMatches.length >= 2 ? parseInt(tzMatches[1][1]) : 0;

    // 提取 data-start / data-end
    const dataStartMatch = section.match(/data-start="(\d+)"/);
    const dataEndMatch = section.match(/data-end="(\d+)"/);
    const timerStart = dataStartMatch ? parseInt(dataStartMatch[1]) : 0;
    const timerEnd = dataEndMatch ? parseInt(dataEndMatch[1]) : 0;

    // 提取接下来的地图
    const nextMaps = [];
    const nextMapRegex = /class="curmap-next-map"[^>]*(?:style="([^"]*)")?[\s\S]*?<h4[^>]*>(.*?)<\/h4>[\s\S]*?(?:data-tz="(\d+)"[\s\S]*?data-tz="(\d+)")?/gi;
    let nextMatch;
    while ((nextMatch = nextMapRegex.exec(section)) !== null) {
      const [, bgStyle, name, startTs, endTs] = nextMatch;
      if (name) {
        let image = getMapImageUrl(name);
        if (bgStyle) {
          const bgMatch = bgStyle.match(/url\(['"]?(.+?)['"]?\)/);
          if (bgMatch) image = bgMatch[1];
        }
        nextMaps.push({
          name: name.trim(),
          nameZh: getMapZhName(name.trim()),
          image,
          startTime: startTs ? parseInt(startTs) : 0,
          endTime: endTs ? parseInt(endTs) : 0,
        });
      }
    }

    modes[config.mode] = {
      mode: config.mode,
      modeName: config.modeName,
      modeNameZh: config.modeNameZh,
      current: {
        name: currentMapName,
        nameZh: getMapZhName(currentMapName),
        image: getMapImageUrl(currentMapName),
        startTime: startTime || timerStart,
        endTime: endTime || timerEnd,
      },
      next: nextMaps,
    };
  }

  return modes;
}

// ===== Worker 入口 =====

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // 处理 OPTIONS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // API: 健康检查
    if (url.pathname === '/api/health') {
      return Response.json(
        { service: 'ApexMap Live API', status: 'running', timestamp: new Date().toISOString() },
        { headers: corsHeaders }
      );
    }

    // API: 获取地图轮换数据
    if (url.pathname === '/api/maps/current') {
      try {
        const data = await fetchMapRotation(env);
        // 移除内部缓存时间戳
        delete data._cachedAt;
        return Response.json(data, { headers: corsHeaders });
      } catch (error) {
        console.error('[API Error]', error.message);
        return Response.json(
          { error: '服务器错误', message: error.message },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    // 其他请求：交给静态资源处理
    return env.ASSETS.fetch(request);
  },
};
