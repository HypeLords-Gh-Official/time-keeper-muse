import { useState } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Briefcase, TreePine, Coffee, Home } from 'lucide-react';

interface StaffMember {
  user_id: string;
  name: string;
  workStatus: string;
}

interface WorkStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffMember | null;
  onSave: (userId: string, workStatus: string) => Promise<void>;
}

const WORK_STATUSES = [
  {
    value: 'active',
    label: 'Active',
    description: 'Staff is currently working or available',
    icon: Briefcase,
    color: 'text-success',
  },
  {
    value: 'on-leave',
    label: 'On Leave',
    description: 'Staff is on approved leave (vacation, sick, etc.)',
    icon: TreePine,
    color: 'text-blue-500',
  },
  {
    value: 'off-duty',
    label: 'Off Duty',
    description: 'Staff is temporarily off duty',
    icon: Coffee,
    color: 'text-orange-500',
  },
  {
    value: 'off-work',
    label: 'Off Work',
    description: 'Staff is no longer working (resigned, terminated)',
    icon: Home,
    color: 'text-slate-400',
  },
];

export function WorkStatusDialog({
  open,
  onOpenChange,
  staff,
  onSave,
}: WorkStatusDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState(staff?.workStatus || 'active');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!staff) return;
    setLoading(true);
    try {
      await onSave(staff.user_id, selectedStatus);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>Set Work Status</DialogTitle>
          <DialogDescription className="text-slate-400">
            Update work status for {staff?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <RadioGroup
            value={selectedStatus}
            onValueChange={setSelectedStatus}
            className="space-y-3"
          >
            {WORK_STATUSES.map((status) => (
              <div
                key={status.value}
                className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                  selectedStatus === status.value
                    ? 'border-primary bg-primary/10'
                    : 'border-slate-600 bg-slate-700/30 hover:bg-slate-700/50'
                }`}
                onClick={() => setSelectedStatus(status.value)}
              >
                <RadioGroupItem
                  value={status.value}
                  id={status.value}
                  className="border-slate-500"
                />
                <Label
                  htmlFor={status.value}
                  className="flex-1 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <status.icon className={`w-4 h-4 ${status.color}`} />
                    <span className="font-medium">{status.label}</span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    {status.description}
                  </p>
                </Label>
              </div>
            ))}
          </RadioGroup>
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
            Update Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
