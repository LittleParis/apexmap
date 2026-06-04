# Apex 英雄地图轮换实时追踪器 — 设计文档

## 1. 项目概述

### 1.1 项目名称

**ApexMap Live** — Apex 英雄地图轮换实时追踪 Web 应用

### 1.2 项目目标

构建一个面向 Apex 英雄玩家的 Web 端应用，实时展示游戏中各模式（排位赛、匹配赛/大逃杀公开、混音带、外卡）的地图轮换状态，帮助玩家快速了解当前及接下来将要轮换到的地图信息。

### 1.3 核心价值

- 实时展示所有游戏模式的当前地图和下一张地图
- 精准的地图轮换倒计时
- 赛博朋克风格的视觉体验，契合 Apex 游戏氛围
- 响应式设计，支持桌面端与移动端

---

## 2. 数据源与 API 设计

### 2.1 数据来源

地图轮换数据主要来自以下渠道（按优先级排序）：

**主数据源：apexlegendsstatus.com**

该站点持续抓取游戏服务器数据，提供接近实时的地图轮换信息。其页面结构包含以下模式：

| 模式 | 英文标识 | 说明 |
|------|----------|------|
| 大逃杀公开（匹配） | BR Pubs / Battle Royale | 普通公开匹配 |
| 排位赛 | Ranked | 排位竞技模式 |
| 混音带 | Mixtape | 包含控制、团队死斗等子模式的轮换 |
| 外卡 | Wildcard | 特殊娱乐模式 |

**备用数据源：自建爬虫 + 游戏文件解析**

当第三方 API 不可用时，可通过解析游戏更新文件或抓取官方公告获取赛季地图轮换计划表，作为 fallback。

### 2.2 后端 API 代理层

由于 apexlegendsstatus.com 不提供公开的 REST API，需要构建一个轻量后端作为数据代理：

```
GET /api/maps/current
```

响应结构：

```typescript
interface MapRotationResponse {
  lastUpdated: string;        // ISO 8601 时间戳
  modes: {
    [key: string]: MapMode;
  };
}

interface MapMode {
  mode: string;               // 模式标识: "ranked" | "pubs" | "mixtape" | "wildcard"
  modeName: string;           // 显示名称: "排位赛" | "匹配赛" | "混音带" | "外卡"
  current: MapInfo;
  next: MapInfo | null;       // 下一张地图（如已知）
}

interface MapInfo {
  name: string;               // 地图名称: "Storm Point" | "Olympus" 等
  nameZh: string;             // 中文名称: "风暴点" | "奥林匹斯" 等
  image: string;              // 地图缩略图 URL
  startTime: string;          // 轮换开始时间 (ISO 8601)
  endTime: string | null;     // 轮换结束时间 (ISO 8601, 已知时)
  duration: number | null;    // 持续时长（秒）
  remainingSeconds: number | null; // 剩余秒数（实时计算）
}
```

### 2.3 数据刷新策略

| 策略 | 间隔 | 说明 |
|------|------|------|
| 常规轮询 | 60 秒 | 前端定时向后端请求最新数据 |
| 加速轮询 | 15 秒 | 距离轮换时间 < 5 分钟时启用 |
| 后端缓存 | 30 秒 | 后端对上游数据做缓存，避免频繁抓取 |
| WebSocket（可选） | 实时 | 后端检测到数据变化时主动推送，V2 考虑 |

---

## 3. 技术架构

### 3.1 整体架构图

```
┌─────────────────────────────────────────────────────────┐
│                      客户端 (React)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │ 地图卡片  │  │ 倒计时器  │  │ 模式切换  │  │ 主题层  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘  │
│       └──────────────┴──────────────┴────────────┘      │
│                        │                                  │
│              ┌─────────┴──────────┐                      │
│              │  useMapRotation()  │  ← 自定义 Hook       │
│              └─────────┬──────────┘                      │
└────────────────────────┼────────────────────────────────┘
                         │  HTTP / WebSocket
              ┌──────────┴──────────┐
              │   后端 API (Node)    │  ← Express / Fastify
              │  ┌──────────────┐   │
              │  │ 数据抓取层    │   │  ← 定时抓取上游
              │  │ + 缓存层     │   │  ← node-cache / Redis
              │  └──────────────┘   │
              └──────────┬──────────┘
                         │
              ┌──────────┴──────────┐
              │ 上游数据源           │
              │ apexlegendsstatus   │
              │ / 官方数据           │
              └─────────────────────┘
```

