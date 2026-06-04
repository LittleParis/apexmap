export type Locale = 'zh' | 'en';

export const LOCALES: Record<Locale, Record<string, string>> = {
  zh: {
    // Header
    'header.sync': '实时同步',
    'header.stale': '数据延迟',
    'header.updated': '更新',
    'header.theme.light': '切换到浅色模式',
    'header.theme.dark': '切换到深色模式',
    'header.refresh': '刷新数据',

    // Title
    'title.main': '地图轮换',
    'title.live': '实时',
    'title.subtitle': '追踪所有模式的当前地图与轮换倒计时',

    // Season
    'season.progress': '赛季进度',
    'season.remaining': '剩余',
    'season.days': '天',
    'season.hours': '时',

    // Map Card
    'card.duration': '持续时间',
    'card.next': '接下来的地图',

    // Modes
    'mode.ranked': '排位赛',
    'mode.pubs': '匹配赛',
    'mode.mixtape': '娱乐模式',
    'mode.wildcard': '外卡',

    // Error
    'error.title': '数据加载失败',
    'error.retry': '重试',

    // Loading
    'loading.empty': '暂无地图轮换数据',
    'loading.hint': '数据可能正在更新中，请稍后刷新',

    // Footer
    'footer.source': '数据来源: apexlegendsstatus.com',
    'footer.version': 'ApexMap Live v1.0',

    // Share
    'share.button': '分享',
    'share.title': '分享当前地图轮换',
    'share.generating': '生成中...',

    // Language
    'lang.switch': 'EN',
  },
  en: {
    // Header
    'header.sync': 'Live',
    'header.stale': 'Stale',
    'header.updated': 'Updated',
    'header.theme.light': 'Switch to Light Mode',
    'header.theme.dark': 'Switch to Dark Mode',
    'header.refresh': 'Refresh Data',

    // Title
    'title.main': 'Map Rotation',
    'title.live': 'LIVE',
    'title.subtitle': 'Track current maps and rotation countdowns for all modes',

    // Season
    'season.progress': 'Season Progress',
    'season.remaining': 'Remaining',
    'season.days': 'd',
    'season.hours': 'h',
    'season.name': 'Overclocked',

    // Map Card
    'card.duration': 'Duration',
    'card.next': 'Upcoming Maps',

    // Modes
    'mode.ranked': 'Ranked',
    'mode.pubs': 'Battle Royale',
    'mode.mixtape': 'Mixtape',
    'mode.wildcard': 'Wildcard',

    // Error
    'error.title': 'Failed to load data',
    'error.retry': 'Retry',

    // Loading
    'loading.empty': 'No map rotation data',
    'loading.hint': 'Data may be updating, please refresh later',

    // Footer
    'footer.source': 'Source: apexlegendsstatus.com',
    'footer.version': 'ApexMap Live v1.0',

    // Share
    'share.button': 'Share',
    'share.title': 'Share Map Rotation',
    'share.generating': 'Generating...',

    // Language
    'lang.switch': '中',
  },
};
