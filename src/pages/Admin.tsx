import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Users,
  Clock,
  Settings,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  Loader2,
  UserCheck,
  UserX,
} from 'lucide-react';
import { differenceInMinutes } from 'date-fns';
import { StaffManagementTable, StaffMember } from '@/components/admin/StaffManagementTable';
import { StaffEditDialog } from '@/components/admin/StaffEditDialog';
import { StaffHistoryDialog } from '@/components/admin/StaffHistoryDialog';
import { WorkStatusDialog } from '@/components/admin/WorkStatusDialog';
import { DepartmentDialog } from '@/components/admin/DepartmentDialog';
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog';

interface ProfileRow {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  department: string | null;
  profile_photo_url: string | null;
  is_approved: boolean | null;
  staff_number: string | null;
  work_status: string | null;
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

export default function Admin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [stats, setStats] = useState({
    present: 0,
    total: 0,
    onBreak: 0,
    pendingApproval: 0,
    avgHours: 0,
  });

  // Dialog states
  const [editDialog, setEditDialog] = useState<{ open: boolean; staff: StaffMember | null }>({
    open: false,
    staff: null,
  });
  const [historyDialog, setHistoryDialog] = useState<{ open: boolean; userId: string | null; name: string }>({
    open: false,
    userId: null,
    name: '',
  });
  const [workStatusDialog, setWorkStatusDialog] = useState<{ open: boolean; staff: StaffMember | null }>({
    open: false,
    staff: null,
  });
  const [departmentDialog, setDepartmentDialog] = useState<{ open: boolean; staff: StaffMember | null }>({
    open: false,
    staff: null,
  });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; userId: string; name: string }>({
    open: false,
    userId: '',
    name: '',
  });
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchStaffData();
  }, []);

  const fetchStaffData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
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

      // Process staff data with attendance
      const staffData: StaffMember[] = (profiles || []).map((profile: ProfileRow) => {
        const userAttendance = (attendanceRecords || []).filter(
          (record: AttendanceRecord) => record.user_id === profile.user_id
        );

        const latestRecord =
          userAttendance.length > 0
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
          clockInTime = new Date(latestRecord.clock_in_time).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          });
        }

        return {
          id: profile.id,
          user_id: profile.user_id,
          name: profile.full_name,
          email: profile.email,
          department: profile.department || 'Unassigned',
          staffNumber: profile.staff_number || '—',
          status,
          workStatus: (profile.work_status as 'active' | 'on-leave' | 'off-duty' | 'off-work') || 'active',
          activity,
          clockInTime,
          hoursToday: Math.round(hoursToday * 10) / 10,
          profilePhoto: profile.profile_photo_url,
          isApproved: profile.is_approved || false,
        };
      });

      setStaffList(staffData);

      // Extract unique departments
      const uniqueDepts = [...new Set(staffData.map((s) => s.department).filter(Boolean))];
      setDepartments(uniqueDepts);

      // Calculate stats
      const present = staffData.filter((s) => s.status !== 'clocked-out').length;
      const onBreak = staffData.filter((s) => s.status === 'on-break').length;
      const pendingApproval = staffData.filter((s) => !s.isApproved).length;
      const totalHours = staffData.reduce((sum, s) => sum + s.hoursToday, 0);
      const workingStaff = staffData.filter((s) => s.hoursToday > 0).length;

      setStats({
        present,
        total: staffData.length,
        onBreak,
        pendingApproval,
        avgHours: workingStaff > 0 ? Math.round((totalHours / workingStaff) * 10) / 10 : 0,
      });
    } catch (error) {
      console.error('Error fetching staff data:', error);
      toast.error('Failed to fetch staff data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handler functions
  const handleApprove = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: true })
        .eq('user_id', userId);

      if (error) throw error;
      toast.success('Staff member approved');
      fetchStaffData();
    } catch (error) {
      console.error('Error approving staff:', error);
      toast.error('Failed to approve staff member');
    }
  };

  const handleDecline = async (userId: string) => {
    try {
      // Delete the profile (this will cascade to other tables)
      const { error } = await supabase.from('profiles').delete().eq('user_id', userId);

      if (error) throw error;
      toast.success('Staff application declined');
      fetchStaffData();
    } catch (error) {
      console.error('Error declining staff:', error);
      toast.error('Failed to decline staff application');
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      // Delete user roles first
      await supabase.from('user_roles').delete().eq('user_id', deleteDialog.userId);

      // Delete attendance records
      await supabase.from('attendance_records').delete().eq('user_id', deleteDialog.userId);

      // Delete login verifications
      await supabase.from('login_verifications').delete().eq('user_id', deleteDialog.userId);

      // Delete profile
      const { error } = await supabase.from('profiles').delete().eq('user_id', deleteDialog.userId);

      if (error) throw error;
      toast.success('Staff member deleted successfully');
      setDeleteDialog({ open: false, userId: '', name: '' });
      fetchStaffData();
    } catch (error) {
      console.error('Error deleting staff:', error);
      toast.error('Failed to delete staff member');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEditSave = async (
    userId: string,
    data: { full_name: string; email: string; department: string; staff_number: string }
  ) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          email: data.email,
          department: data.department,
          staff_number: data.staff_number,
        })
        .eq('user_id', userId);

      if (error) throw error;
      toast.success('Profile updated successfully');
      fetchStaffData();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
      throw error;
    }
  };

  const handleDepartmentSave = async (userId: string, department: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ department })
        .eq('user_id', userId);

      if (error) throw error;
      toast.success('Department updated successfully');
      fetchStaffData();
    } catch (error) {
      console.error('Error updating department:', error);
      toast.error('Failed to update department');
      throw error;
    }
  };

  const handleWorkStatusSave = async (userId: string, workStatus: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ work_status: workStatus })
        .eq('user_id', userId);

      if (error) throw error;
      toast.success('Work status updated successfully');
      fetchStaffData();
    } catch (error) {
      console.error('Error updating work status:', error);
      toast.error('Failed to update work status');
      throw error;
    }
  };

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
      value: stats.pendingApproval.toString(),
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
              className="text-slate-300 hover:text-white hover:bg-slate-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Logo size="sm" showText={false} />
            <div>
              <h1 className="font-display text-xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-sm text-slate-400">Staff & Attendance Management</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchStaffData(true)}
              disabled={refreshing}
              className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-300 hover:text-white hover:bg-slate-700"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Quick Actions for Pending Approvals */}
        {stats.pendingApproval > 0 && (
          <div className="mb-6 p-4 bg-warning/10 border border-warning/30 rounded-xl">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-warning" />
              <p className="text-warning font-medium">
                {stats.pendingApproval} staff member{stats.pendingApproval > 1 ? 's' : ''} pending
                approval
              </p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 shadow-lg p-5 animate-fade-in"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white">{stat.value}</span>
                {stat.total && <span className="text-lg text-slate-400">{stat.total}</span>}
              </div>
              <p className="text-sm text-slate-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Staff Management Table */}
        <StaffManagementTable
          staff={staffList}
          departments={departments}
          onApprove={handleApprove}
          onDecline={handleDecline}
          onDelete={(userId, name) => setDeleteDialog({ open: true, userId, name })}
          onEdit={(staff) => setEditDialog({ open: true, staff })}
          onViewHistory={(userId, name) => setHistoryDialog({ open: true, userId, name })}
          onReassignDepartment={(staff) => setDepartmentDialog({ open: true, staff })}
          onSetWorkStatus={(staff) => setWorkStatusDialog({ open: true, staff })}
        />
      </main>

      {/* Dialogs */}
      <StaffEditDialog
        open={editDialog.open}
        onOpenChange={(open) => setEditDialog({ open, staff: open ? editDialog.staff : null })}
        staff={editDialog.staff}
        departments={departments}
        onSave={handleEditSave}
      />

      <StaffHistoryDialog
        open={historyDialog.open}
        onOpenChange={(open) =>
          setHistoryDialog({ open, userId: open ? historyDialog.userId : null, name: historyDialog.name })
        }
        userId={historyDialog.userId}
        staffName={historyDialog.name}
      />

      <WorkStatusDialog
        open={workStatusDialog.open}
        onOpenChange={(open) => setWorkStatusDialog({ open, staff: open ? workStatusDialog.staff : null })}
        staff={workStatusDialog.staff}
        onSave={handleWorkStatusSave}
      />

      <DepartmentDialog
        open={departmentDialog.open}
        onOpenChange={(open) => setDepartmentDialog({ open, staff: open ? departmentDialog.staff : null })}
        staff={departmentDialog.staff}
        onSave={handleDepartmentSave}
      />

      <DeleteConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, userId: '', name: '' })}
        staffName={deleteDialog.name}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