### 3.2 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18+ | UI 框架 |
| TypeScript | 5+ | 类型安全 |
| Vite | 5+ | 构建工具 |
| Tailwind CSS | 3+ | 样式系统 |
| Framer Motion | 11+ | 动画效果（霓虹闪烁、卡片切换） |
| Zustand | 4+ | 轻量状态管理 |
| React Query | 5+ | 数据获取与缓存 |

### 3.3 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 20 LTS | 运行时 |
| Express / Fastify | 最新 | Web 框架 |
| node-cache | 5+ | 内存缓存 |
| cheerio | 最新 | HTML 解析（抓取上游页面） |
| node-cron | 最新 | 定时任务 |

---

## 4. 页面与组件设计

### 4.1 页面结构

应用为单页应用（SPA），核心页面为 **地图总览页**，无需路由跳转。

```
┌─────────────────────────────────────────────────────────┐
│                    Header 导航栏                         │
│  [ApexMap Live Logo]          [最后更新时间] [服务器状态]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │   排位赛 RANKED  │  │  匹配赛 PUBS    │              │
│  │                 │  │                 │              │
│  │  ┌───────────┐  │  │  ┌───────────┐  │              │
│  │  │  地图图片   │  │  │  │  地图图片   │  │              │
│  │  │ Storm Pt  │  │  │  │ Storm Pt  │  │              │
│  │  └───────────┘  │  │  └───────────┘  │              │
│  │  当前: 风暴点    │  │  当前: 风暴点    │              │
│  │  剩余: 01:23:45 │  │  剩余: 01:23:45 │              │
│  │  下一张: 奥林匹斯│  │  下一张: 奥林匹斯│              │
│  └─────────────────┘  └─────────────────┘              │
│                                                         │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │  混音带 MIXTAPE  │  │   外卡 WILDCARD  │              │
│  │                 │  │                 │              │
│  │  ┌───────────┐  │  │  ┌───────────┐  │              │
│  │  │  地图图片   │  │  │  │  地图图片   │  │              │
│  │  └───────────┘  │  │  └───────────┘  │              │
│  │  当前: 腐蚀处理厂│  │  当前: 奥林匹斯  │              │
│  │  剩余: 00:23:45 │  │  剩余: 00:23:45 │              │
│  │  模式: 控制      │  │  下一张: --     │              │
│  └─────────────────┘  └─────────────────┘              │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                    Footer 页脚                           │
│  数据来源声明 | GitHub 链接 | 版本信息                      │
└─────────────────────────────────────────────────────────┘
```

### 4.2 核心组件

#### 4.2.1 MapCard — 地图卡片组件

每个游戏模式对应一张地图卡片，是页面的核心展示单元。

```typescript
interface MapCardProps {
  mode: MapMode;
  variant: 'primary' | 'secondary';  // 排位/匹配为主卡片，混音带/外卡为次卡片
}
```

**视觉要素：**
- 地图高清缩略图作为背景，带暗色渐变遮罩
- 当前地图名称（中英文），大号字体突出显示
- 模式标签（霓虹发光效果）
- 轮换倒计时（数字翻牌动画效果）
- 下一张地图预览（小号展示在卡片底部）
- 卡片边框带霓虹发光效果，颜色随模式变化

#### 4.2.2 CountdownTimer — 倒计时组件

```typescript
interface CountdownTimerProps {
  remainingSeconds: number;
  onExpire: () => void;       // 倒计时结束时触发数据刷新
  urgency?: boolean;          // 剩余 < 5分钟时自动激活紧急样式
}
```

**视觉要素：**
- HH:MM:SS 格式，等宽字体
- 常规状态：柔和的霓虹蓝绿色
- 紧急状态（< 5分钟）：红色脉冲发光，数字闪烁
- 倒计时归零时触发卡片切换动画

#### 4.2.3 NeonBadge — 霓虹标签组件

用于标识模式类型，带赛博朋克风格的发光效果。

#### 4.2.4 StatusIndicator — 状态指示器

显示数据更新时间、服务器连接状态等信息。

### 4.3 自定义 Hook

#### useMapRotation()

核心数据 Hook，封装数据获取、自动刷新和倒计时逻辑：

