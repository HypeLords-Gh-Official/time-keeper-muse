import { cn } from '@/lib/utils';
import { Activity } from '@/types/attendance';

interface ActivityCardProps {
  activity: Activity;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export function ActivityCard({ activity, selected = false, onClick, disabled = false }: ActivityCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'group relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200',
        'hover:scale-[1.02] active:scale-[0.98]',
        selected
          ? 'border-primary bg-primary/10 shadow-soft'
          : 'border-border bg-card hover:border-primary/50 hover:bg-secondary/50',
        disabled && 'opacity-50 cursor-not-allowed hover:scale-100'
      )}
    >
      <span className="text-3xl mb-2 transition-transform duration-200 group-hover:scale-110">
        {activity.icon}
      </span>
      <span className="font-medium text-sm text-foreground">{activity.label}</span>
      <span className="text-xs text-muted-foreground mt-1 text-center line-clamp-2">
        {activity.description}
      </span>
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
          <svg
            className="w-3 h-3 text-primary-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </button>
  );
}
