import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QRCodeDisplayProps {
  value: string;
  userName: string;
  size?: number;
}

export function QRCodeDisplay({ value, userName, size = 200 }: QRCodeDisplayProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateQR = async () => {
      try {
        const url = await QRCode.toDataURL(value, {
          width: size,
          margin: 2,
          color: {
            dark: '#1a1a1a',
            light: '#ffffff',
          },
        });
        setQrDataUrl(url);
      } catch (err) {
        console.error('QR generation error:', err);
        setError('Failed to generate QR code');
      }
    };

    generateQR();
  }, [value, size]);

  const handleDownload = () => {
    if (!qrDataUrl) return;

    const link = document.createElement('a');
    link.download = `${userName.replace(/\s+/g, '_')}_QR_Code.png`;
    link.href = qrDataUrl;
    link.click();
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-muted rounded-2xl">
        <QrCode className="w-12 h-12 text-muted-foreground mb-3" />
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (!qrDataUrl) {
    return (
      <div className="flex items-center justify-center p-8 bg-muted rounded-2xl" style={{ width: size, height: size }}>
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="bg-white p-4 rounded-2xl shadow-md">
        <img src={qrDataUrl} alt={`QR Code for ${userName}`} width={size} height={size} />
      </div>
      <p className="text-sm text-muted-foreground mt-3 text-center">
        Scan this code to log in
      </p>
      <Button onClick={handleDownload} variant="outline" size="sm" className="mt-3 gap-2">
        <Download className="w-4 h-4" />
        Download QR Code
      </Button>
    </div>
  );
}
