/**
 * 赛季信息服务（本地开发）
 *
 * 数据源优先级：
 * 1. EA 官方帮助页（权威：赛季名 + 开始日期 + 赛季号）
 * 2. apexlegendsstatus.com（第三方兜底）
 * 3. 本地硬编码兜底（官方/第三方均不可用时）
 *
 * 注意：官方不公布当前赛季结束日期，结束日期由前端基于开始日期 + ~91 天预估。
 */

import * as cheerio from 'cheerio';

const EA_PAGE_URL = 'https://help.ea.com/en/articles/apex-legends/seasons-and-updates/';
const STATUS_URL = 'https://apexlegendsstatus.com/new-season-countdown';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const MONTHS: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
};

export interface SeasonApiResponse {
  number: number;
  nameEn: string;
  countdownTs: number;
  lastUpdated: string;
}

async function fetchHtml(url: string, acceptLang: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': UA,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': acceptLang,
    },
  });
  if (!response.ok) throw new Error(`Fetch failed (${response.status}): ${url}`);
  return response.text();
}

/** 主数据源：EA 官方帮助页 */
async function fetchFromOfficial(): Promise<SeasonApiResponse> {
  const html = await fetchHtml(EA_PAGE_URL, 'en-US,en;q=0.9');
  const $ = cheerio.load(html);

  let nameEn = '';
  $('h2').each((_, el) => {
    const t = $(el).text().trim().replace(/\s+/g, ' ');
    // 页面使用 Unicode 弯引号 ’ (U+2019)，需兼容
    const m = t.match(/What[’']?s new in Apex Legends:\s*(.+?)\s*\??$/i);
    if (m) {
      nameEn = m[1].trim();
      return false;
    }
  });

  let startTs = 0;
  $('span,p').each((_, el) => {
    const t = $(el).text().trim().replace(/\s+/g, ' ');
    const m = t.match(
      /the newest Season of Apex Legends[^.]*?launches on\s+([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})/i
    );
    if (m) {
      const month = MONTHS[m[1].toLowerCase()];
      const day = parseInt(m[2], 10);
      const year = parseInt(m[3], 10);
      if (month !== undefined && day >= 1 && day <= 31 && year >= 2019) {
        // Apex 赛季惯例在 17:00 UTC 上线（北京时间次日 01:00）
        startTs = Math.floor(Date.UTC(year, month, day, 17) / 1000);
      }
      return false;
    }
  });

  let maxSeason = 0;
  $('h3').each((_, el) => {
    const t = $(el).text().trim();
    const m = t.match(/\(Season\s*(\d+)\)/i);
    if (m) maxSeason = Math.max(maxSeason, parseInt(m[1], 10));
  });
  const number = maxSeason + 1;

  if (!nameEn || !startTs) {
    throw new Error('Failed to parse season data from EA official page');
  }

  return { number, nameEn, countdownTs: startTs, lastUpdated: new Date().toISOString() };
}

/** 降级数据源：apexlegendsstatus.com */
async function fetchFromStatus(): Promise<SeasonApiResponse> {
  const html = await fetchHtml(STATUS_URL, 'en-US,en;q=0.9');
  const $ = cheerio.load(html);

  const titleText = $('title').first().text().trim();
  const numMatch = titleText.match(/Season\s+(\d+)/i);
  const seasonNumber = numMatch ? parseInt(numMatch[1], 10) : 0;

  let nameEn = '';
  const ogTitle = $('meta[property="og:title"]').attr('content') || '';
  if (ogTitle) {
    const m = ogTitle.match(/:\s*(.+)/);
    nameEn = m ? m[1].trim() : '';
  }
  if (!nameEn) {
    $('h1').each((_, el) => {
      const t = $(el).text().trim();
      if (/Season\s*\d+/i.test(t)) {
        const m = t.match(/:\s*(.+)/);
        nameEn = m ? m[1].trim() : '';
        return false;
      }
    });
  }
  nameEn = nameEn.replace(/,\s*split\s*\d+$/i, '').trim();

  const scriptContent = $('script').map((_, el) => $(el).html() || '').get().join('\n');
  const tsMatch = scriptContent.match(/let\s+startTime\s*=\s*(\d+)/);
  const countdownTs = tsMatch ? parseInt(tsMatch[1], 10) : 0;

  if (!seasonNumber || !countdownTs) {
    throw new Error('Failed to parse season data from status site');
  }

  return { number: seasonNumber, nameEn, countdownTs, lastUpdated: new Date().toISOString() };
}

/** 最终兜底：本地硬编码（官方/第三方都失败时） */
function fetchFromLocal(): SeasonApiResponse {
  return {
    number: 30,
    nameEn: 'Marked',
    countdownTs: 1785862800, // S30 start: 2026-08-04T17:00:00Z
    lastUpdated: new Date().toISOString(),
  };
}

/** 获取赛季信息：官方 → 第三方 → 本地硬编码 */
export async function getSeasonInfo(): Promise<SeasonApiResponse> {
  try {
    return await fetchFromOfficial();
  } catch (e) {
    console.warn('[Season] Official source failed, falling back:', (e as Error).message);
  }
  try {
    return await fetchFromStatus();
  } catch (e) {
    console.warn('[Season] Status site failed, using local fallback:', (e as Error).message);
  }
  return fetchFromLocal();
}