```typescript
function useMapRotation(): {
  data: MapRotationResponse | null;
  isLoading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
  refetch: () => void;
}
```

#### useCountdown()

倒计时 Hook，支持服务端时间校准：

```typescript
function useCountdown(targetTime: string): {
  hours: number;
  minutes: number;
  seconds: number;
  isUrgent: boolean;
  isExpired: boolean;
}
```

---

## 5. 视觉设计规范

### 5.1 色彩系统

```css
/* 主色调 - 赛博朋克霓虹 */
--neon-cyan:    #00f0ff;    /* 主强调色，用于排位赛模式 */
--neon-magenta: #ff00e5;    /* 次强调色，用于匹配赛模式 */
--neon-yellow:  #f0ff00;    /* 混音带模式 */
--neon-orange:  #ff6a00;    /* 外卡模式 */
--neon-red:     #ff003c;    /* 紧急状态 / 倒计时告警 */
--neon-green:   #00ff88;    /* 在线 / 正常状态 */

/* 背景色 - 深色系 */
--bg-primary:   #0a0a0f;    /* 页面主背景 */
--bg-card:      #12121a;    /* 卡片背景 */
--bg-card-hover:#1a1a28;    /* 卡片悬停 */
--bg-overlay:   rgba(10, 10, 15, 0.85); /* 图片遮罩 */

/* 文字色 */
--text-primary:   #e8e8f0;
--text-secondary: #8888a0;
--text-muted:     #555570;
```

### 5.2 字体

| 用途 | 字体 | 说明 |
|------|------|------|
| 标题/地图名 | Rajdhani / Orbitron | 科技感 Google Font |
| 倒计时数字 | JetBrains Mono | 等宽字体，清晰辨识 |
| 正文 | Inter / Noto Sans SC | 兼顾中英文 |

### 5.3 动画效果

| 动画 | 实现 | 说明 |
|------|------|------|
| 霓虹脉冲 | CSS `box-shadow` + `animation` | 卡片边框周期性发光 |
| 倒计时翻牌 | Framer Motion `AnimatePresence` | 数字变化时的翻页效果 |
| 地图切换 | Framer Motion `layoutId` | 地图轮换时的过渡动画 |
| 紧急闪烁 | CSS `@keyframes` | 倒计时 < 5分钟时红色脉冲 |
| 背景粒子 | Canvas / CSS | 微弱的浮动光点，增强氛围 |
| 悬停高亮 | Tailwind `group-hover` | 卡片悬停时图片放大 + 亮度提升 |

### 5.4 霓虹发光效果示例

```css
.neon-border {
  border: 1px solid var(--neon-cyan);
  box-shadow:
    0 0 5px var(--neon-cyan),
    0 0 20px rgba(0, 240, 255, 0.3),
    inset 0 0 20px rgba(0, 240, 255, 0.05);
}

.neon-text {
  color: var(--neon-cyan);
  text-shadow:
    0 0 7px var(--neon-cyan),
    0 0 20px rgba(0, 240, 255, 0.5);
}
```

---

## 6. 地图数据字典

### 6.1 大逃杀地图

| 英文名 | 中文名 | 标识 | 缩略图路径 |
|--------|--------|------|------------|
| Kings Canyon | 诸王峡谷 | kings_canyon | /assets/maps/kings_canyon.webp |
| World's Edge | 世界边缘 | worlds_edge | /assets/maps/worlds_edge.webp |
| Olympus | 奥林匹斯 | olympus | /assets/maps/olympus.webp |
| Storm Point | 风暴点 | storm_point | /assets/maps/storm_point.webp |
| Broken Moon | 破碎月亮 | broken_moon | /assets/maps/broken_moon.webp |
| E-District | E区 | e_district | /assets/maps/e_district.webp |

### 6.2 混音带地图

| 英文名 | 中文名 | 模式类型 |
|--------|--------|----------|
| Caustic Treatment | 腐蚀处理厂 | 控制 |
| Phase Runner | 相位跑道 | 团队死斗 |
| Drop-Off | 投放点 | 控制 |
| Habitat | 栖息地 | 团队死斗 |
| Siphon | 虹吸 | 控制 |
| Thunder Watch | 雷霆穹顶 | 团队死斗 |
| Skull Town | 骷髅镇 | 团队死斗 |
| Estate | 庄园 | 控制 |
| Fragment | 碎片 | 团队死斗 |
| Lava Siphon | 熔岩虹吸 | 控制 |
| Party Crasher | 派对破坏者 | 团队死斗 |

