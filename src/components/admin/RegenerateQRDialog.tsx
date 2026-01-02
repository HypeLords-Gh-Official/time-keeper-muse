import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { generateQRCode, generateQRToken } from '@/lib/qrcode';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QrCode, RefreshCw, AlertTriangle } from 'lucide-react';

interface RegenerateQRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  staffName: string;
  onSuccess?: () => void;
}

export function RegenerateQRDialog({
  open,
  onOpenChange,
  userId,
  staffName,
  onSuccess,
}: RegenerateQRDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleRegenerate = async () => {
    setLoading(true);
    try {
      // Generate new QR code and token
      const newQRCode = generateQRCode(userId);
      const newQRToken = generateQRToken();

      // Update the profile
      const { error } = await supabase
        .from('profiles')
        .update({
          qr_code: newQRCode,
          qr_token: newQRToken,
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('QR code regenerated successfully', {
        description: `A new QR code has been created for ${staffName}`,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error regenerating QR code:', error);
      toast.error('Failed to regenerate QR code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            Regenerate QR Code
          </DialogTitle>
          <DialogDescription>
            Generate a new QR code for {staffName}
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-warning mb-1">Important</p>
              <p className="text-muted-foreground">
                This will invalidate the current QR code. The staff member will need to use their 
                new QR code for future logins. Their old QR code will no longer work.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRegenerate}
            disabled={loading}
            className="bg-primary hover:bg-primary/90"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate QR Code
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
