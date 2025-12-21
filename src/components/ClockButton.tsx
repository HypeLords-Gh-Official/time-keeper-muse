import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, Pause } from 'lucide-react';
import { ClockStatus } from '@/types/attendance';

interface ClockButtonProps {
  status: ClockStatus;
  onClockIn?: () => void;
  onClockOut?: () => void;
  disabled?: boolean;
  className?: string;
}

export function ClockButton({
  status,
  onClockIn,
  onClockOut,
  disabled = false,
  className,
}: ClockButtonProps) {
  const isClockedIn = status === 'clocked-in' || status === 'on-break';

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <Button
        variant={isClockedIn ? 'clockOut' : 'clockIn'}
        size="clockLg"
        onClick={isClockedIn ? onClockOut : onClockIn}
        disabled={disabled}
        className={cn(
          'relative transition-all duration-300',
          !isClockedIn && !disabled && 'animate-pulse-glow'
        )}
      >
        {isClockedIn ? (
          <LogOut className="w-10 h-10" />
        ) : (
          <LogIn className="w-10 h-10" />
        )}
      </Button>
      <span className="text-sm font-medium text-muted-foreground">
        {isClockedIn ? 'Tap to Clock Out' : 'Tap to Clock In'}
      </span>
    </div>
  );
}
