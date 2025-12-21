import { cn } from '@/lib/utils';
import { ClockStatus } from '@/types/attendance';

interface StatusBadgeProps {
  status: ClockStatus;
  className?: string;
  showPulse?: boolean;
}

const statusConfig: Record<ClockStatus, { label: string; className: string }> = {
  'clocked-in': {
    label: 'Clocked In',
    className: 'bg-success/15 text-success border-success/30',
  },
  'clocked-out': {
    label: 'Clocked Out',
    className: 'bg-muted text-muted-foreground border-border',
  },
  'on-break': {
    label: 'On Break',
    className: 'bg-warning/15 text-warning border-warning/30',
  },
};

export function StatusBadge({ status, className, showPulse = true }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full border font-medium text-sm',
        config.className,
        className
      )}
    >
      {showPulse && status !== 'clocked-out' && (
        <span className="relative flex h-2 w-2">
          <span
            className={cn(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              status === 'clocked-in' ? 'bg-success' : 'bg-warning'
            )}
          />
          <span
            className={cn(
              'relative inline-flex rounded-full h-2 w-2',
              status === 'clocked-in' ? 'bg-success' : 'bg-warning'
            )}
          />
        </span>
      )}
      {config.label}
    </div>
  );
}
