import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { MapCard } from './components/MapCard';
import { BackgroundFX } from './components/BackgroundFX';
import { SeasonInfo } from './components/SeasonInfo';
import { useMapRotation } from './hooks/useMapRotation';
import { useTheme } from './hooks/useTheme';
import { useI18n } from './hooks/useI18n';
import { useShareCard } from './hooks/useShareCard';

// 展示顺序：排位赛 → 匹配赛 → 混音带 → 外卡
const MODE_ORDER = ['ranked', 'pubs', 'mixtape', 'wildcard'];

function App() {
  const { data, isLoading, error, refetch, onCountdownExpire } = useMapRotation();
  const { isDark, toggleTheme } = useTheme();
  const { t } = useI18n();
  const { generating, generate } = useShareCard();

  return (
    <div className="theme-transition relative min-h-screen overflow-x-hidden" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <BackgroundFX />

      <div className="relative z-10 max-w-7xl mx-auto">
        <Header
          lastUpdated={data?.lastUpdated}
          isStale={data?.stale}
          onRefresh={refetch}
          isDark={isDark}
          onToggleTheme={toggleTheme}
        />

        {/* 标题区域 */}
        <div className="px-6 py-6 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {t('title.main')}
            <span className="neon-text-cyan ml-2">{t('title.live')}</span>
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {t('title.subtitle')}
          </p>
          {data && (
            <button
              onClick={() => generate(data)}
              disabled={generating}
              className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200"
              style={{
                background: generating ? 'var(--bg-card)' : 'linear-gradient(135deg, rgba(0,240,255,0.12), rgba(160,0,255,0.12))',
                border: '1px solid rgba(0,240,255,0.25)',
                color: generating ? 'var(--text-muted)' : 'var(--text-primary)',
                cursor: generating ? 'not-allowed' : 'pointer',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              {generating ? t('share.generating') : t('share.button')}
            </button>
          )}
        </div>

        {/* 赛季信息 */}
        <SeasonInfo />

        {/* 错误状态 */}
        {error && (
          <div className="mx-6 mb-6 p-4 rounded-lg border border-neon-red/30 bg-neon-red/5 text-center">
            <p className="text-neon-red text-sm">
              {t('error.title')}: {error.message}
            </p>
            <button
              onClick={refetch}
              className="mt-2 px-4 py-1.5 rounded bg-neon-red/10 border border-neon-red/30 text-neon-red text-sm hover:bg-neon-red/20 transition-colors"
            >
              {t('error.retry')}
            </button>
          </div>
        )}

        {/* 加载状态 */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)' }}>
                <div className="h-44 skeleton-pulse" />
                <div className="p-5 space-y-3">
                  <div className="h-8 w-32 skeleton-pulse rounded" />
                  <div className="h-4 w-24 skeleton-pulse rounded" />
                  <div className="h-10 w-48 skeleton-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 地图卡片网格 */}
        {!isLoading && data?.modes && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6">
            {MODE_ORDER.map((modeKey, index) => {
              const mode = data.modes[modeKey];
              if (!mode) return null;
              return <MapCard key={modeKey} mode={mode} index={index} onCountdownExpire={onCountdownExpire} />;
            })}
          </div>
        )}

        {/* 无数据状态 */}
        {!isLoading && !error && data && Object.keys(data.modes).length === 0 && (
          <div className="px-6 py-16 text-center">
            <p className="text-lg" style={{ color: 'var(--text-muted)' }}>{t('loading.empty')}</p>
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>{t('loading.hint')}</p>
          </div>
        )}

        <Footer />
      </div>
    </div>
  );
}

export default App;
