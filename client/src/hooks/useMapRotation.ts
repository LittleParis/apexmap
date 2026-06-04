import { useState, useEffect, useCallback } from 'react';
import type { MapRotationResponse } from '../types';

const API_URL = '/api/maps/current';
const POLL_INTERVAL = 60_000;       // 60 秒常规轮询
const FAST_POLL_INTERVAL = 15_000;  // 15 秒加速轮询
const URGENCY_THRESHOLD = 5 * 60;   // 5 分钟内进入加速模式

export function useMapRotation() {
  const [data, setData] = useState<MapRotationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: MapRotationResponse = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 判断是否需要加速轮询
  const needsFastPoll = (() => {
    if (!data?.modes) return false;
    const now = Date.now() / 1000;
    return Object.values(data.modes).some(mode => {
      const remaining = mode.current.endTime - now;
      return remaining > 0 && remaining < URGENCY_THRESHOLD;
    });
  })();

  useEffect(() => {
    const interval = setInterval(
      fetchData,
      needsFastPoll ? FAST_POLL_INTERVAL : POLL_INTERVAL
    );
    return () => clearInterval(interval);
  }, [fetchData, needsFastPoll]);

  return { data, isLoading, error, refetch: fetchData };
}
