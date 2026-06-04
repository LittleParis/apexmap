import { useEffect, useState } from 'react';
import { useCountdown } from '../hooks/useCountdown';

interface CountdownTimerProps {
  endTime: number;
  colorClass: string;
  onExpire?: () => void;
}

export function CountdownTimer({ endTime, colorClass, onExpire }: CountdownTimerProps) {
  const { hours, minutes, seconds, isExpired, isUrgent } = useCountdown(endTime);
  const [prevSeconds, setPrevSeconds] = useState(seconds);
  const [flip, setFlip] = useState(false);

  useEffect(() => {
    if (seconds !== prevSeconds) {
      setFlip(true);
      const t = setTimeout(() => setFlip(false), 150);
      setPrevSeconds(seconds);
      return () => clearTimeout(t);
    }
  }, [seconds, prevSeconds]);

  useEffect(() => {
    if (isExpired && onExpire) {
      onExpire();
    }
  }, [isExpired, onExpire]);

  const pad = (n: number) => String(n).padStart(2, '0');

  if (isExpired) {
    return (
      <div className="font-mono text-2xl font-bold neon-text-red animate-pulse">
        轮换中...
      </div>
    );
  }

  const urgentColor = isUrgent ? 'neon-text-red urgent-animation' : colorClass;

  return (
    <div className="flex items-center gap-1">
      {/* 小时 */}
      <div className="flex items-baseline gap-0.5">
        <TimeDigit value={pad(hours)} className={urgentColor} />
        <span className="text-xs ml-0.5" style={{ color: 'var(--text-muted)' }}>时</span>
      </div>
      <span className={`font-mono text-xl mx-1 ${isUrgent ? 'text-red-500' : ''}`} style={isUrgent ? {} : { color: 'var(--text-muted)' }}>:</span>
      {/* 分钟 */}
      <div className="flex items-baseline gap-0.5">
        <TimeDigit value={pad(minutes)} className={urgentColor} />
        <span className="text-xs ml-0.5" style={{ color: 'var(--text-muted)' }}>分</span>
      </div>
      <span className={`font-mono text-xl mx-1 ${isUrgent ? 'text-red-500' : ''}`} style={isUrgent ? {} : { color: 'var(--text-muted)' }}>:</span>
      {/* 秒 */}
      <div className="flex items-baseline gap-0.5">
        <TimeDigit value={pad(seconds)} className={urgentColor} flip={flip} />
        <span className="text-xs ml-0.5" style={{ color: 'var(--text-muted)' }}>秒</span>
      </div>
    </div>
  );
}

function TimeDigit({ value, className, flip }: { value: string; className: string; flip?: boolean }) {
  return (
    <span
      className={`font-mono text-2xl sm:text-3xl font-bold tabular-nums transition-transform duration-150 ${flip ? 'scale-y-90 opacity-80' : 'scale-y-100 opacity-100'} ${className}`}
    >
      {value}
    </span>
  );
}
