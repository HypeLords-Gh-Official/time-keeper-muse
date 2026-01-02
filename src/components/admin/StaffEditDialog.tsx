import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface StaffMember {
  id: string;
  user_id: string;
  name: string;
  email: string;
  department: string;
  staffNumber: string;
}

interface StaffEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffMember | null;
  departments: string[];
  onSave: (userId: string, data: { full_name: string; email: string; department: string; staff_number: string }) => Promise<void>;
}

const DEPARTMENTS = [
  'Administration',
  'Human Resources',
  'Finance',
  'Operations',
  'Marketing',
  'Sales',
  'IT',
  'Customer Service',
  'Research & Development',
  'Legal',
];

export function StaffEditDialog({
  open,
  onOpenChange,
  staff,
  onSave,
}: StaffEditDialogProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [staffNumber, setStaffNumber] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (staff) {
      setFullName(staff.name);
      setEmail(staff.email);
      setDepartment(staff.department);
      setStaffNumber(staff.staffNumber);
    }
  }, [staff]);

  const handleSave = async () => {
    if (!staff) return;
    setLoading(true);
    try {
      await onSave(staff.user_id, {
        full_name: fullName,
        email,
        department,
        staff_number: staffNumber,
      });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>Edit Staff Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="bg-slate-700/50 border-slate-600"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-700/50 border-slate-600"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="staffNumber">Staff Number</Label>
            <Input
              id="staffNumber"
              value={staffNumber}
              onChange={(e) => setStaffNumber(e.target.value)}
              className="bg-slate-700/50 border-slate-600 font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label>Department</Label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-600 text-slate-300"
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
