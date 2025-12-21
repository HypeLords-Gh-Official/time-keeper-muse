import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { TimeDisplay } from '@/components/TimeDisplay';
import { StatusBadge } from '@/components/StatusBadge';
import { ActivityCard } from '@/components/ActivityCard';
import { ClockButton } from '@/components/ClockButton';
import { WorkingHoursCard } from '@/components/WorkingHoursCard';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { ACTIVITIES, ActivityType } from '@/types/attendance';
import { toast } from 'sonner';
import { LogOut, Settings, User, ChevronRight, History } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export default function Dashboard() {
  const { user, clockState, clockIn, clockOut, logout } = useAuth();
  const navigate = useNavigate();
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityType | null>(null);

  const handleClockIn = () => {
    setShowActivityModal(true);
  };

  const handleConfirmClockIn = () => {
    if (selectedActivity) {
      clockIn(selectedActivity);
      setShowActivityModal(false);
      setSelectedActivity(null);
      const activity = ACTIVITIES.find((a) => a.id === selectedActivity);
      toast.success('Clocked In Successfully!', {
        description: `You're now working on: ${activity?.label}`,
      });
    }
  };

  const handleClockOut = () => {
    clockOut();
    toast.success('Clocked Out', {
      description: 'Have a great rest of your day!',
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const currentActivity = ACTIVITIES.find((a) => a.id === clockState.currentActivity);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="sm" />
          
          <div className="flex items-center gap-4">
            <StatusBadge status={clockState.status} />
            
            <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-sm">{user?.name}</span>
              <span className="text-xs text-muted-foreground capitalize">({user?.role})</span>
            </div>

            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Clock Actions */}
          <div className="lg:col-span-2 space-y-8">
            {/* Welcome Section */}
            <div className="text-center lg:text-left">
              <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                Welcome, {user?.name?.split(' ')[0]}!
              </h1>
              <p className="text-muted-foreground">
                {clockState.status === 'clocked-in'
                  ? `You're currently working on: ${currentActivity?.label}`
                  : clockState.status === 'on-break'
                  ? "You're on a break"
                  : "Ready to start your day?"}
              </p>
            </div>

            {/* Time and Clock Section */}
            <div className="bg-card rounded-3xl border shadow-soft p-8">
              <TimeDisplay size="md" className="mb-8" />
              
              <div className="flex flex-col items-center">
                <ClockButton
                  status={clockState.status}
                  onClockIn={handleClockIn}
                  onClockOut={handleClockOut}
                />
              </div>

              {/* Current Activity Display */}
              {clockState.status !== 'clocked-out' && currentActivity && (
                <div className="mt-8 p-4 rounded-xl bg-secondary/50 border border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{currentActivity.icon}</span>
                      <div>
                        <div className="font-medium text-foreground">
                          {currentActivity.label}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Since{' '}
                          {clockState.clockInTime?.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowActivityModal(true)}
                    >
                      Switch Activity
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <History className="w-5 h-5" />
                <span className="text-sm">History</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <Settings className="w-5 h-5" />
                <span className="text-sm">Settings</span>
              </Button>
              {(user?.role === 'supervisor' || user?.role === 'admin') && (
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2 col-span-2"
                  onClick={() => navigate('/admin')}
                >
                  <User className="w-5 h-5" />
                  <span className="text-sm">Admin Dashboard</span>
                </Button>
              )}
            </div>
          </div>

          {/* Right Column - Stats */}
          <div className="space-y-6">
            <WorkingHoursCard />

            {/* Recent Activity */}
            <div className="bg-card rounded-2xl border shadow-soft p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
                Today's Activity Log
              </h3>
              
              {clockState.todayRecords.length > 0 ? (
                <div className="space-y-3">
                  {clockState.todayRecords.slice(-5).reverse().map((record) => {
                    const activity = ACTIVITIES.find((a) => a.id === record.activity);
                    return (
                      <div
                        key={record.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30"
                      >
                        <span className="text-xl">{activity?.icon}</span>
                        <div className="flex-1">
                          <div className="font-medium text-sm text-foreground">
                            {activity?.label}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {record.clockInTime.toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            {record.clockOutTime &&
                              ` - ${record.clockOutTime.toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No activity recorded yet today
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Activity Selection Modal */}
      <Dialog open={showActivityModal} onOpenChange={setShowActivityModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              {clockState.status === 'clocked-out' ? 'Select Your Activity' : 'Switch Activity'}
            </DialogTitle>
            <DialogDescription>
              Choose the activity you'll be working on
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {ACTIVITIES.filter((a) => clockState.status === 'clocked-out' || a.id !== 'break').map(
              (activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  selected={selectedActivity === activity.id}
                  onClick={() => setSelectedActivity(activity.id)}
                />
              )
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowActivityModal(false)}>
              Cancel
            </Button>
            <Button
              variant="success"
              disabled={!selectedActivity}
              onClick={handleConfirmClockIn}
            >
              {clockState.status === 'clocked-out' ? 'Clock In' : 'Switch Activity'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
