/**
 * Mock API — 模拟地图轮换边界值数据
 *
 * 三阶段模拟：
 *   Phase 1 (0~60s)    : 返回即将到期的地图数据，倒计时 60 秒
 *   Phase 2 (60s~+20s) : 倒计时已过期，服务端尚未更新（返回陈旧数据）
 *   Phase 3 (+20s 起)  : 服务端确认轮换，返回新地图 + 新 endTime
 *
 * 用法：将 MOCK_ENABLED 设为 true 后启动 dev server 即可
 * 测试完成后改回 false
 */

import type { MapRotationResponse } from '../types';

/** 开关：true = 使用 mock，false = 正常请求 API */
export const MOCK_ENABLED = false;

// ===== 内部状态 =====
let mockStartTime = 0;
let fetchCount = 0;

// 前端 MapCard 会给所有时间戳加上 TIME_OFFSET (2h)
// mock 数据需要预减这个值，使倒计时显示正确
const TIME_OFFSET = 2 * 60 * 60;

function nowSec() {
  return Math.floor(Date.now() / 1000) - TIME_OFFSET;
}

// ===== 地图数据常量 =====
// Phase 1 的 endTime = mock 开始时 + 60 秒
let phase1End = 0;

function getPhase1End() {
  if (!phase1End) {
    phase1End = nowSec() + 60;
  }
  return phase1End;
}

// Phase 3 的 endTime（服务端确认的"真实"轮换结束时间，与客户端预测的不同）
// 客户端预测: next[0].endTime = phase1End + 900
// 服务端实际: phase1End + 960（多 1 分钟，触发 MapCard 同步条件）
function getPhase3End() {
  return getPhase1End() + 960;
}

const MODE_META = {
  ranked:   { mode: 'ranked',   modeName: 'BR Ranked', modeNameZh: '排位赛' },
  pubs:     { mode: 'pubs',     modeName: 'BR Pubs',   modeNameZh: '匹配赛' },
  mixtape:  { mode: 'mixtape',  modeName: 'Mixtape',    modeNameZh: '娱乐模式' },
  wildcard: { mode: 'wildcard', modeName: 'Wildcard',   modeNameZh: '外卡' },
};

function buildPhase1(): MapRotationResponse {
  const end = getPhase1End();
  const start = end - 900;

  return {
    lastUpdated: new Date().toISOString(),
    modes: {
      ranked: {
        ...MODE_META.ranked,
        current: {
          name: 'Storm Point', nameZh: '风暴点',
          image: 'https://apexlegendsstatus.com/assets/maps/Storm_Point.png',
          startTime: start, endTime: end,
        },
        next: [
          { name: 'Olympus', nameZh: '奥林匹斯', image: 'https://apexlegendsstatus.com/assets/maps/Olympus.png', startTime: end, endTime: end + 900 },
          { name: "World's Edge", nameZh: '世界边缘', image: 'https://apexlegendsstatus.com/assets/maps/Worlds_Edge.png', startTime: end + 900, endTime: end + 1800 },
          { name: 'E-District', nameZh: 'E区', image: 'https://apexlegendsstatus.com/assets/maps/E-District.png', startTime: end + 1800, endTime: end + 2700 },
        ],
      },
      pubs: {
        ...MODE_META.pubs,
        current: {
          name: 'Olympus', nameZh: '奥林匹斯',
          image: 'https://apexlegendsstatus.com/assets/maps/Olympus.png',
          startTime: start, endTime: end,
        },
        next: [
          { name: 'Kings Canyon', nameZh: '诸王峡谷', image: 'https://apexlegendsstatus.com/assets/maps/Kings_Canyon.png', startTime: end, endTime: end + 900 },
          { name: 'Broken Moon', nameZh: '残月', image: 'https://apexlegendsstatus.com/assets/maps/Broken_Moon.png', startTime: end + 900, endTime: end + 1800 },
        ],
      },
      mixtape: {
        ...MODE_META.mixtape,
        current: {
          name: 'Skull Town - TDM', nameZh: '骷髅镇-团队死斗',
          image: 'https://apexlegendsstatus.com/assets/maps/Skull_Town.png',
          startTime: start, endTime: end,
        },
        next: [
          { name: 'Estate - Control', nameZh: '不动产-控制', image: 'https://apexlegendsstatus.com/assets/maps/Estate.png', startTime: end, endTime: end + 900 },
          { name: 'Fragment - TDM', nameZh: '碎片-团队死斗', image: 'https://apexlegendsstatus.com/assets/maps/Fragment.png', startTime: end + 900, endTime: end + 1800 },
        ],
      },
      wildcard: {
        ...MODE_META.wildcard,
        current: {
          name: 'Broken Moon', nameZh: '残月',
          image: 'https://apexlegendsstatus.com/assets/maps/Broken_Moon.png',
          startTime: start, endTime: end,
        },
        next: [
          { name: 'Storm Point', nameZh: '风暴点', image: 'https://apexlegendsstatus.com/assets/maps/Storm_Point.png', startTime: end, endTime: end + 900 },
          { name: 'E-District', nameZh: 'E区', image: 'https://apexlegendsstatus.com/assets/maps/E-District.png', startTime: end + 900, endTime: end + 1800 },
        ],
      },
    },
  };
}

