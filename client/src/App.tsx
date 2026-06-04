import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { MapCard } from './components/MapCard';
import { BackgroundFX } from './components/BackgroundFX';
import { useMapRotation } from './hooks/useMapRotation';
import { useTheme } from './hooks/useTheme';

// 展示顺序：排位赛 → 匹配赛 → 混音带 → 外卡
const MODE_ORDER = ['ranked', 'pubs', 'mixtape', 'wildcard'];

function App() {
  const { data, isLoading, error, refetch } = useMapRotation();
  const { isDark, toggleTheme } = useTheme();

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
            地图轮换
            <span className="neon-text-cyan ml-2">实时</span>
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            追踪所有模式的当前地图与轮换倒计时
          </p>
        </div>

        {/* 错误状态 */}
        {error && (
          <div className="mx-6 mb-6 p-4 rounded-lg border border-neon-red/30 bg-neon-red/5 text-center">
            <p className="text-neon-red text-sm">
              数据加载失败: {error.message}
            </p>
            <button
              onClick={refetch}
              className="mt-2 px-4 py-1.5 rounded bg-neon-red/10 border border-neon-red/30 text-neon-red text-sm hover:bg-neon-red/20 transition-colors"
            >
              重试
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
              return <MapCard key={modeKey} mode={mode} index={index} />;
            })}
          </div>
        )}

        {/* 无数据状态 */}
        {!isLoading && !error && data && Object.keys(data.modes).length === 0 && (
          <div className="px-6 py-16 text-center">
            <p className="text-lg" style={{ color: 'var(--text-muted)' }}>暂无地图轮换数据</p>
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>数据可能正在更新中，请稍后刷新</p>
          </div>
        )}

        <Footer />
      </div>
    </div>
  );
}

export default App;
