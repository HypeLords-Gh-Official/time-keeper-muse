import { Clock, TrendingUp, Coffee } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface WorkingHoursCardProps {
  className?: string;
}

export function WorkingHoursCard({ className }: WorkingHoursCardProps) {
  const { getTodayHours, clockState } = useAuth();
  const hours = getTodayHours();
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);

  const standardHours = 8;
  const overtime = Math.max(0, hours - standardHours);
  const progress = Math.min((hours / standardHours) * 100, 100);

  return (
    <div className={cn('bg-card rounded-2xl border shadow-soft p-6', className)}>
      <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
        Today's Summary
      </h3>

      <div className="space-y-6">
        {/* Total Hours */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Clock className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="text-2xl font-bold text-foreground">
              {wholeHours}h {minutes}m
            </div>
            <div className="text-sm text-muted-foreground">Total Working Hours</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Daily Progress</span>
            <span className="font-medium text-foreground">{Math.round(progress)}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full gradient-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-secondary/50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium uppercase">Overtime</span>
            </div>
            <div className="text-lg font-bold text-foreground">
              {overtime > 0 ? `${Math.floor(overtime)}h ${Math.round((overtime % 1) * 60)}m` : '—'}
            </div>
          </div>

          <div className="bg-secondary/50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Coffee className="w-4 h-4" />
              <span className="text-xs font-medium uppercase">Breaks</span>
            </div>
            <div className="text-lg font-bold text-foreground">
              {clockState.todayRecords.filter((r) => r.activity === 'break').length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
