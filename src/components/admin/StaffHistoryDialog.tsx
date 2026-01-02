import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInMinutes } from 'date-fns';
import { Loader2, Clock, Calendar } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AttendanceRecord {
  id: string;
  clock_in_time: string;
  clock_out_time: string | null;
  activity: string;
  created_at: string;
}

interface StaffHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  staffName: string;
}

export function StaffHistoryDialog({
  open,
  onOpenChange,
  userId,
  staffName,
}: StaffHistoryDialogProps) {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    if (open && userId) {
      fetchHistory();
    }
  }, [open, userId]);

  const fetchHistory = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('user_id', userId)
        .order('clock_in_time', { ascending: false })
        .limit(100);

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = (clockIn: string, clockOut: string | null) => {
    const start = new Date(clockIn);
    const end = clockOut ? new Date(clockOut) : new Date();
    const minutes = differenceInMinutes(end, start);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getActivityColor = (activity: string) => {
    switch (activity) {
      case 'working':
        return 'bg-success/10 text-success';
      case 'break':
        return 'bg-warning/10 text-warning';
      case 'meeting':
        return 'bg-blue-500/10 text-blue-500';
      default:
        return 'bg-slate-500/10 text-slate-400';
    }
  };

  // Group records by date
  const groupedRecords = records.reduce((groups, record) => {
    const date = format(new Date(record.clock_in_time), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(record);
    return groups;
  }, {} as Record<string, AttendanceRecord[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-slate-800 border-slate-700 text-white max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Attendance History - {staffName}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No attendance records found</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-6">
              {Object.entries(groupedRecords).map(([date, dayRecords]) => (
                <div key={date}>
                  <h3 className="text-sm font-medium text-slate-400 mb-3 sticky top-0 bg-slate-800 py-1">
                    {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                  </h3>
                  <div className="space-y-2">
                    {dayRecords.map((record) => (
                      <div
                        key={record.id}
                        className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getActivityColor(
                              record.activity
                            )}`}
                          >
                            {record.activity}
                          </span>
                          <span className="text-sm text-slate-400">
                            {calculateDuration(record.clock_in_time, record.clock_out_time)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div>
                            <span className="text-slate-400">In: </span>
                            <span className="text-white font-medium">
                              {format(new Date(record.clock_in_time), 'hh:mm a')}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Out: </span>
                            <span className="text-white font-medium">
                              {record.clock_out_time
                                ? format(new Date(record.clock_out_time), 'hh:mm a')
                                : '—'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
