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

app.listen(PORT, () => {
  console.log(`[ApexMap Live] Server running on http://localhost:${PORT}`);
  console.log(`[ApexMap Live] API: http://localhost:${PORT}/api/maps/current`);
});