---

## 7. 后端数据抓取方案

### 7.1 抓取目标

后端通过解析 apexlegendsstatus.com/current-map 页面获取地图轮换数据。

### 7.2 抓取流程

```
┌─────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────┐
│ 定时触发  │ ──→ │ 请求上游页面  │ ──→ │ HTML 解析    │ ──→ │ 写入缓存  │
│ (cron)   │     │ (HTTP GET)   │     │ (cheerio)    │     │ (memory)  │
└─────────┘     └──────────────┘     └─────────────┘     └──────────┘
                                                          │
                                                          ↓
                                                    ┌──────────┐
                                                    │ 返回给前端 │
                                                    └──────────┘
```

### 7.3 抓取伪代码

```typescript
import * as cheerio from 'cheerio';

async function fetchMapRotation(): Promise<MapRotationResponse> {
  const html = await fetch('https://apexlegendsstatus.com/current-map').then(r => r.text());
  const $ = cheerio.load(html);

  const modes: Record<string, MapMode> = {};

  // 解析各模式的地图卡片区域
  // 具体选择器需要根据实际页面结构调整
  const modeSelectors = {
    ranked:  '[data-mode="ranked"]',
    pubs:    '[data-mode="br_pubs"]',
    mixtape: '[data-mode="mixtape"]',
    wildcard:'[data-mode="wildcard"]',
  };

  for (const [mode, selector] of Object.entries(modeSelectors)) {
    const card = $(selector);
    modes[mode] = {
      mode,
      modeName: MODE_NAMES[mode],
      current: parseMapInfo(card.find('.current-map')),
      next: parseMapInfo(card.find('.next-map')),
    };
  }

  return { lastUpdated: new Date().toISOString(), modes };
}
```

### 7.4 容错与降级

| 场景 | 处理 |
|------|------|
| 上游请求失败 | 返回缓存中的旧数据 + stale 标记 |
| 解析失败 | 记录日志 + 返回旧数据 |
| 缓存过期 (> 5min) | 前端显示"数据可能延迟"提示 |
| 上游结构变更 | 告警通知 + 手动更新选择器 |

---

## 8. 项目目录结构

```
apex-map-live/
├── client/                     # 前端 React 项目
│   ├── public/
│   │   └── assets/
│   │       └── maps/           # 地图缩略图 (.webp)
│   ├── src/
│   │   ├── components/
│   │   │   ├── MapCard.tsx         # 地图卡片
│   │   │   ├── CountdownTimer.tsx  # 倒计时
│   │   │   ├── NeonBadge.tsx       # 霓虹标签
│   │   │   ├── StatusIndicator.tsx # 状态指示器
│   │   │   ├── Header.tsx          # 页头
│   │   │   ├── Footer.tsx          # 页脚
│   │   │   └── BackgroundFX.tsx    # 背景粒子特效
│   │   ├── hooks/
│   │   │   ├── useMapRotation.ts   # 地图数据 Hook
│   │   │   └── useCountdown.ts     # 倒计时 Hook
│   │   ├── stores/
│   │   │   └── mapStore.ts         # Zustand 状态
│   │   ├── services/
│   │   │   └── api.ts              # API 请求封装
│   │   ├── constants/
│   │   │   ├── maps.ts             # 地图数据字典
│   │   │   └── theme.ts            # 主题常量
│   │   ├── styles/
│   │   │   └── neon.css            # 霓虹特效 CSS
│   │   ├── types/
│   │   │   └── index.ts            # TypeScript 类型定义
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css               # Tailwind 入口
│   ├── index.html
│   ├── tailwind.config.ts
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── server/                     # 后端 Node 项目
│   ├── src/
│   │   ├── routes/
│   │   │   └── maps.ts             # /api/maps 路由
│   │   ├── services/
│   │   │   ├── scraper.ts          # 数据抓取服务
│   │   │   └── cache.ts            # 缓存服务
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── config.ts
│   │   └── index.ts                # 入口
│   ├── tsconfig.json
│   └── package.json
│
├── DESIGN.md                   # 本文档
├── README.md
└── .gitignore
```

---

## 9. 开发里程碑

