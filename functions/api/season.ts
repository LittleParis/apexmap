import type { PagesFunction } from '@cloudflare/workers-types';
import * as cheerio from 'cheerio';

const SEASON_URL = 'https://apexlegendsstatus.com/new-season-countdown';

// 内存缓存（赛季数据变化频率极低，缓存 1 小时）
let cachedSeason: any = null;
let cachedSeasonAt = 0;
const SEASON_CACHE_TTL = 3_600_000; // 1 小时

export interface SeasonApiResponse {
  number: number;
  nameEn: string;
  countdownTs: number;
  lastUpdated: string;
}

async function fetchSeasonInfo(): Promise<SeasonApiResponse> {
  const now = Date.now();
  if (cachedSeason && now - cachedSeasonAt < SEASON_CACHE_TTL) {
    return cachedSeason;
  }

  const response = await fetch(SEASON_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml',
    },
  });

  if (!response.ok) throw new Error(`Season fetch failed: ${response.status}`);

  const html = await response.text();
  const $ = cheerio.load(html);

  // 从 <title> 提取赛季编号，例如 "Season 29 countdown"
  const titleText = $('title').first().text().trim();
  const numMatch = titleText.match(/Season\s+(\d+)/i);
  const seasonNumber = numMatch ? parseInt(numMatch[1]) : 0;

  // 从 <h1> 提取赛季英文名，例如 "Season 29 : Overclocked"
  const h1Text = $('h1').first().text().trim();
  const nameMatch = h1Text.match(/:\s*(.+)/);
  const nameEn = nameMatch ? nameMatch[1].trim() : '';

  // 从内联脚本提取倒计时目标时间戳
  // 赛季开始前 → 当前赛季的 startDate
  // 赛季进行中 → 下一赛季的 startDate
  // 匹配: let startTime = 1778000400;
  const scriptContent = $('script').map((_, el) => $(el).html() || '').get().join('\n');
  const tsMatch = scriptContent.match(/let\s+startTime\s*=\s*(\d+)/);
  const countdownTs = tsMatch ? parseInt(tsMatch[1]) : 0;

  if (!seasonNumber || !countdownTs) {
    throw new Error('Failed to parse season data from source');
  }

  const result: SeasonApiResponse = {
    number: seasonNumber,
    nameEn,
    countdownTs,
    lastUpdated: new Date().toISOString(),
  };

  cachedSeason = result;
  cachedSeasonAt = now;
  return result;
}

export const onRequest: PagesFunction = async () => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET',
    'Content-Type': 'application/json',
  };

  try {
    const data = await fetchSeasonInfo();
    return new Response(JSON.stringify(data), { status: 200, headers });
  } catch (error: any) {
    console.error('[Season API Error]', error);
    return new Response(
      JSON.stringify({ error: '赛季数据获取失败', message: error.message }),
      { status: 500, headers }
    );
  }
};
