import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, Building2, Loader2 } from 'lucide-react';

interface Department {
  id: string;
  name: string;
  created_at: string;
}

interface DepartmentManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDepartmentsChange?: () => void;
}

export function DepartmentManagement({
  open,
  onOpenChange,
  onDepartmentsChange,
}: DepartmentManagementProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [newDepartment, setNewDepartment] = useState('');
  const [adding, setAdding] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; department: Department | null }>({
    open: false,
    department: null,
  });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchDepartments();
    }
  }, [open]);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDepartment = async () => {
    if (!newDepartment.trim()) {
      toast.error('Please enter a department name');
      return;
    }

    setAdding(true);
    try {
      const { error } = await supabase
        .from('departments')
        .insert({ name: newDepartment.trim() });

      if (error) {
        if (error.code === '23505') {
          toast.error('This department already exists');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Department added successfully');
      setNewDepartment('');
      fetchDepartments();
      onDepartmentsChange?.();
    } catch (error) {
      console.error('Error adding department:', error);
      toast.error('Failed to add department');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteDepartment = async () => {
    if (!deleteDialog.department) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', deleteDialog.department.id);

      if (error) throw error;

      toast.success('Department deleted successfully');
      setDeleteDialog({ open: false, department: null });
      fetchDepartments();
      onDepartmentsChange?.();
    } catch (error) {
      console.error('Error deleting department:', error);
      toast.error('Failed to delete department');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Manage Departments
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Add or remove departments from your organization
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Add new department */}
            <div className="flex gap-2">
              <Input
                placeholder="Enter new department name"
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddDepartment()}
                className="bg-slate-700/50 border-slate-600"
              />
              <Button
                onClick={handleAddDepartment}
                disabled={adding || !newDepartment.trim()}
                size="icon"
              >
                {adding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Department list */}
            <div className="max-h-64 overflow-y-auto space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : departments.length === 0 ? (
                <p className="text-center text-slate-400 py-8">No departments found</p>
              ) : (
                departments.map((dept) => (
                  <div
                    key={dept.id}
                    className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
                  >
                    <span className="text-slate-200">{dept.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteDialog({ open: true, department: dept })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-600 text-slate-300"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, department: open ? deleteDialog.department : null })}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Department</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete "{deleteDialog.department?.name}"? Staff members in this department won't be affected but will show as "Unassigned".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-600 text-slate-300">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDepartment}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
