import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TimeDisplayProps {
  className?: string;
  showDate?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function TimeDisplay({ className, showDate = true, size = 'md' }: TimeDisplayProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const dateString = time.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const sizes = {
    sm: { time: 'text-2xl', date: 'text-sm' },
    md: { time: 'text-4xl', date: 'text-base' },
    lg: { time: 'text-6xl', date: 'text-lg' },
  };

  return (
    <div className={cn('text-center', className)}>
      <div className={cn('font-display font-bold text-foreground tracking-tight', sizes[size].time)}>
        {timeString}
      </div>
      {showDate && (
        <div className={cn('text-muted-foreground mt-1', sizes[size].date)}>{dateString}</div>
      )}
    </div>
  );
}
