import { useState, useEffect, useCallback, useRef } from 'react';
import type { MapRotationResponse } from '../types';
import { MOCK_ENABLED, mockFetchMaps } from '../services/mockApi';

const API_URL = '/api/maps/current';
const POLL_INTERVAL = 60_000;          // 60 秒常规轮询
const FAST_POLL_INTERVAL = 15_000;     // 15 秒加速轮询（< 5 分钟）
const BURST_POLL_INTERVAL = 3_000;     // 3 秒爆发轮询（临近轮换）
const URGENCY_THRESHOLD = 5 * 60;      // 5 分钟内进入加速模式
const BURST_THRESHOLD = 10;            // 10 秒内进入爆发模式
const BURST_TIMEOUT = 45_000;          // 爆发模式最多持续 45 秒

export function useMapRotation() {
  const [data, setData] = useState<MapRotationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [forceBurst, setForceBurst] = useState(false);
  // 爆发超时冷却标记：超时后阻止自动爆发，直到倒计时恢复到正常范围
  const [burstCooldown, setBurstCooldown] = useState(false);

  // 用 ref 始终拿到最新 data，避免 useCallback 闭包陈旧值
  const dataRef = useRef(data);
  dataRef.current = data;

  const fetchData = useCallback(async () => {
    try {
      // Mock 模式：拦截真实请求，返回模拟数据
      if (MOCK_ENABLED) {
        const json = await mockFetchMaps();
        if (forceBurst && dataRef.current) {
          const oldModes = dataRef.current.modes;
          const newModes = json.modes;
          const hasChanged = Object.keys(newModes).some(key => {
            const oldMap = oldModes[key]?.current;
            const newMap = newModes[key]?.current;
            return oldMap && newMap && (oldMap.name !== newMap.name || oldMap.endTime !== newMap.endTime);
          });
          if (hasChanged) setForceBurst(false);
        }
        setData(json);
        setError(null);
        setIsLoading(false);
        return;
      }

      const res = await fetch(API_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: MapRotationResponse = await res.json();

      // 爆发模式下检测到服务器数据真正更新后退出爆发
      if (forceBurst && dataRef.current) {
        const oldModes = dataRef.current.modes;
        const newModes = json.modes;
        const hasChanged = Object.keys(newModes).some(key => {
          const oldMap = oldModes[key]?.current;
          const newMap = newModes[key]?.current;
          return oldMap && newMap && (oldMap.name !== newMap.name || oldMap.endTime !== newMap.endTime);
        });
        if (hasChanged) {
          setForceBurst(false);
        }
      }

      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [forceBurst]);

  // 首次加载
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 判断是否需要爆发轮询：倒计时 < 10 秒或已过期
  // 冷却期间仅响应手动触发（forceBurst），不自动进入爆发模式
  const needsBurst = (() => {
    if (forceBurst) return true;
    if (burstCooldown) return false;
    if (!data?.modes) return false;
    const now = Date.now() / 1000;
    return Object.values(data.modes).some(mode => {
      const remaining = mode.current.endTime - now;
      return remaining < BURST_THRESHOLD; // < 10 秒（含已过期负值）
    });
  })();

  const pollInterval = needsBurst
    ? BURST_POLL_INTERVAL
    : (() => {
        if (!data?.modes) return POLL_INTERVAL;
        const now = Date.now() / 1000;
        return Object.values(data.modes).some(mode => {
          const remaining = mode.current.endTime - now;
          return remaining > 0 && remaining < URGENCY_THRESHOLD;
        }) ? FAST_POLL_INTERVAL : POLL_INTERVAL;
      })();

  // 轮询 + 爆发超时自动退出（进入冷却期，防止无限轮询）
  useEffect(() => {
    const interval = setInterval(fetchData, pollInterval);

    let timeout: ReturnType<typeof setTimeout> | undefined;
    if (needsBurst) {
      timeout = setTimeout(() => {
        setForceBurst(false);
        setBurstCooldown(true);
      }, BURST_TIMEOUT);
    }

    return () => {
      clearInterval(interval);
      if (timeout) clearTimeout(timeout);
    };
  }, [fetchData, pollInterval, needsBurst]);

  // 倒计时恢复到安全范围后自动退出冷却
  useEffect(() => {
    if (!burstCooldown || !data?.modes) return;
    const now = Date.now() / 1000;
    const allSafe = Object.values(data.modes).every(mode => {
      const remaining = mode.current.endTime - now;
      return remaining > URGENCY_THRESHOLD; // 所有模式都 > 5 分钟
    });
    if (allSafe) setBurstCooldown(false);
  }, [burstCooldown, data]);

  // 供 MapCard 在倒计时归零时调用，触发爆发式轮询
  const triggerBurst = useCallback(() => setForceBurst(true), []);

  return { data, isLoading, error, refetch: fetchData, onCountdownExpire: triggerBurst };
}
