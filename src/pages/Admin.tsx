import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Users,
  Clock,
  BarChart3,
  Settings,
  Download,
  Search,
  Filter,
  ChevronDown,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Mock data for admin dashboard
const MOCK_STAFF_ATTENDANCE = [
  {
    id: '1',
    name: 'Kwame Asante',
    department: 'Tours',
    status: 'clocked-in' as const,
    activity: 'Guided Tour',
    clockInTime: '08:00 AM',
    hoursToday: 4.5,
  },
  {
    id: '2',
    name: 'Akua Mensah',
    department: 'Exhibitions',
    status: 'clocked-in' as const,
    activity: 'Exhibition Setup',
    clockInTime: '07:30 AM',
    hoursToday: 5.0,
  },
  {
    id: '3',
    name: 'Yaw Boateng',
    department: 'Maintenance',
    status: 'on-break' as const,
    activity: 'Break',
    clockInTime: '08:15 AM',
    hoursToday: 4.25,
  },
  {
    id: '4',
    name: 'Ama Darko',
    department: 'Administration',
    status: 'clocked-out' as const,
    activity: 'N/A',
    clockInTime: '—',
    hoursToday: 0,
  },
  {
    id: '5',
    name: 'Kofi Owusu',
    department: 'Administration',
    status: 'clocked-in' as const,
    activity: 'Administrative',
    clockInTime: '09:00 AM',
    hoursToday: 3.5,
  },
];

const STATS = [
  {
    label: 'Staff Present',
    value: '12',
    total: '/15',
    icon: Users,
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  {
    label: 'On Break',
    value: '2',
    icon: Clock,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
  {
    label: 'Late Today',
    value: '1',
    icon: AlertCircle,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
  },
  {
    label: 'Avg. Hours',
    value: '6.2h',
    icon: TrendingUp,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
];

export default function Admin() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');

  const filteredStaff = MOCK_STAFF_ATTENDANCE.filter((staff) => {
    const matchesSearch = staff.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment =
      filterDepartment === 'all' || staff.department === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  const departments = [...new Set(MOCK_STAFF_ATTENDANCE.map((s) => s.department))];

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
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Report
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
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {staff.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </span>
                        </div>
                        <span className="font-medium text-foreground">{staff.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-muted-foreground">{staff.department}</td>
                    <td className="py-4 px-6">
                      <StatusBadge status={staff.status} showPulse={false} />
                    </td>
                    <td className="py-4 px-6 text-foreground">{staff.activity}</td>
                    <td className="py-4 px-6 text-muted-foreground">{staff.clockInTime}</td>
                    <td className="py-4 px-6">
                      <span className="font-medium text-foreground">
                        {staff.hoursToday > 0 ? `${staff.hoursToday}h` : '—'}
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
