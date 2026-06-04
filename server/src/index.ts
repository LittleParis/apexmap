import express from 'express';
import cors from 'cors';
import mapsRouter from './routes/maps.js';

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
app.get('/api/season', (_req, res) => {
  // S29 超频 / Overclocked
  // countdownTs = 倒计时目标时间戳（赛季开始前是 startDate，赛季进行中是下赛季 startDate）
  res.json({
    number: 29,
    nameEn: 'Overclocked',
    countdownTs: 1778000400, // S29 start: 2026-05-06T00:00:00+08:00
    lastUpdated: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`[ApexMap Live] Server running on http://localhost:${PORT}`);
  console.log(`[ApexMap Live] API: http://localhost:${PORT}/api/maps/current`);
});
