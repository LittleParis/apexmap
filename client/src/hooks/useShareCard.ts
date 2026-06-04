import { useState, useCallback } from 'react';
import { useI18n } from './useI18n';
import type { MapRotationResponse } from '../types';

const MODE_ORDER = ['ranked', 'pubs', 'mixtape', 'wildcard'];
const MODE_COLORS: Record<string, string> = {
  ranked: '#00f0ff',
  pubs: '#ff00e5',
  mixtape: '#f0ff00',
  wildcard: '#ff6a00',
};

const MODE_LABELS_ZH: Record<string, string> = {
  ranked: '排位赛',
  pubs: '匹配赛',
  mixtape: '娱乐模式',
  wildcard: '外卡',
};

const MODE_LABELS_EN: Record<string, string> = {
  ranked: 'Ranked',
  pubs: 'Battle Royale',
  mixtape: 'Mixtape',
  wildcard: 'Wildcard',
};

const TIME_OFFSET = 2 * 60 * 60;

function formatTime(ts: number): string {
  const d = new Date(ts * 1000);
  return d.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Shanghai',
  });
}

export function useShareCard() {
  const [generating, setGenerating] = useState(false);
  const { locale } = useI18n();

  const generate = useCallback(async (data: MapRotationResponse) => {
    setGenerating(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 520;
      const ctx = canvas.getContext('2d')!;

      // 背景
      const grad = ctx.createLinearGradient(0, 0, 0, 520);
      grad.addColorStop(0, '#0a0a0f');
      grad.addColorStop(1, '#12121a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 800, 520);

      // 网格线
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 800; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 520); ctx.stroke();
      }
      for (let i = 0; i < 520; i += 40) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(800, i); ctx.stroke();
      }

      // 标题
      ctx.fillStyle = '#00f0ff';
      ctx.font = 'bold 28px "Segoe UI", sans-serif';
      ctx.fillText('APEX', 40, 50);
      ctx.fillStyle = '#e8e8f0';
      ctx.fillText(' MAP LIVE', 120, 50);

      ctx.fillStyle = '#555570';
      ctx.font = '13px sans-serif';
      const subtitle = locale === 'zh' ? '地图轮换追踪' : 'Map Rotation Tracker';
      ctx.fillText(subtitle, 40, 72);

      // 更新时间
      const timeStr = new Date(data.lastUpdated).toLocaleTimeString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' });
      ctx.fillStyle = '#555570';
      ctx.font = '12px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`Updated: ${timeStr}`, 760, 50);
      ctx.textAlign = 'left';

      // 分隔线
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(40, 88); ctx.lineTo(760, 88); ctx.stroke();

      // 模式标签
      const labels = locale === 'zh' ? MODE_LABELS_ZH : MODE_LABELS_EN;
      const cardWidth = 170;
      const cardHeight = 380;
      const startX = 40;
      const startY = 105;
      const gap = 8;

      for (let i = 0; i < MODE_ORDER.length; i++) {
        const modeKey = MODE_ORDER[i];
        const mode = data.modes[modeKey];
        if (!mode) continue;

        const x = startX + i * (cardWidth + gap);
        const color = MODE_COLORS[modeKey];

        // 卡片背景
        ctx.fillStyle = 'rgba(18, 18, 26, 0.9)';
        ctx.beginPath();
        ctx.roundRect(x, startY, cardWidth, cardHeight, 10);
        ctx.fill();

        // 顶部颜色条
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(x, startY, cardWidth, 4, [10, 10, 0, 0]);
        ctx.fill();

        // 模式标签
        ctx.fillStyle = color;
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(labels[modeKey], x + 12, startY + 30);

        // 当前地图名
        ctx.fillStyle = '#e8e8f0';
        ctx.font = 'bold 18px sans-serif';
        const nameZh = mode.current.nameZh;
        ctx.fillText(nameZh.length > 8 ? nameZh.slice(0, 8) + '..' : nameZh, x + 12, startY + 60);

        // 英文名
        if (mode.current.name !== mode.current.nameZh) {
          ctx.fillStyle = '#555570';
          ctx.font = '11px sans-serif';
          const nameEn = mode.current.name;
          ctx.fillText(nameEn.length > 16 ? nameEn.slice(0, 16) + '..' : nameEn, x + 12, startY + 78);
        }

        // 持续时间
        ctx.fillStyle = '#555570';
        ctx.font = '10px sans-serif';
        const durLabel = locale === 'zh' ? '持续时间' : 'Duration';
        ctx.fillText(durLabel.toUpperCase(), x + 12, startY + 108);

        ctx.fillStyle = '#8888a0';
        ctx.font = '13px monospace';
        const adjStart = mode.current.startTime + TIME_OFFSET;
        const adjEnd = mode.current.endTime + TIME_OFFSET;
        ctx.fillText(`${formatTime(adjStart)} — ${formatTime(adjEnd)}`, x + 12, startY + 126);

        // 接下来的地图
        if (mode.next.length > 0) {
          ctx.fillStyle = '#555570';
          ctx.font = '10px sans-serif';
          const nextLabel = locale === 'zh' ? '接下来的地图' : 'Upcoming';
          ctx.fillText(nextLabel.toUpperCase(), x + 12, startY + 160);

          const nextMaps = mode.next.slice(0, 3);
          for (let j = 0; j < nextMaps.length; j++) {
            const map = nextMaps[j];
            const ny = startY + 175 + j * 55;

            // 小方块背景
            ctx.fillStyle = 'rgba(26, 26, 40, 0.8)';
            ctx.beginPath();
            ctx.roundRect(x + 12, ny, cardWidth - 24, 45, 6);
            ctx.fill();

            // 地图名
            ctx.fillStyle = '#e8e8f0';
            ctx.font = 'bold 12px sans-serif';
            const mName = map.nameZh;
            ctx.fillText(mName.length > 10 ? mName.slice(0, 10) + '..' : mName, x + 22, ny + 20);

            // 时间
            ctx.fillStyle = '#555570';
            ctx.font = '11px monospace';
            ctx.fillText(formatTime(map.startTime + TIME_OFFSET), x + 22, ny + 36);

            // NEXT 标记
            if (j === 0) {
              ctx.fillStyle = color;
              ctx.font = 'bold 8px sans-serif';
              ctx.fillText('NEXT', x + cardWidth - 50, ny + 14);
            }
          }
        }
      }

      // 底部水印
      ctx.fillStyle = '#333';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('apexmap.2788116564.workers.dev', 400, 505);
      ctx.textAlign = 'left';

      // 下载
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `apexmap-${new Date().toISOString().slice(0, 10)}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    } finally {
      setGenerating(false);
    }
  }, [locale]);

  return { generating, generate };
}
