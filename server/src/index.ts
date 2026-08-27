import express from 'express';
import cors from 'cors';
import mapsRouter from './routes/maps.js';
import { getSeasonInfo } from './services/season.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET'],
}));

app.use(express.json());

app.use('/api/maps', mapsRouter);

app.get('/api/health', (_req, res) => {
  res.json({
    service: 'ApexMap Live API',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

// 赛季信息（本地开发用，返回与 Cloudflare Function 相同格式）
// 优先级：EA 官方帮助页 → apexlegendsstatus → 本地硬编码
app.get('/api/season', async (_req, res) => {
  try {
    const data = await getSeasonInfo();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: '赛季数据获取失败', message: (e as Error).message });
  }
});

app.listen(PORT, () => {
  console.log(`[ApexMap Live] Server running on http://localhost:${PORT}`);
  console.log(`[ApexMap Live] API: http://localhost:${PORT}/api/maps/current`);
});
