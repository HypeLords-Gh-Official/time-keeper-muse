import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QRScannerProps {
  onScan: (qrCode: string) => void;
  onCancel: () => void;
}

export function QRScanner({ onScan, onCancel }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);

  useEffect(() => {
    const scannerId = 'qr-scanner-element';
    
    const startScanner = async () => {
      try {
        scannerRef.current = new Html5Qrcode(scannerId);
        
        await scannerRef.current.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            // Stop scanner and trigger callback
            if (scannerRef.current) {
              scannerRef.current.stop().then(() => {
                onScan(decodedText);
              });
            }
          },
          () => {
            // Ignore scan failures (expected when no QR code visible)
          }
        );
        
        setIsStarting(false);
      } catch (err) {
        console.error('QR Scanner error:', err);
        setError('Unable to start QR scanner. Please ensure camera permissions are granted.');
        setIsStarting(false);
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {
          // Ignore errors during cleanup
        });
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card rounded-3xl shadow-elevated border p-6 w-full max-w-md animate-scale-in">
        <div className="text-center mb-6">
          <h2 className="font-display text-xl font-bold text-foreground">Scan QR Code</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Position your staff QR code within the frame
          </p>
        </div>

        <div className="relative aspect-square bg-muted rounded-2xl overflow-hidden mb-6">
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
              <QrCode className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          ) : (
            <>
              <div id="qr-scanner-element" className="w-full h-full" />
              {isStarting && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </>
          )}
        </div>

        <Button onClick={onCancel} variant="outline" className="w-full gap-2">
          <X className="w-4 h-4" />
          Cancel
        </Button>
      </div>
    </div>
  );
}
