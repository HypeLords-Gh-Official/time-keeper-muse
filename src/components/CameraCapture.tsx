import { useState, useRef, useCallback } from 'react';
import { Camera, RotateCcw, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CameraCaptureProps {
  onCapture: (imageBlob: Blob) => void;
  onCancel: () => void;
  title?: string;
  description?: string;
}

export function CameraCapture({ onCapture, onCancel, title = "Take Photo", description }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError('Unable to access camera. Please ensure camera permissions are granted.');
      console.error('Camera error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageData);
    stopCamera();
  }, [stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const confirmPhoto = useCallback(() => {
    if (!capturedImage) return;

    // Convert data URL to Blob
    fetch(capturedImage)
      .then((res) => res.blob())
      .then((blob) => {
        onCapture(blob);
      });
  }, [capturedImage, onCapture]);

  const handleCancel = useCallback(() => {
    stopCamera();
    onCancel();
  }, [stopCamera, onCancel]);

  // Start camera on mount
  useState(() => {
    startCamera();
  });

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card rounded-3xl shadow-elevated border p-6 w-full max-w-md animate-scale-in">
        <div className="text-center mb-6">
          <h2 className="font-display text-xl font-bold text-foreground">{title}</h2>
          {description && <p className="text-muted-foreground text-sm mt-1">{description}</p>}
        </div>

        <div className="relative aspect-[4/3] bg-muted rounded-2xl overflow-hidden mb-6">
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
              <Camera className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-sm text-destructive">{error}</p>
              <Button onClick={startCamera} variant="outline" size="sm" className="mt-4">
                Try Again
              </Button>
            </div>
          ) : capturedImage ? (
            <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                onLoadedMetadata={() => setIsLoading(false)}
              />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {/* Face guide overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-56 border-2 border-dashed border-primary/50 rounded-full" />
              </div>
            </>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <div className="flex gap-3">
          {capturedImage ? (
            <>
              <Button onClick={retakePhoto} variant="outline" className="flex-1 gap-2">
                <RotateCcw className="w-4 h-4" />
                Retake
              </Button>
              <Button onClick={confirmPhoto} className="flex-1 gap-2 gradient-primary text-primary-foreground">
                <Check className="w-4 h-4" />
                Use Photo
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleCancel} variant="outline" className="flex-1 gap-2">
                <X className="w-4 h-4" />
                Cancel
              </Button>
              <Button
                onClick={capturePhoto}
                disabled={isLoading || !!error}
                className="flex-1 gap-2 gradient-primary text-primary-foreground"
              >
                <Camera className="w-4 h-4" />
                Capture
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
