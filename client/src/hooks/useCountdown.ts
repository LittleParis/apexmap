import { useState, useEffect } from 'react';

export function useCountdown(endTime: number) {
  const [now, setNow] = useState(() => Date.now() / 1000);

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

  return { hours, minutes, seconds, totalSeconds, isExpired, isUrgent };
}
