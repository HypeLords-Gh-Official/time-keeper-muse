import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Building2 } from 'lucide-react';

interface StaffMember {
  user_id: string;
  name: string;
  department: string;
}

interface DepartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffMember | null;
  departments: string[];
  onSave: (userId: string, department: string) => Promise<void>;
}

export function DepartmentDialog({
  open,
  onOpenChange,
  staff,
  departments,
  onSave,
}: DepartmentDialogProps) {
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (staff) {
      setSelectedDepartment(staff.department);
    }
  }, [staff]);

  const handleSave = async () => {
    if (!staff || !selectedDepartment) return;
    setLoading(true);
    try {
      await onSave(staff.user_id, selectedDepartment);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Reassign Department
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Change department for {staff?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label>Current Department</Label>
            <p className="text-slate-400 bg-slate-700/30 px-3 py-2 rounded-md">
              {staff?.department || 'Unassigned'}
            </p>
          </div>

          <div className="space-y-2">
            <Label>New Department</Label>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600">
                <SelectValue placeholder="Select new department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
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
          <Button onClick={handleSave} disabled={loading || !selectedDepartment}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Reassign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
