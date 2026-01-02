import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Filter,
  RefreshCw,
  Monitor,
  Smartphone,
  Globe,
  QrCode,
  Mail,
  CreditCard,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface LoginActivity {
  id: string;
  user_id: string;
  login_method: string;
  ip_address: string | null;
  user_agent: string | null;
  device_info: string | null;
  login_at: string;
  success: boolean;
  failure_reason: string | null;
  profile?: {
    full_name: string;
    email: string;
    staff_number: string | null;
  };
}

export function LoginActivityPanel() {
  const [activities, setActivities] = useState<LoginActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('7days');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  const fetchActivities = async () => {
    setLoading(true);
    try {
      // Calculate date range
      let startDate = new Date();
      switch (dateFilter) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case '7days':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30days':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case 'all':
          startDate = new Date('2020-01-01');
          break;
      }

      // Fetch login activities
      let query = supabase
        .from('login_activity')
        .select('*', { count: 'exact' })
        .gte('login_at', startDate.toISOString())
        .order('login_at', { ascending: false });

      if (methodFilter !== 'all') {
        query = query.eq('login_method', methodFilter);
      }

      const { data: loginData, error, count } = await query
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (error) throw error;

      // Fetch profiles for users
      if (loginData && loginData.length > 0) {
        const userIds = [...new Set(loginData.map(a => a.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, email, staff_number')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        const enrichedActivities = loginData.map(activity => ({
          ...activity,
          profile: profileMap.get(activity.user_id) || undefined,
        }));

        setActivities(enrichedActivities);
      } else {
        setActivities([]);
      }

      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching login activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [methodFilter, dateFilter, page]);

  const filteredActivities = activities.filter(activity => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      activity.profile?.full_name?.toLowerCase().includes(query) ||
      activity.profile?.email?.toLowerCase().includes(query) ||
      activity.profile?.staff_number?.toLowerCase().includes(query) ||
      activity.device_info?.toLowerCase().includes(query)
    );
  });

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'qr':
        return <QrCode className="w-4 h-4" />;
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'staff_number':
        return <CreditCard className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'qr':
        return 'QR Code';
      case 'email':
        return 'Email';
      case 'staff_number':
        return 'Staff ID';
      default:
        return method;
    }
  };

  const getDeviceIcon = (userAgent: string | null) => {
    if (!userAgent) return <Globe className="w-4 h-4 text-muted-foreground" />;
    if (userAgent.toLowerCase().includes('mobile')) {
      return <Smartphone className="w-4 h-4 text-muted-foreground" />;
    }
    return <Monitor className="w-4 h-4 text-muted-foreground" />;
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Login Activity</h2>
          <p className="text-sm text-slate-400">Track staff login history and patterns</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchActivities}
          disabled={loading}
          className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name, email, or staff number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
          />
        </div>

        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="w-full md:w-40 bg-slate-800 border-slate-600 text-white">
            <Filter className="w-4 h-4 mr-2 text-slate-400" />
            <SelectValue placeholder="Method" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600">
            <SelectItem value="all">All Methods</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="qr">QR Code</SelectItem>
            <SelectItem value="staff_number">Staff ID</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateFilter} onValueChange={(v) => { setDateFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full md:w-40 bg-slate-800 border-slate-600 text-white">
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-600">
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="7days">Last 7 Days</SelectItem>
            <SelectItem value="30days">Last 30 Days</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700 hover:bg-transparent">
              <TableHead className="text-slate-300">Staff Member</TableHead>
              <TableHead className="text-slate-300">Method</TableHead>
              <TableHead className="text-slate-300">Device</TableHead>
              <TableHead className="text-slate-300">Date & Time</TableHead>
              <TableHead className="text-slate-300">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredActivities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                  No login activity found
                </TableCell>
              </TableRow>
            ) : (
              filteredActivities.map((activity) => (
                <TableRow key={activity.id} className="border-slate-700 hover:bg-slate-700/50">
                  <TableCell>
                    <div>
                      <p className="font-medium text-white">
                        {activity.profile?.full_name || 'Unknown'}
                      </p>
                      <p className="text-sm text-slate-400">
                        {activity.profile?.staff_number || activity.profile?.email || '-'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getMethodIcon(activity.login_method)}
                      <span className="text-slate-300">{getMethodLabel(activity.login_method)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getDeviceIcon(activity.user_agent)}
                      <span className="text-sm text-slate-400 truncate max-w-[150px]">
                        {activity.device_info || 'Unknown device'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-slate-300">
                        {format(new Date(activity.login_at), 'MMM d, yyyy')}
                      </p>
                      <p className="text-sm text-slate-400">
                        {format(new Date(activity.login_at), 'h:mm a')}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {activity.success ? (
                      <Badge className="bg-success/20 text-success border-success/30">
                        Success
                      </Badge>
                    ) : (
                      <Badge className="bg-destructive/20 text-destructive border-destructive/30">
                        Failed
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} entries
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-slate-300">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
