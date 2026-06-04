import { useState } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '../hooks/useI18n';

interface HeaderProps {
  lastUpdated?: string;
  isStale?: boolean;
  onRefresh?: () => Promise<void> | void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export function Header({ lastUpdated, isStale, onRefresh, isDark = true, onToggleTheme }: HeaderProps) {
  const [spinning, setSpinning] = useState(false);
  const { t, toggleLocale } = useI18n();

  const formattedTime = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' })
    : '--:--:--';

  const handleRefresh = async () => {
    if (spinning || !onRefresh) return;
    setSpinning(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setSpinning(false), 600);
    }
  };

  return (
    <header className="relative z-10 px-6 py-5 flex items-center justify-between">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center gap-3"
      >
        <div className="w-8 h-8 rounded bg-gradient-to-br from-neon-cyan to-neon-magenta flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 className="font-display text-xl font-bold tracking-wider">
          <span className="neon-text-cyan">APEX</span>
          <span className="ml-1" style={{ color: 'var(--text-primary)' }}>MAP LIVE</span>
        </h1>
      </motion.div>

      {/* 状态 + 操作按钮 */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center gap-2 sm:gap-3 text-sm"
      >
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isStale ? 'bg-yellow-500' : 'bg-neon-green'} animate-pulse`} />
          <span className="font-mono text-xs hidden sm:inline" style={{ color: 'var(--text-secondary)' }}>
            {isStale ? t('header.stale') : t('header.sync')}
          </span>
        </div>
        <div className="font-mono text-xs hidden sm:block" style={{ color: 'var(--text-muted)' }}>
          {t('header.updated')}: {formattedTime}
        </div>

        {/* 语言切换按钮 */}
        <button
          onClick={toggleLocale}
          className="group relative w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300"
          style={{
            border: '1px solid var(--border-subtle)',
            backgroundColor: isDark ? 'rgba(168,85,247,0.08)' : 'rgba(168,85,247,0.06)',
          }}
          title="Switch Language"
        >
          <span className="text-[10px] font-bold font-mono" style={{ color: isDark ? '#a855f7' : '#7c3aed' }}>
            {t('lang.switch')}
          </span>
        </button>

        {/* 主题切换按钮 */}
        <button
          onClick={onToggleTheme}
          className="group relative w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300"
          style={{
            border: '1px solid var(--border-subtle)',
            backgroundColor: isDark ? 'rgba(0,240,255,0.05)' : 'rgba(0,0,0,0.04)',
          }}
          title={isDark ? t('header.theme.light') : t('header.theme.dark')}
        >
          {isDark ? (
            <svg viewBox="0 0 24 24" className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-4 h-4 transition-transform duration-300 group-hover:-rotate-12" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        {/* 刷新按钮 */}
        <button
          onClick={handleRefresh}
          disabled={spinning}
          className="group relative w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 disabled:opacity-50"
          style={{
            border: `1px solid ${isDark ? 'rgba(0,240,255,0.3)' : 'rgba(8,145,178,0.3)'}`,
            backgroundColor: isDark ? 'rgba(0,240,255,0.05)' : 'rgba(8,145,178,0.06)',
          }}
          title={t('header.refresh')}
        >
          <svg
            viewBox="0 0 24 24"
            className={`w-4 h-4 transition-transform duration-500 ${spinning ? 'animate-spin' : 'group-hover:rotate-45'}`}
            fill="none"
            stroke={isDark ? '#00f0ff' : '#0891b2'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </button>
      </motion.div>
    </header>
  );
}
