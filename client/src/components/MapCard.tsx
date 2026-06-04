import type { SyntheticEvent } from 'react';
import { motion } from 'framer-motion';
import { CountdownTimer } from './CountdownTimer';
import type { MapMode } from '../types';

const MODE_STYLES: Record<string, { border: string; text: string; label: string; badge: string }> = {
  ranked: {
    border: 'neon-border-cyan',
    text: 'neon-text-cyan',
    label: 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30',
    badge: 'neon-cyan',
  },
  pubs: {
    border: 'neon-border-magenta',
    text: 'neon-text-magenta',
    label: 'bg-neon-magenta/10 text-neon-magenta border-neon-magenta/30',
    badge: 'neon-magenta',
  },
  mixtape: {
    border: 'neon-border-yellow',
    text: 'neon-text-yellow',
    label: 'bg-neon-yellow/10 text-neon-yellow border-neon-yellow/30',
    badge: 'neon-yellow',
  },
  wildcard: {
    border: 'neon-border-orange',
    text: 'neon-text-orange',
    label: 'bg-neon-orange/10 text-neon-orange border-neon-orange/30',
    badge: 'neon-orange',
  },
};

// 时间偏移量（秒）：上游数据比实际北京时间慢 2 小时
const TIME_OFFSET = 2 * 60 * 60;

// 将上游图片 URL 转换为本地代理路径（通过 Cloudflare 边缘缓存加速）
function toProxyUrl(url: string): string {
  const filename = url.split('/').pop();
  return filename ? `/api/image/${filename}` : url;
}

interface MapCardProps {
  mode: MapMode;
  index: number;
}

export function MapCard({ mode, index }: MapCardProps) {
  const style = MODE_STYLES[mode.mode] || MODE_STYLES.pubs;
  const { current, next } = mode;

  // 应用时间偏移
  const adjustedStart = current.startTime + TIME_OFFSET;
  const adjustedEnd = current.endTime + TIME_OFFSET;

  const nextMaps = next.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`relative rounded-xl overflow-hidden ${style.border} group transition-colors duration-300`}
      style={{ backgroundColor: 'var(--bg-card)' }}
    >
      {/* 模式标签 */}
      <div className="absolute top-3 left-3 z-20">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-sm ${style.label}`}>
          {mode.modeNameZh}
          <span className="ml-1.5 text-[10px] opacity-70 uppercase tracking-wider">{mode.modeName}</span>
        </span>
      </div>

      {/* 地图图片背景 */}
      <div className="relative h-44 sm:h-52 overflow-hidden">
        <img
          src={toProxyUrl(current.image)}
          alt={current.nameZh}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e: SyntheticEvent<HTMLImageElement>) => {
            (e.target as HTMLImageElement).src = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" fill="#12121a"><rect width="400" height="200"/><text x="200" y="95" text-anchor="middle" fill="#555" font-size="16">${current.nameZh}</text><text x="200" y="120" text-anchor="middle" fill="#444" font-size="12">${current.name}</text></svg>`)}`;
          }}
        />
        <div className="absolute inset-0 map-overlay" />
        <div className="absolute inset-0 scanline pointer-events-none" />
      </div>

      {/* 信息区域 */}
      <div className="relative z-10 px-5 pb-5 -mt-6">
        {/* 当前地图名 */}
        <div className="mb-3">
          <h3 className={`font-display text-2xl sm:text-3xl font-bold ${style.text}`}>
            {current.nameZh !== current.name ? current.nameZh : current.name}
          </h3>
          {current.nameZh !== current.name && (
            <p className="text-sm font-body mt-0.5" style={{ color: 'var(--text-muted)' }}>{current.name}</p>
          )}
        </div>

        {/* 持续时间 + 倒计时 */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs uppercase tracking-wider font-display" style={{ color: 'var(--text-muted)' }}>
              持续时间
            </span>
            <span className="font-mono text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              {formatTime(adjustedStart)} — {formatTime(adjustedEnd)}
            </span>
          </div>
          <CountdownTimer
            endTime={adjustedEnd}
            colorClass={style.text}
          />
        </div>

        {/* 分隔线 */}
        <div className="h-px w-full mb-4" style={{ background: 'linear-gradient(to right, transparent, var(--border-subtle), transparent)' }} />

        {/* 下一张地图 */}
        {nextMaps.length > 0 && (
          <div>
            <div className="text-xs mb-2 uppercase tracking-wider font-display" style={{ color: 'var(--text-muted)' }}>
              接下来的地图
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {nextMaps.map((map, i) => (
                <motion.div
                  key={`${map.name}-${i}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex-shrink-0 relative rounded-lg overflow-hidden w-28 h-16 group/next"
                >
                  <img
                    src={toProxyUrl(map.image)}
                    alt={map.nameZh}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/next:scale-110"
                    onError={(e: SyntheticEvent<HTMLImageElement>) => {
                      (e.target as HTMLImageElement).style.background = 'var(--bg-card-hover)';
                    }}
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ backgroundColor: 'var(--next-map-overlay)' }}>
                    <span className="text-[10px] font-bold leading-tight text-center px-1" style={{ color: 'var(--text-primary)' }}>
                      {map.nameZh !== map.name ? map.nameZh : map.name}
                    </span>
                    <span className="text-[9px] font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {formatTime(map.startTime + TIME_OFFSET)}
                    </span>
                  </div>
                  {i === 0 && (
                    <div className={`absolute top-0.5 left-0.5 text-[8px] px-1 rounded ${style.label}`}>
                      NEXT
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Shanghai',
  });
}
