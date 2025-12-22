import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { TimeDisplay } from '@/components/TimeDisplay';
import { StatusBadge } from '@/components/StatusBadge';
import { ActivityCard } from '@/components/ActivityCard';
import { ClockButton } from '@/components/ClockButton';
import { WorkingHoursCard } from '@/components/WorkingHoursCard';
import { Button } from '@/components/ui/button';
import { ACTIVITIES, ActivityType, ClockStatus, AttendanceRecord } from '@/types/attendance';
import { toast } from 'sonner';
import { LogOut, Settings, User, ChevronRight, History, QrCode } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  department: string | null;
  profile_photo_url: string | null;
  qr_code: string;
}

interface UserRole {
  role: 'staff' | 'supervisor' | 'admin';
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Clock state (local for now - can be extended to persist in DB)
  const [clockStatus, setClockStatus] = useState<ClockStatus>('clocked-out');
  const [currentActivity, setCurrentActivity] = useState<ActivityType | null>(null);
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([]);
  
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityType | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData as UserProfile);
      }

      // Fetch role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (roleData) {
        setUserRole(roleData as UserRole);
      }

      setLoading(false);
    };

    fetchUserData();
  }, [navigate]);

  const handleClockIn = () => {
    setShowActivityModal(true);
  };

  const handleConfirmClockIn = () => {
    if (selectedActivity) {
      const now = new Date();
      const newRecord: AttendanceRecord = {
        id: Date.now().toString(),
        userId: profile?.id || '',
        clockInTime: now,
        activity: selectedActivity,
      };

      setClockStatus('clocked-in');
      setCurrentActivity(selectedActivity);
      setClockInTime(now);
      setTodayRecords(prev => [...prev, newRecord]);
      setShowActivityModal(false);
      setSelectedActivity(null);
      
      const activity = ACTIVITIES.find((a) => a.id === selectedActivity);
      toast.success('Clocked In Successfully!', {
        description: `You're now working on: ${activity?.label}`,
      });
    }
  };

  const handleClockOut = () => {
    setTodayRecords(prev => {
      const updated = [...prev];
      if (updated.length > 0 && !updated[updated.length - 1].clockOutTime) {
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          clockOutTime: new Date(),
        };
      }
      return updated;
    });
    
    setClockStatus('clocked-out');
    setCurrentActivity(null);
    setClockInTime(null);
    toast.success('Clocked Out', {
      description: 'Have a great rest of your day!',
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const getTodayHours = (): number => {
    let totalMs = 0;
    todayRecords.forEach((record) => {
      const end = record.clockOutTime || new Date();
      totalMs += end.getTime() - record.clockInTime.getTime();
    });
    return totalMs / (1000 * 60 * 60);
  };

  const activityInfo = ACTIVITIES.find((a) => a.id === currentActivity);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="sm" />
          
          <div className="flex items-center gap-4">
            <StatusBadge status={clockStatus} />
            
            <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary">
              {profile?.profile_photo_url && (
                <img 
                  src={profile.profile_photo_url} 
                  alt={profile.full_name}
                  className="w-6 h-6 rounded-full object-cover"
                />
              )}
              <span className="font-medium text-sm">{profile?.full_name}</span>
              <span className="text-xs text-muted-foreground capitalize">({userRole?.role || 'staff'})</span>
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
                Welcome, {profile?.full_name?.split(' ')[0]}!
              </h1>
              <p className="text-muted-foreground">
                {clockStatus === 'clocked-in'
                  ? `You're currently working on: ${activityInfo?.label}`
                  : clockStatus === 'on-break'
                  ? "You're on a break"
                  : "Ready to start your day?"}
              </p>
            </div>

            {/* Time and Clock Section */}
            <div className="bg-card rounded-3xl border shadow-soft p-8">
              <TimeDisplay size="md" className="mb-8" />
              
              <div className="flex flex-col items-center">
                <ClockButton
                  status={clockStatus}
                  onClockIn={handleClockIn}
                  onClockOut={handleClockOut}
                />
              </div>

              {/* Current Activity Display */}
              {clockStatus !== 'clocked-out' && activityInfo && (
                <div className="mt-8 p-4 rounded-xl bg-secondary/50 border border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{activityInfo.icon}</span>
                      <div>
                        <div className="font-medium text-foreground">
                          {activityInfo.label}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Since{' '}
                          {clockInTime?.toLocaleTimeString('en-US', {
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
              <Button
                variant="outline"
                className="h-auto py-4 flex-col gap-2"
                onClick={() => navigate('/history')}
              >
                <History className="w-5 h-5" />
                <span className="text-sm">History</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2"
                onClick={() => setShowQRModal(true)}
              >
                <QrCode className="w-5 h-5" />
                <span className="text-sm">My QR Code</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <Settings className="w-5 h-5" />
                <span className="text-sm">Settings</span>
              </Button>
              {(userRole?.role === 'supervisor' || userRole?.role === 'admin') && (
                <Button
                  variant="outline"
                  className="h-auto py-4 flex-col gap-2"
                  onClick={() => navigate('/admin')}
                >
                  <User className="w-5 h-5" />
                  <span className="text-sm">Admin</span>
                </Button>
              )}
            </div>
          </div>

          {/* Right Column - Stats */}
          <div className="space-y-6">
            <WorkingHoursCard 
              hours={getTodayHours()}
              records={todayRecords}
            />

            {/* Recent Activity */}
            <div className="bg-card rounded-2xl border shadow-soft p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
                Today's Activity Log
              </h3>
              
              {todayRecords.length > 0 ? (
                <div className="space-y-3">
                  {todayRecords.slice(-5).reverse().map((record) => {
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
              {clockStatus === 'clocked-out' ? 'Select Your Activity' : 'Switch Activity'}
            </DialogTitle>
            <DialogDescription>
              Choose the activity you'll be working on
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {ACTIVITIES.filter((a) => clockStatus === 'clocked-out' || a.id !== 'break').map(
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
              disabled={!selectedActivity}
              onClick={handleConfirmClockIn}
              className="gradient-accent text-accent-foreground"
            >
              {clockStatus === 'clocked-out' ? 'Clock In' : 'Switch Activity'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Code Modal */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-center">
              Your QR Code
            </DialogTitle>
            <DialogDescription className="text-center">
              Scan this code to quickly log in on any device
            </DialogDescription>
          </DialogHeader>

          {profile?.qr_code && (
            <div className="flex justify-center py-6">
              <QRCodeDisplay 
                value={profile.qr_code} 
                userName={profile.full_name} 
                size={220}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
