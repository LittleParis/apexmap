import * as cheerio from 'cheerio';
import type { MapInfo, MapMode, MapRotationResponse } from '../types/index.js';

const SOURCE_URL = 'https://apexlegendsstatus.com/current-map';
const MAP_IMAGE_BASE = 'https://apexlegendsstatus.com/assets/maps/';

const MODE_CONFIG = [
  { containerClass: 'sdcat',    mode: 'pubs',     modeName: 'BR Pubs',    modeNameZh: '匹配赛' },
  { containerClass: 'brranked', mode: 'ranked',   modeName: 'BR Ranked',  modeNameZh: '排位赛' },
  { containerClass: 'mixtape',  mode: 'mixtape',  modeName: 'Mixtape',    modeNameZh: '娱乐模式' },
  { containerClass: 'wildcard', mode: 'wildcard',  modeName: 'Wildcard',   modeNameZh: '外卡' },
];

// 英文地图名 → 中文名映射
const MAP_ZH: Record<string, string> = {
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

// 混音带子模式名翻译
const SUB_MODE_ZH: Record<string, string> = {
  'TDM': '团队死斗',
  'Gun Run': '枪战',
  'Control': '控制',
};

function getMapZhName(englishName: string): string {
  // 先精确匹配
  if (MAP_ZH[englishName]) return MAP_ZH[englishName];

  // 尝试匹配子模式名（如 "Skulltown - TDM"）
  const parts = englishName.split(' - ');
  const baseName = parts[0].trim();
  const subMode = parts[1]?.trim();

  if (MAP_ZH[baseName]) {
    const subZh = subMode ? SUB_MODE_ZH[subMode] || subMode : '';
    return subZh ? `${MAP_ZH[baseName]}-${subZh}` : MAP_ZH[baseName];
  }

  return englishName;
}

function getMapImageUrl(name: string): string {
  const cleaned = name.split(' - ')[0].trim();
  const formatted = cleaned.replace(/\s+/g, '_');
  return `${MAP_IMAGE_BASE}${formatted}.png`;
}

function parseTimeRange(text: string): { from: number; to: number } | null {
  const matches = [...text.matchAll(/data-tz="(\d+)"/g)];
  if (matches.length < 2) return null;

  const from = parseInt(matches[0][1]);
  const to = parseInt(matches[1][1]);
  return { from, to };
}

export async function fetchMapRotation(): Promise<MapRotationResponse> {
  const response = await fetch(SOURCE_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch map data: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const modes: Record<string, MapMode> = {};

  for (const config of MODE_CONFIG) {
    const card = $(`.curmap-overview-card .container.${config.containerClass}`).closest('.curmap-overview-card');

    if (card.length === 0) {
      console.warn(`[Scraper] Mode "${config.modeName}" container (.${config.containerClass}) not found`);
      continue;
    }

    const container = card.find(`.${config.containerClass}`);
    const currentMapName = container.find('h2').first().text().trim();
    const timeH5 = container.find('h5').first();
    const timeHtml = timeH5.html() || '';
    const timeData = parseTimeRange(timeHtml);

    const timerDiv = card.find('[data-start][data-end]').first();
    const timerStart = parseInt(timerDiv.attr('data-start') || '0');
    const timerEnd = parseInt(timerDiv.attr('data-end') || '0');

    // 解析下一张地图
    const nextMaps: MapInfo[] = [];
    card.find('.curmap-next-map').each((_, el) => {
      const $el = $(el);
      const name = $el.find('h4').text().trim();
      const timeSpans = $el.find('p span[data-tz]');
      const startTs = parseInt($(timeSpans[0]).attr('data-tz') || '0');
      const endTs = parseInt($(timeSpans[1]).attr('data-tz') || '0');

      // 尝试从背景图提取真实图片 URL
      const bgStyle = $el.attr('style') || '';
      const bgMatch = bgStyle.match(/url\(['"]?(.+?)['"]?\)/);
      const image = bgMatch ? bgMatch[1] : getMapImageUrl(name);

      if (name) {
        nextMaps.push({
          name,
          nameZh: getMapZhName(name),
          image,
          startTime: startTs,
          endTime: endTs,
        });
      }
    });

    const currentImage = getMapImageUrl(currentMapName);

    const current: MapInfo = {
      name: currentMapName,
      nameZh: getMapZhName(currentMapName),
      image: currentImage,
      startTime: timeData?.from || timerStart,
      endTime: timeData?.to || timerEnd,
    };

    modes[config.mode] = {
      mode: config.mode,
      modeName: config.modeName,
      modeNameZh: config.modeNameZh,
      current,
      next: nextMaps,
    };
  }

  return {
    lastUpdated: new Date().toISOString(),
    modes,
  };
}
