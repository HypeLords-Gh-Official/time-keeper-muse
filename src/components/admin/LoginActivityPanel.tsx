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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
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
  Download,
  FileText,
  FileSpreadsheet,
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
  const [allActivities, setAllActivities] = useState<LoginActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('7days');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  const getDateRange = () => {
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
    return startDate;
  };

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const startDate = getDateRange();

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

  const fetchAllForExport = async (): Promise<LoginActivity[]> => {
    const startDate = getDateRange();

    let query = supabase
      .from('login_activity')
      .select('*')
      .gte('login_at', startDate.toISOString())
      .order('login_at', { ascending: false });

    if (methodFilter !== 'all') {
      query = query.eq('login_method', methodFilter);
    }

    const { data: loginData, error } = await query;

    if (error) throw error;

    if (loginData && loginData.length > 0) {
      const userIds = [...new Set(loginData.map(a => a.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, staff_number')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return loginData.map(activity => ({
        ...activity,
        profile: profileMap.get(activity.user_id) || undefined,
      }));
    }

    return [];
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

  const exportToCSV = async () => {
    setExporting(true);
    try {
      const data = await fetchAllForExport();
      
      const headers = ['Staff Name', 'Staff Number', 'Email', 'Login Method', 'Device', 'Date', 'Time', 'Status'];
      const rows = data.map(activity => [
        activity.profile?.full_name || 'Unknown',
        activity.profile?.staff_number || '-',
        activity.profile?.email || '-',
        getMethodLabel(activity.login_method),
        activity.device_info || 'Unknown device',
        format(new Date(activity.login_at), 'yyyy-MM-dd'),
        format(new Date(activity.login_at), 'HH:mm:ss'),
        activity.success ? 'Success' : 'Failed',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `login-activity-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('CSV exported successfully');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = async () => {
    setExporting(true);
    try {
      const data = await fetchAllForExport();
      
      // Create PDF content as HTML and open in new window for printing
      const dateRange = dateFilter === 'today' ? 'Today' : 
                        dateFilter === '7days' ? 'Last 7 Days' :
                        dateFilter === '30days' ? 'Last 30 Days' : 'All Time';
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Login Activity Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #1e293b; margin-bottom: 5px; }
            .subtitle { color: #64748b; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 12px; }
            th { background-color: #f1f5f9; font-weight: 600; color: #334155; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .success { color: #16a34a; font-weight: 500; }
            .failed { color: #dc2626; font-weight: 500; }
            .footer { margin-top: 20px; font-size: 11px; color: #94a3b8; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Login Activity Report</h1>
          <p class="subtitle">Date Range: ${dateRange} | Generated: ${format(new Date(), 'MMM d, yyyy h:mm a')}</p>
          <table>
            <thead>
              <tr>
                <th>Staff Name</th>
                <th>Staff Number</th>
                <th>Login Method</th>
                <th>Device</th>
                <th>Date & Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(activity => `
                <tr>
                  <td>${activity.profile?.full_name || 'Unknown'}</td>
                  <td>${activity.profile?.staff_number || '-'}</td>
                  <td>${getMethodLabel(activity.login_method)}</td>
                  <td>${activity.device_info || 'Unknown device'}</td>
                  <td>${format(new Date(activity.login_at), 'MMM d, yyyy h:mm a')}</td>
                  <td class="${activity.success ? 'success' : 'failed'}">${activity.success ? 'Success' : 'Failed'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <p class="footer">Total records: ${data.length}</p>
          <button class="no-print" onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; cursor: pointer;">Print / Save as PDF</button>
        </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        toast.success('PDF report opened in new tab');
      } else {
        toast.error('Please allow popups to export PDF');
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    } finally {
      setExporting(false);
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
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={exporting || loading}
                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                {exporting ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-800 border-slate-600">
              <DropdownMenuItem onClick={exportToCSV} className="text-slate-200 hover:bg-slate-700">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToPDF} className="text-slate-200 hover:bg-slate-700">
                <FileText className="w-4 h-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
