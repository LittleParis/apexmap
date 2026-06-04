import { useState, useEffect, useRef } from 'react';

interface UseCountdownOptions {
  onExpire?: () => void;
}

export function useCountdown(endTime: number, options?: UseCountdownOptions) {
  const [now, setNow] = useState(() => Date.now() / 1000);
  const { onExpire } = options || {};

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now() / 1000);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const remaining = Math.max(0, endTime - now);
  const totalSeconds = Math.floor(remaining);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const isExpired = remaining <= 0;
  const isUrgent = remaining > 0 && remaining < 300; // 5 分钟内

  // 合并为一个 effect：endTime 变化时重置标记，同时检测是否到期
  // 防止 endTime 更新到未来值时，旧的 isExpired=true 残留导致误触发
  const hasExpiredRef = useRef(false);
  const prevEndTimeRef = useRef(endTime);

  useEffect(() => {
    // endTime 变化 → 重置过期标记
    if (endTime !== prevEndTimeRef.current) {
      prevEndTimeRef.current = endTime;
      hasExpiredRef.current = false;
    }

    // 倒计时归零时精确触发一次 onExpire
    if (isExpired && onExpire && !hasExpiredRef.current) {
      hasExpiredRef.current = true;
      onExpire();
    }
  }, [isExpired, onExpire, endTime]);

  return { hours, minutes, seconds, totalSeconds, isExpired, isUrgent };
}