### Phase 1 — 基础功能（MVP）

**预计工期：1 周**

- 搭建前后端项目骨架
- 实现后端数据抓取与缓存
- 完成 API 接口开发
- 实现 MapCard 与 CountdownTimer 核心组件
- 完成基础赛博朋克主题样式
- 部署到开发环境

### Phase 2 — 视觉打磨

**预计工期：3-5 天**

- 完善霓虹发光、粒子背景等视觉特效
- 添加地图切换动画
- 优化移动端响应式布局
- 紧急状态倒计时样式
- 地图缩略图资源收集与处理

### Phase 3 — 体验优化

**预计工期：3 天**

- 添加 PWA 支持（离线可查看最后一次缓存数据）
- 性能优化（图片懒加载、组件懒加载）
- 添加数据更新提示（toast 通知）
- 国际化支持（中/英文切换）

### Phase 4 — 增强功能（可选）

- WebSocket 实时推送替代轮询
- 历史轮换记录查看
- 地图 POI / 缩圈信息展示
- 桌面通知（轮换前 5 分钟提醒）
- 深色/浅色主题切换

---

## 10. 部署方案

### 10.1 推荐部署架构

```
                    ┌──────────┐
   用户 ──CDN──→    │  Nginx   │
                    └────┬─────┘
                   ┌─────┴─────┐
                   │           │
              ┌────┴───┐  ┌───┴────┐
              │ 静态资源 │  │ API    │
              │ (React) │  │ Proxy  │
              └─────────┘  └───┬────┘
                               │
                          ┌────┴────┐
                          │ Node    │
                          │ Server  │
                          └─────────┘
```

### 10.2 部署平台建议

| 方案 | 前端 | 后端 | 优势 |
|------|------|------|------|
| Vercel + Vercel Functions | Vercel | Serverless | 零运维，自动 HTTPS |
| Cloudflare Pages + Workers | CF Pages | Workers | 全球边缘加速，免费额度充足 |
| Docker + VPS | Nginx | Node | 完全可控 |

推荐使用 **Cloudflare Pages + Workers** 方案，兼顾性能和免费额度。

---

## 11. 关键交互流程

### 11.1 数据刷新时序

```
前端                        后端                    上游
 │                           │                       │
 │── GET /api/maps/current ──→│                       │
 │                           │── [缓存有效?] ──→ 返回 │
 │                           │                       │
 │                           │── [缓存过期] ─────────→│
 │                           │                       │── 抓取页面
 │                           │←────── 原始数据 ──────│
 │                           │── 解析 & 更新缓存 ──→  │
 │←──── JSON 响应 ────────────│                       │
 │                           │                       │
 │── 启动倒计时 ──→           │                       │
 │  (每秒更新UI)              │                       │
 │                           │                       │
 │── [倒计时归零] ──→         │                       │
 │  重新请求数据 ────────────→│                       │
```

### 11.2 地图轮换过渡动画

1. 倒计时进入最后 10 秒 → 卡片边框红色脉冲加速
2. 倒计时归零 → 当前地图卡片淡出 + 缩小
3. 新地图卡片从下方滑入 + 放大至正常尺寸
4. 霓虹边框颜色恢复为模式对应颜色
5. 新的倒计时开始

---

## 12. 性能指标目标

| 指标 | 目标值 |
|------|--------|
| 首次内容绘制 (FCP) | < 1.5s |
| 最大内容绘制 (LCP) | < 2.5s |
| 累计布局偏移 (CLS) | < 0.1 |
| 首屏可交互 (TTI) | < 3s |
| 地图图片总大小 | < 500KB (全部使用 WebP) |
| JS Bundle 大小 | < 200KB (gzip) |

---

## 13. 附录

### A. 竞品参考

| 网站 | 优点 | 可借鉴 |
|------|------|--------|
| apexlegendsstatus.com | 数据全面、更新快 | 数据源 |
| apex.dongxuan.net | 中文界面、简洁 | 中文地图名映射 |
| apex.tracker.gg | UI 精美 | 视觉设计参考 |

### B. 相关资源

- Apex Legends 官方: https://www.ea.com/games/apex-legends
- 地图高清素材: Apex Legends Press Kit / 游戏内截图
- Google Fonts (Orbitron, Rajdhani, JetBrains Mono)
- Framer Motion 文档: https://www.framer.com/motion/