/**
 * 构造 Phase 3 数据：服务端确认轮换
 * 关键：endTime 使用 getPhase3End()，与客户端预测的 next[0].endTime（= phase1End + 900）不同
 * 这样 MapCard 的同步条件 (mode.current.endTime !== lastSyncedEndRef.current) 会触发
 */
function buildPhase3(): MapRotationResponse {
  const oldEnd = getPhase1End();
  const newEnd = getPhase3End(); // 与预测值不同！
  const newStart = oldEnd;

  return {
    lastUpdated: new Date().toISOString(),
    modes: {
      ranked: {
        ...MODE_META.ranked,
        current: {
          name: 'Olympus', nameZh: '奥林匹斯',
          image: 'https://apexlegendsstatus.com/assets/maps/Olympus.png',
          startTime: newStart, endTime: newEnd,
        },
        next: [
          { name: "World's Edge", nameZh: '世界边缘', image: 'https://apexlegendsstatus.com/assets/maps/Worlds_Edge.png', startTime: newEnd, endTime: newEnd + 900 },
          { name: 'E-District', nameZh: 'E区', image: 'https://apexlegendsstatus.com/assets/maps/E-District.png', startTime: newEnd + 900, endTime: newEnd + 1800 },
        ],
      },
      pubs: {
        ...MODE_META.pubs,
        current: {
          name: 'Kings Canyon', nameZh: '诸王峡谷',
          image: 'https://apexlegendsstatus.com/assets/maps/Kings_Canyon.png',
          startTime: newStart, endTime: newEnd,
        },
        next: [
          { name: 'Broken Moon', nameZh: '残月', image: 'https://apexlegendsstatus.com/assets/maps/Broken_Moon.png', startTime: newEnd, endTime: newEnd + 900 },
          { name: 'Storm Point', nameZh: '风暴点', image: 'https://apexlegendsstatus.com/assets/maps/Storm_Point.png', startTime: newEnd + 900, endTime: newEnd + 1800 },
        ],
      },
      mixtape: {
        ...MODE_META.mixtape,
        current: {
          name: 'Estate - Control', nameZh: '不动产-控制',
          image: 'https://apexlegendsstatus.com/assets/maps/Estate.png',
          startTime: newStart, endTime: newEnd,
        },
        next: [
          { name: 'Fragment - TDM', nameZh: '碎片-团队死斗', image: 'https://apexlegendsstatus.com/assets/maps/Fragment.png', startTime: newEnd, endTime: newEnd + 900 },
          { name: 'Skull Town - TDM', nameZh: '骷髅镇-团队死斗', image: 'https://apexlegendsstatus.com/assets/maps/Skull_Town.png', startTime: newEnd + 900, endTime: newEnd + 1800 },
        ],
      },
      wildcard: {
        ...MODE_META.wildcard,
        current: {
          name: 'Storm Point', nameZh: '风暴点',
          image: 'https://apexlegendsstatus.com/assets/maps/Storm_Point.png',
          startTime: newStart, endTime: newEnd,
        },
        next: [
          { name: 'E-District', nameZh: 'E区', image: 'https://apexlegendsstatus.com/assets/maps/E-District.png', startTime: newEnd, endTime: newEnd + 900 },
          { name: 'Olympus', nameZh: '奥林匹斯', image: 'https://apexlegendsstatus.com/assets/maps/Olympus.png', startTime: newEnd + 900, endTime: newEnd + 1800 },
        ],
      },
    },
  };
}

/**
 * Mock fetch：根据时间和请求次数返回对应阶段数据
 *
 * - Phase 1：前 60 秒（或未过期时），返回即将到期的数据
 * - Phase 2：过期后前 5 次 burst 请求，返回陈旧数据（模拟服务端延迟）
 * - Phase 3：第 6 次 burst 请求起，返回服务端确认的新轮换数据
 */
export async function mockFetchMaps(): Promise<MapRotationResponse> {
  if (!mockStartTime) {
    mockStartTime = Date.now();
  }
  fetchCount++;

  const elapsedMs = Date.now() - mockStartTime;
  const elapsedSec = elapsedMs / 1000;
  const expired = elapsedSec >= 60;

  let data: MapRotationResponse;
  let phase: string;

  if (!expired) {
    // Phase 1：倒计时进行中
    data = buildPhase1();
    phase = `Phase 1 (倒计时中, ${Math.ceil(60 - elapsedSec)}s 后到期)`;
  } else if (fetchCount <= 6) {
    // Phase 2：已过期，服务端尚未更新（返回陈旧数据）
    // 允许约 6 次 burst 请求（~18s at 3s interval），模拟服务端延迟
    data = buildPhase1();
    phase = `Phase 2 (已过期 ${(elapsedSec - 60).toFixed(0)}s, 服务端陈旧数据, fetch #${fetchCount})`;
  } else {
    // Phase 3：服务端确认轮换
    data = buildPhase3();
    phase = `Phase 3 (服务端确认轮换, fetch #${fetchCount})`;
  }

  console.log(`%c[Mock API] ${phase}`, 'color: #00f0ff; font-weight: bold');
  return data;
}
