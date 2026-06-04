/**
 * 本地赛季配置（fallback 兜底数据）
 *
 * 当远程 API 不可用时，前端会使用这里的最新赛季数据。
 * 每次新赛季时请更新此文件。
 */
export interface SeasonData {
  number: number;
  name: string;
  nameEn: string;
  startDate: string; // ISO 字符串
  endDate: string;   // ISO 字符串
}

const SEASONS: SeasonData[] = [
  {
    number: 29,
    name: '超频',
    nameEn: 'Overclocked',
    startDate: '2026-05-06T00:00:00+08:00',
    endDate: '2026-08-05T00:00:00+08:00', // 预估，远程 API 会覆盖此值
  },
];

/** 获取当前赛季（列表最后一项） */
export function getCurrentSeason(): SeasonData {
  return SEASONS[SEASONS.length - 1];
}

/** 获取所有赛季 */
export function getAllSeasons(): SeasonData[] {
  return SEASONS;
}
