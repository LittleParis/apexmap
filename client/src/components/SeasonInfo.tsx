import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '../hooks/useI18n';
import { useSeasonData } from '../hooks/useSeasonData';

function useSeasonCountdown(endDate: Date) {
  const [remaining, setRemaining] = useState(() => calcRemaining(endDate));

  useEffect(() => {
    const timer = setInterval(() => setRemaining(calcRemaining(endDate)), 60_000);
    return () => clearInterval(timer);
  }, [endDate]);

  return remaining;
}

function calcRemaining(endDate: Date) {
  const diff = endDate.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0 };
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
  };
}

export function SeasonInfo() {
  const { season } = useSeasonData();
  const { days, hours } = useSeasonCountdown(season.endDate);
  const { t } = useI18n();

  const totalDays = Math.ceil((season.endDate.getTime() - season.startDate.getTime()) / 86_400_000);
  const elapsedDays = Math.ceil((Date.now() - season.startDate.getTime()) / 86_400_000);
  const progress = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="mx-6 mb-2"
    >
      <div
        className="rounded-xl px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
        }}
      >
        {/* 赛季名称 */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-neon-cyan/20 to-neon-magenta/20 flex items-center justify-center">
            <span className="font-display font-bold text-sm neon-text-cyan">S{season.number}</span>
          </div>
          <div>
            <div className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              {season.name && <>{season.name}<span className="ml-1.5 text-xs font-normal" style={{ color: 'var(--text-muted)' }}>{season.nameEn}</span></>}
              {!season.name && <>{season.nameEn}</>}
            </div>
            <div className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
              {season.startDate.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })} — {season.endDate.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
            </div>
          </div>
        </div>

        {/* 进度条 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{t('season.progress')}</span>
            <span className="text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-card-hover)' }}>
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #00f0ff, #a855f7)',
              }}
            />
          </div>
        </div>

        {/* 剩余天数 */}
        <div className="shrink-0 text-right">
          <div className="font-mono text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            {days}<span className="text-xs font-normal ml-0.5" style={{ color: 'var(--text-muted)' }}>{t('season.days')}</span>
            {' '}
            {hours}<span className="text-xs font-normal ml-0.5" style={{ color: 'var(--text-muted)' }}>{t('season.hours')}</span>
          </div>
          <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{t('season.remaining')}</div>
        </div>
      </div>
    </motion.div>
  );
}
