import { useState } from 'react';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Filter,
  MoreVertical,
  UserCheck,
  UserX,
  Trash2,
  Edit,
  History,
  Building2,
  Calendar,
} from 'lucide-react';

export interface StaffMember {
  id: string;
  user_id: string;
  name: string;
  email: string;
  department: string;
  staffNumber: string;
  status: 'clocked-in' | 'on-break' | 'clocked-out';
  workStatus: 'active' | 'on-leave' | 'off-duty' | 'off-work';
  activity: string;
  clockInTime: string;
  hoursToday: number;
  profilePhoto: string | null;
  isApproved: boolean;
}

interface StaffManagementTableProps {
  staff: StaffMember[];
  departments: string[];
  onApprove: (userId: string) => void;
  onDecline: (userId: string) => void;
  onDelete: (userId: string, name: string) => void;
  onEdit: (staff: StaffMember) => void;
  onViewHistory: (userId: string, name: string) => void;
  onReassignDepartment: (staff: StaffMember) => void;
  onSetWorkStatus: (staff: StaffMember) => void;
}

export function StaffManagementTable({
  staff,
  departments,
  onApprove,
  onDecline,
  onDelete,
  onEdit,
  onViewHistory,
  onReassignDepartment,
  onSetWorkStatus,
}: StaffManagementTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterApproval, setFilterApproval] = useState('all');

  const filteredStaff = staff.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.staffNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment =
      filterDepartment === 'all' || s.department === filterDepartment;
    const matchesApproval =
      filterApproval === 'all' ||
      (filterApproval === 'pending' && !s.isApproved) ||
      (filterApproval === 'approved' && s.isApproved);
    return matchesSearch && matchesDepartment && matchesApproval;
  });

  const getWorkStatusBadge = (workStatus: string) => {
    const styles: Record<string, string> = {
      active: 'bg-success/10 text-success',
      'on-leave': 'bg-blue-500/10 text-blue-500',
      'off-duty': 'bg-orange-500/10 text-orange-500',
      'off-work': 'bg-slate-500/10 text-slate-400',
    };
    return styles[workStatus] || styles.active;
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 shadow-lg overflow-hidden">
      <div className="p-6 border-b border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="font-display text-xl font-bold text-white">
            Staff Management
          </h2>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search staff or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>

            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger className="w-40 bg-slate-700/50 border-slate-600 text-white">
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

            <Select value={filterApproval} onValueChange={setFilterApproval}>
              <SelectTrigger className="w-36 bg-slate-700/50 border-slate-600 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-700/50">
            <tr>
              <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">
                Staff Member
              </th>
              <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">
                Staff No.
              </th>
              <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">
                Department
              </th>
              <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">
                Attendance
              </th>
              <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">
                Work Status
              </th>
              <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">
                Hours Today
              </th>
              <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">
                Approval
              </th>
              <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {filteredStaff.map((staff, index) => (
              <tr
                key={staff.id}
                className="hover:bg-slate-700/30 transition-colors animate-fade-in"
                style={{ animationDelay: `${index * 30}ms` }}
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
                      <span className="font-medium text-white block">
                        {staff.name}
                      </span>
                      <span className="text-xs text-slate-400">
                        {staff.email}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span className="font-mono text-sm text-primary font-medium">
                    {staff.staffNumber}
                  </span>
                </td>
                <td className="py-4 px-6 text-slate-400">{staff.department}</td>
                <td className="py-4 px-6">
                  <StatusBadge status={staff.status} showPulse={false} />
                </td>
                <td className="py-4 px-6">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getWorkStatusBadge(
                      staff.workStatus
                    )}`}
                  >
                    {staff.workStatus.replace('-', ' ')}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <span className="font-medium text-white">
                    {staff.hoursToday > 0 ? `${staff.hoursToday}h` : '—'}
                  </span>
                </td>
                <td className="py-4 px-6">
                  {staff.isApproved ? (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                      Approved
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-success hover:text-success hover:bg-success/10"
                        onClick={() => onApprove(staff.user_id)}
                      >
                        <UserCheck className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => onDecline(staff.user_id)}
                      >
                        <UserX className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </td>
                <td className="py-4 px-6">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-white"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => onEdit(staff)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onViewHistory(staff.user_id, staff.name)}>
                        <History className="w-4 h-4 mr-2" />
                        View History
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onReassignDepartment(staff)}>
                        <Building2 className="w-4 h-4 mr-2" />
                        Reassign Dept.
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onSetWorkStatus(staff)}>
                        <Calendar className="w-4 h-4 mr-2" />
                        Set Work Status
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => onDelete(staff.user_id, staff.name)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Staff
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredStaff.length === 0 && (
        <div className="py-12 text-center text-slate-400">
          <p>No staff members found matching your criteria</p>
        </div>
      )}
    </div>
  );
}
