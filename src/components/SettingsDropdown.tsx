import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, User, LogOut } from 'lucide-react';
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
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

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
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setShowProfileModal(true)}>
            <User className="w-4 h-4 mr-2" />
            Profile Details
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
    </>
  );
}
