import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, User, LogOut, Key, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  department: string | null;
  profile_photo_url: string | null;
  qr_code: string;
  staff_number?: string | null;
}

interface SettingsDropdownProps {
  profile: UserProfile | null;
  userRole?: string;
}

export function SettingsDropdown({ profile, userRole }: SettingsDropdownProps) {
  const navigate = useNavigate();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordRequestModal, setShowPasswordRequestModal] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setUserId(session.user.id);
        checkPendingRequest(session.user.id);
      }
    };
    checkUser();
  }, []);

  const checkPendingRequest = async (uid: string) => {
    try {
      const { data } = await supabase
        .from('password_change_requests')
        .select('*')
        .eq('user_id', uid)
        .eq('status', 'pending')
        .maybeSingle();
      setPendingRequest(data);
    } catch (error) {
      console.error('Error checking pending request:', error);
    }
  };

  const handleSubmitPasswordRequest = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for your request');
      return;
    }

    if (!userId) {
      toast.error('User not authenticated');
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
      setShowPasswordRequestModal(false);
      setReason('');
      checkPendingRequest(userId);
    } catch (error: any) {
      console.error('Error submitting request:', error);
      toast.error('Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2">
            <Settings className="w-5 h-5" />
            <span className="text-sm">Settings</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => setShowProfileModal(true)}>
            <User className="w-4 h-4 mr-2" />
            Profile Details
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setShowPasswordRequestModal(true)}
            disabled={!!pendingRequest}
          >
            <Key className="w-4 h-4 mr-2" />
            Request Password Change
            {pendingRequest && (
              <Badge variant="outline" className="ml-auto text-xs bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                Pending
              </Badge>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive">
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Profile Details Modal */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Profile Details</DialogTitle>
            <DialogDescription>Your account information</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Profile Photo */}
            <div className="flex justify-center">
              {profile?.profile_photo_url ? (
                <img
                  src={profile.profile_photo_url}
                  alt={profile.full_name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-primary/20 shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20">
                  <span className="text-3xl font-bold text-primary">
                    {profile?.full_name?.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="space-y-4">
              <div className="p-4 bg-secondary/50 rounded-xl">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Full Name</p>
                <p className="font-medium text-foreground">{profile?.full_name}</p>
              </div>

              {profile?.staff_number && (
                <div className="p-4 bg-primary/10 rounded-xl">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Staff Number</p>
                  <p className="text-xl font-bold text-primary">{profile.staff_number}</p>
                </div>
              )}

              <div className="p-4 bg-secondary/50 rounded-xl">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Email</p>
                <p className="font-medium text-foreground">{profile?.email}</p>
              </div>

              <div className="p-4 bg-secondary/50 rounded-xl">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Department</p>
                <p className="font-medium text-foreground">{profile?.department || 'Not assigned'}</p>
              </div>

              <div className="p-4 bg-secondary/50 rounded-xl">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Role</p>
                <p className="font-medium text-foreground capitalize">{userRole || 'staff'}</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Request Modal */}
      <Dialog open={showPasswordRequestModal} onOpenChange={setShowPasswordRequestModal}>
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
            <Button variant="outline" onClick={() => setShowPasswordRequestModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitPasswordRequest} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
