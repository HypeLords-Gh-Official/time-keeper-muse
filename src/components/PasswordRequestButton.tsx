import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Key, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface PasswordRequestButtonProps {
  userId: string;
}

export function PasswordRequestButton({ userId }: PasswordRequestButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkPendingRequest();
  }, [userId]);

  const checkPendingRequest = async () => {
    try {
      const { data, error } = await supabase
        .from('password_change_requests')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .maybeSingle();

      if (error) throw error;
      setPendingRequest(data);
    } catch (error) {
      console.error('Error checking pending request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for your request');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('password_change_requests')
        .insert({
          user_id: userId,
          reason: reason.trim(),
        });

      if (error) throw error;

      toast.success('Password change request submitted successfully');
      setOpen(false);
      setReason('');
      checkPendingRequest();
    } catch (error: any) {
      console.error('Error submitting request:', error);
      toast.error('Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return null;
  }

  if (pendingRequest) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
          <Key className="w-3 h-3 mr-1" />
          Password request pending
        </Badge>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Key className="w-4 h-4 mr-2" />
          Request Password Change
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Password Change</DialogTitle>
          <DialogDescription>
            Submit a request to change your password. An administrator will review your request and send you a password reset email if approved.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Reason for Request</label>
            <Textarea
              placeholder="Please explain why you need to change your password..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
