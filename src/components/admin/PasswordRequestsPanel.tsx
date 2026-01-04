import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Key, Check, X, Loader2, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface PasswordRequest {
  id: string;
  user_id: string;
  status: string;
  reason: string | null;
  requested_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  admin_notes: string | null;
  user_name?: string;
  user_email?: string;
}

export function PasswordRequestsPanel() {
  const [requests, setRequests] = useState<PasswordRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<PasswordRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data: requestsData, error } = await supabase
        .from('password_change_requests')
        .select('*')
        .order('requested_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles for each request
      const requestsWithUsers = await Promise.all(
        (requestsData || []).map(async (request) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('user_id', request.user_id)
            .single();

          return {
            ...request,
            user_name: profile?.full_name || 'Unknown',
            user_email: profile?.email || 'Unknown',
          };
        })
      );

      setRequests(requestsWithUsers);
    } catch (error: any) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load password requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = (request: PasswordRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(action);
    setAdminNotes('');
  };

  const processRequest = async () => {
    if (!selectedRequest || !actionType) return;

    setProcessing(selectedRequest.id);
    try {
      const { data, error } = await supabase.functions.invoke('process-password-request', {
        body: {
          requestId: selectedRequest.id,
          action: actionType,
          adminNotes: adminNotes || undefined,
        },
      });

      if (error) throw error;

      toast.success(data.message);
      fetchRequests();
      setSelectedRequest(null);
      setActionType(null);
    } catch (error: any) {
      console.error('Error processing request:', error);
      toast.error(error.message || 'Failed to process request');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Password Change Requests</CardTitle>
            {pendingCount > 0 && (
              <Badge variant="destructive">{pendingCount} pending</Badge>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={fetchRequests} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : requests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No password change requests</p>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border bg-card"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{request.user_name}</span>
                      {getStatusBadge(request.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{request.user_email}</p>
                    {request.reason && (
                      <p className="text-sm mt-2">
                        <span className="text-muted-foreground">Reason: </span>
                        {request.reason}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Requested: {format(new Date(request.requested_at), 'MMM d, yyyy h:mm a')}
                    </p>
                    {request.admin_notes && (
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="font-medium">Admin notes: </span>
                        {request.admin_notes}
                      </p>
                    )}
                  </div>
                  {request.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 hover:bg-green-500/10"
                        onClick={() => handleAction(request, 'approve')}
                        disabled={processing === request.id}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-500/10"
                        onClick={() => handleAction(request, 'reject')}
                        disabled={processing === request.id}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedRequest && !!actionType} onOpenChange={() => { setSelectedRequest(null); setActionType(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve' : 'Reject'} Password Request
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              {actionType === 'approve'
                ? `This will send a password reset email to ${selectedRequest?.user_email}.`
                : `This will reject the password change request from ${selectedRequest?.user_name}.`}
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Admin Notes (optional)</label>
              <Textarea
                placeholder="Add any notes about this decision..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSelectedRequest(null); setActionType(null); }}>
              Cancel
            </Button>
            <Button
              variant={actionType === 'approve' ? 'default' : 'destructive'}
              onClick={processRequest}
              disabled={!!processing}
            >
              {processing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : actionType === 'approve' ? (
                <Check className="w-4 h-4 mr-2" />
              ) : (
                <X className="w-4 h-4 mr-2" />
              )}
              {actionType === 'approve' ? 'Approve & Send Reset Email' : 'Reject Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
