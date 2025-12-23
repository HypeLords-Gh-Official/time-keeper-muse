import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { ACTIVITIES, AttendanceRecord, ActivityType } from '@/types/attendance';
import { ArrowLeft, Clock, TrendingUp, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock historical data for demo
const generateMockHistory = (): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const activities: ActivityType[] = ['guided-tour', 'exhibition', 'administrative', 'maintenance', 'field-work'];
  
  for (let i = 30; i >= 1; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Skip weekends randomly
    if (Math.random() > 0.8) continue;
    
    const clockInHour = 8 + Math.floor(Math.random() * 2);
    const clockOutHour = 16 + Math.floor(Math.random() * 3);
    
    const clockInTime = new Date(date);
    clockInTime.setHours(clockInHour, Math.floor(Math.random() * 30), 0);
    
    const clockOutTime = new Date(date);
    clockOutTime.setHours(clockOutHour, Math.floor(Math.random() * 60), 0);
    
    records.push({
      id: `record-${i}`,
      userId: '1',
      clockInTime,
      clockOutTime,
      activity: activities[Math.floor(Math.random() * activities.length)],
    });
  }
  
  return records;
};

export default function AttendanceHistory() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  // Combine mock history with today's records
  const mockHistory = useMemo(() => generateMockHistory(), []);
  const allRecords = [...mockHistory];
  
  // Get records for selected date
  const selectedDateRecords = allRecords.filter((record) =>
    isSameDay(record.clockInTime, selectedDate)
  );
  
  // Calculate stats
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthRecords = allRecords.filter(
    (record) => record.clockInTime >= monthStart && record.clockInTime <= monthEnd
  );
  
  const totalHoursThisMonth = monthRecords.reduce((acc, record) => {
    const end = record.clockOutTime || new Date();
    return acc + (end.getTime() - record.clockInTime.getTime()) / (1000 * 60 * 60);
  }, 0);
  
  const daysWorkedThisMonth = new Set(
    monthRecords.map((r) => format(r.clockInTime, 'yyyy-MM-dd'))
  ).size;
  
  const avgHoursPerDay = daysWorkedThisMonth > 0 ? totalHoursThisMonth / daysWorkedThisMonth : 0;
  
  const overtimeHours = Math.max(0, totalHoursThisMonth - daysWorkedThisMonth * 8);
  
  // Get days with records for calendar highlighting
  const daysWithRecords = allRecords.map((r) => r.clockInTime);
  
  const handlePreviousMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
  };
  
  const handleNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Logo size="sm" />
          </div>
          <h1 className="font-display text-xl font-semibold">Attendance History</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Calendar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Month Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card rounded-xl border p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wider">Total Hours</span>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {totalHoursThisMonth.toFixed(1)}h
                </div>
              </div>
              
              <div className="bg-card rounded-xl border p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <CalendarIcon className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wider">Days Worked</span>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {daysWorkedThisMonth}
                </div>
              </div>
              
              <div className="bg-card rounded-xl border p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wider">Avg/Day</span>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {avgHoursPerDay.toFixed(1)}h
                </div>
              </div>
              
              <div className="bg-card rounded-xl border p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Clock className="w-4 h-4 text-terracotta" />
                  <span className="text-xs uppercase tracking-wider">Overtime</span>
                </div>
                <div className={cn(
                  "text-2xl font-bold",
                  overtimeHours > 0 ? "text-terracotta" : "text-foreground"
                )}>
                  {overtimeHours.toFixed(1)}h
                </div>
              </div>
            </div>

            {/* Calendar */}
            <div className="bg-card rounded-2xl border shadow-soft p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl font-semibold">
                  {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleNextMonth}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                className="pointer-events-auto w-full"
                classNames={{
                  months: "w-full",
                  month: "w-full space-y-4",
                  table: "w-full border-collapse",
                  head_row: "flex w-full",
                  head_cell: "text-muted-foreground rounded-md flex-1 font-normal text-sm",
                  row: "flex w-full mt-2",
                  cell: "flex-1 h-12 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                  day: cn(
                    "h-12 w-full p-0 font-normal rounded-lg transition-colors",
                    "hover:bg-secondary aria-selected:opacity-100"
                  ),
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary/90",
                  day_today: "bg-accent text-accent-foreground font-semibold",
                  day_outside: "text-muted-foreground opacity-50",
                  day_disabled: "text-muted-foreground opacity-50",
                  nav: "hidden",
                  caption: "hidden",
                }}
                modifiers={{
                  hasRecord: (date) => daysWithRecords.some((d) => isSameDay(d, date)),
                }}
                modifiersClassNames={{
                  hasRecord: "after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-forest",
                }}
              />
              
              <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-3 h-3 rounded-full bg-forest" />
                  <span>Worked</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-3 h-3 rounded bg-primary" />
                  <span>Selected</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-3 h-3 rounded bg-accent" />
                  <span>Today</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Selected Day Details */}
          <div className="space-y-6">
            <div className="bg-card rounded-2xl border shadow-soft p-6">
              <h3 className="font-display text-lg font-semibold mb-1">
                {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEEE')}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {format(selectedDate, 'MMMM d, yyyy')}
              </p>
              
              {selectedDateRecords.length > 0 ? (
                <div className="space-y-4">
                  {/* Day Summary */}
                  <div className="p-4 rounded-xl bg-secondary/50">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          Total Hours
                        </div>
                        <div className="text-xl font-bold text-foreground">
                          {selectedDateRecords.reduce((acc, record) => {
                            const end = record.clockOutTime || new Date();
                            return acc + (end.getTime() - record.clockInTime.getTime()) / (1000 * 60 * 60);
                          }, 0).toFixed(1)}h
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          Activities
                        </div>
                        <div className="text-xl font-bold text-foreground">
                          {selectedDateRecords.length}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Activity Timeline */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Activity Log
                    </h4>
                    {selectedDateRecords.map((record) => {
                      const activity = ACTIVITIES.find((a) => a.id === record.activity);
                      const duration = record.clockOutTime
                        ? (record.clockOutTime.getTime() - record.clockInTime.getTime()) / (1000 * 60 * 60)
                        : 0;
                      
                      return (
                        <div
                          key={record.id}
                          className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50"
                        >
                          <span className="text-2xl">{activity?.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-foreground">
                              {activity?.label}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {format(record.clockInTime, 'h:mm a')}
                              {record.clockOutTime && (
                                <> → {format(record.clockOutTime, 'h:mm a')}</>
                              )}
                            </div>
                            {record.clockOutTime && (
                              <div className="text-xs text-forest mt-1">
                                {duration.toFixed(1)} hours
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <CalendarIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No records for this day
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
