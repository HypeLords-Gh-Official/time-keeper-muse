import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowLeft,
  Users,
  Clock,
  Settings,
  Download,
  Search,
  Filter,
  TrendingUp,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, isToday, differenceInHours, differenceInMinutes } from 'date-fns';

interface StaffMember {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  department: string | null;
  profile_photo_url: string | null;
  is_approved: boolean;
}

interface AttendanceRecord {
  id: string;
  user_id: string;
  clock_in_time: string;
  clock_out_time: string | null;
  activity: string;
  created_at: string;
  updated_at: string;
}

interface StaffAttendance {
  id: string;
  name: string;
  email: string;
  department: string;
  status: 'clocked-in' | 'on-break' | 'clocked-out';
  activity: string;
  clockInTime: string;
  hoursToday: number;
  profilePhoto: string | null;
  isApproved: boolean;
}

export default function Admin() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [loading, setLoading] = useState(true);
  const [staffAttendance, setStaffAttendance] = useState<StaffAttendance[]>([]);
  const [stats, setStats] = useState({
    present: 0,
    total: 0,
    onBreak: 0,
    lateToday: 0,
    avgHours: 0,
  });

  useEffect(() => {
    fetchStaffData();
  }, []);

  const fetchStaffData = async () => {
    try {
      // Fetch all staff profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Fetch today's attendance records
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('*')
        .gte('clock_in_time', today.toISOString());

      if (attendanceError) throw attendanceError;

      // Fetch login verifications for today
      const { data: loginVerifications } = await supabase
        .from('login_verifications')
        .select('*')
        .gte('verified_at', today.toISOString());

      // Process staff data with attendance
      const staffData: StaffAttendance[] = (profiles || []).map((profile: StaffMember) => {
        const userAttendance = (attendanceRecords || []).filter(
          (record: AttendanceRecord) => record.user_id === profile.user_id
        );
        
        const latestRecord = userAttendance.length > 0 
          ? userAttendance.reduce((latest: AttendanceRecord, current: AttendanceRecord) => 
              new Date(current.clock_in_time) > new Date(latest.clock_in_time) ? current : latest
            )
          : null;

        // Calculate total hours worked today
        const hoursToday = userAttendance.reduce((total: number, record: AttendanceRecord) => {
          const clockIn = new Date(record.clock_in_time);
          const clockOut = record.clock_out_time ? new Date(record.clock_out_time) : new Date();
          const hours = differenceInMinutes(clockOut, clockIn) / 60;
          return total + hours;
        }, 0);

        // Determine status
        let status: 'clocked-in' | 'on-break' | 'clocked-out' = 'clocked-out';
        let activity = 'N/A';
        let clockInTime = '—';

        if (latestRecord && !latestRecord.clock_out_time) {
          status = latestRecord.activity === 'break' ? 'on-break' : 'clocked-in';
          activity = latestRecord.activity;
          clockInTime = format(new Date(latestRecord.clock_in_time), 'hh:mm a');
        }

        return {
          id: profile.id,
          name: profile.full_name,
          email: profile.email,
          department: profile.department || 'Unassigned',
          status,
          activity,
          clockInTime,
          hoursToday: Math.round(hoursToday * 10) / 10,
          profilePhoto: profile.profile_photo_url,
          isApproved: profile.is_approved || false,
        };
      });

      setStaffAttendance(staffData);

      // Calculate stats
      const present = staffData.filter(s => s.status !== 'clocked-out').length;
      const onBreak = staffData.filter(s => s.status === 'on-break').length;
      const totalHours = staffData.reduce((sum, s) => sum + s.hoursToday, 0);
      const workingStaff = staffData.filter(s => s.hoursToday > 0).length;

      setStats({
        present,
        total: staffData.length,
        onBreak,
        lateToday: 0, // Can implement late detection based on expected clock-in time
        avgHours: workingStaff > 0 ? Math.round((totalHours / workingStaff) * 10) / 10 : 0,
      });

    } catch (error) {
      console.error('Error fetching staff data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = staffAttendance.filter((staff) => {
    const matchesSearch = staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          staff.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment =
      filterDepartment === 'all' || staff.department === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  const departments = [...new Set(staffAttendance.map((s) => s.department))];

  const STATS = [
    {
      label: 'Staff Present',
      value: stats.present.toString(),
      total: `/${stats.total}`,
      icon: Users,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'On Break',
      value: stats.onBreak.toString(),
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      label: 'Pending Approval',
      value: staffAttendance.filter(s => !s.isApproved).length.toString(),
      icon: AlertCircle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
    {
      label: 'Avg. Hours',
      value: `${stats.avgHours}h`,
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Logo size="sm" showText={false} />
            <div>
              <h1 className="font-display text-xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Real-time attendance monitoring
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={fetchStaffData}>
              <Download className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="bg-card rounded-2xl border shadow-soft p-5 animate-fade-in"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-foreground">{stat.value}</span>
                {stat.total && (
                  <span className="text-lg text-muted-foreground">{stat.total}</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Staff Attendance Table */}
        <div className="bg-card rounded-2xl border shadow-soft overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="font-display text-xl font-bold">Staff Attendance</h2>
              
              <div className="flex items-center gap-3">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search staff..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                  <SelectTrigger className="w-40">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                    Staff Member
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                    Department
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                    Current Activity
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                    Clock In
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                    Hours Today
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground">
                    Approved
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredStaff.map((staff, index) => (
                  <tr
                    key={staff.id}
                    className="hover:bg-secondary/30 transition-colors animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {staff.profilePhoto ? (
                          <img 
                            src={staff.profilePhoto} 
                            alt={staff.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {staff.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-foreground block">{staff.name}</span>
                          <span className="text-xs text-muted-foreground">{staff.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-muted-foreground">{staff.department}</td>
                    <td className="py-4 px-6">
                      <StatusBadge status={staff.status} showPulse={false} />
                    </td>
                    <td className="py-4 px-6 text-foreground capitalize">{staff.activity.replace('-', ' ')}</td>
                    <td className="py-4 px-6 text-muted-foreground">{staff.clockInTime}</td>
                    <td className="py-4 px-6">
                      <span className="font-medium text-foreground">
                        {staff.hoursToday > 0 ? `${staff.hoursToday}h` : '—'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        staff.isApproved 
                          ? 'bg-success/10 text-success' 
                          : 'bg-warning/10 text-warning'
                      }`}>
                        {staff.isApproved ? 'Yes' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredStaff.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <p>No staff members found matching your criteria</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
