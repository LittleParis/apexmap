import { Router } from 'express';
import { getMapRotation } from '../services/cache.js';

const router = Router();

router.get('/current', async (_req, res) => {
  try {
    const entry = await getMapRotation();

    if (!entry) {
      res.status(503).json({
        error: '数据暂不可用',
        message: '地图轮换数据正在加载中，请稍后重试。',
      });
      return;
    }

    res.json({
      ...entry.data,
      stale: entry.stale,
      cachedAt: entry.cachedAt,
    });
  } catch (error) {
    console.error('[API] Error:', error);
    res.status(500).json({
      error: '服务器错误',
      message: '获取地图轮换数据时发生错误。',
    });
  }
});

// 健康检查
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
