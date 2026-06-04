import { useEffect, useState } from 'react';
import { getCurrentSeason, type SeasonData } from '../config/seasons';

interface SeasonInfo {
  number: number;
  name: string;
  nameEn: string;
  startDate: Date;
  endDate: Date;
  source: 'remote' | 'local';
}

// 中文名映射（远程 API 只返回英文名）
const SEASON_NAME_ZH: Record<number, string> = {
  29: '超频',
  // 新赛季时在此添加，例如 30: 'XXX'
};

/**
 * 赛季数据 hook：远程优先 + 本地兜底
 *
 * 逻辑说明：
 * - 页面加载时先用本地配置瞬间渲染
 * - 同时请求 /api/season，远程返回 { number, nameEn, countdownTs }
 * - countdownTs 是 apexlegendsstatus.com 倒计时页面的目标时间戳：
 *   · 赛季开始前 → 代表当前赛季的开始时间
 *   · 赛季进行中 → 代表下一个赛季的开始时间（= 当前赛季的结束时间）
 * - 当远程赛季编号 == 本地编号时，保持本地日期不变（本地 endDate 更可靠）
 * - 当远程赛季编号 > 本地编号时，说明新赛季已开始，countdownTs 是新赛季的 startDate
 */
export function useSeasonData(): { season: SeasonInfo; loading: boolean } {
  const [loading, setLoading] = useState(true);

  // 先用本地配置初始化
  const local = getCurrentSeason();
  const [season, setSeason] = useState<SeasonInfo>(() => ({
    number: local.number,
    name: local.name,
    nameEn: local.nameEn,
    startDate: new Date(local.startDate),
    endDate: new Date(local.endDate),
    source: 'local',
  }));

  useEffect(() => {
    let cancelled = false;

    async function fetchRemote() {
      try {
        const res = await fetch('/api/season');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (cancelled) return;

        const remoteNum = data.number as number;
        const remoteNameEn = data.nameEn as string;
        const countdownTs = data.countdownTs as number;

        if (!remoteNum || !countdownTs) return;

        setSeason((prev) => {
          // 远程赛季编号 < 本地 → 数据过旧，不更新
          if (remoteNum < prev.number) return prev;

          // 远程赛季编号 == 本地 → 赛季相同，保持本地日期
          // 远程只能更新赛季名称
          if (remoteNum === prev.number) {
            return {
              ...prev,
              nameEn: remoteNameEn || prev.nameEn,
              source: 'remote',
            };
          }

          // 远程赛季编号 > 本地 → 新赛季已开始
          // countdownTs 是新赛季的 startDate（= 旧赛季的 endDate）
          const newSeasonEnd = prev.endDate; // 旧赛季预估的 endDate 作为新赛季的初始 endDate
          const newSeasonStart = new Date(countdownTs * 1000);

          return {
            number: remoteNum,
            name: SEASON_NAME_ZH[remoteNum] || '',
            nameEn: remoteNameEn || '',
            startDate: newSeasonStart,
            endDate: newSeasonEnd,
            source: 'remote',
          };
        });
      } catch (e) {
        // 远程失败，保持本地数据
        console.warn('[Season] Remote fetch failed, using local fallback:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchRemote();
    return () => { cancelled = true; };
  }, []);

  return { season, loading };
}
