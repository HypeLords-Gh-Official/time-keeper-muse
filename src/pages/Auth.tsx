import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { TimeDisplay } from '@/components/TimeDisplay';
import { CameraCapture } from '@/components/CameraCapture';
import { QRScanner } from '@/components/QRScanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { QrCode, Mail, Loader2, Camera, UserPlus } from 'lucide-react';

type LoginMethod = 'email' | 'qr';
type LoginStep = 'method' | 'credentials' | 'scan' | 'photo';

export default function Auth() {
  const navigate = useNavigate();
  const [method, setMethod] = useState<LoginMethod>('email');
  const [step, setStep] = useState<LoginStep>('method');
  const [loading, setLoading] = useState(false);
  
  // Email login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // QR login
  const [scannedUserId, setScannedUserId] = useState<string | null>(null);
  const [scannedQRCode, setScannedQRCode] = useState<string | null>(null);

  // Check if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard');
      }
    });
  }, [navigate]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Move to photo verification
      setStep('photo');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = async (qrCode: string) => {
    setLoading(true);
    setScannedQRCode(qrCode);

    try {
      // Look up user by QR code
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, is_approved')
        .eq('qr_code', qrCode)
        .maybeSingle();

      if (error) throw error;
      
      if (!profile) {
        toast.error('Invalid QR code');
        setStep('method');
        return;
      }

      if (!profile.is_approved) {
        toast.error('Your account is pending approval');
        setStep('method');
        return;
      }

      setScannedUserId(profile.user_id);
      // Move to photo verification
      setStep('photo');
    } catch (error: any) {
      console.error('QR scan error:', error);
      toast.error('Failed to verify QR code');
      setStep('method');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoVerification = async (photoBlob: Blob) => {
    setLoading(true);

    try {
      // Get current session or use scanned user ID
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || scannedUserId;

      if (!userId) {
        throw new Error('No user found');
      }

      // Upload verification photo
      const photoPath = `${userId}/verification_${Date.now()}.jpg`;
      await supabase.storage
        .from('profile-photos')
        .upload(photoPath, photoBlob, {
          contentType: 'image/jpeg',
        });

      const { data: urlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(photoPath);

      // Log the verification
      await supabase.from('login_verifications').insert({
        user_id: userId,
        verification_photo_url: urlData?.publicUrl || '',
        user_agent: navigator.userAgent,
      });

      // If QR login, we need to get the user's credentials somehow
      // For now, we'll use a magic link approach or require password after QR
      if (method === 'qr' && !session) {
        // For QR login, redirect to a special auth flow
        toast.success('Photo verified! Please enter your password to complete login.');
        setStep('credentials');
        return;
      }

      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Photo verification error:', error);
      toast.error('Verification failed');
      setStep('method');
    } finally {
      setLoading(false);
    }
  };

  const handleQRPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get the user's email from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('qr_code', scannedQRCode)
        .single();

      if (!profile) throw new Error('User not found');

      const { error } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password,
      });

      if (error) throw error;

      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Method selection screen
  if (step === 'method') {
    return (
      <div className="min-h-screen gradient-warm pattern-adinkra flex flex-col">
        <header className="p-6">
          <Logo size="md" />
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4 pb-12">
          <div className="w-full max-w-md animate-fade-in">
            <div className="mb-12">
              <TimeDisplay size="lg" />
            </div>

            <div className="bg-card rounded-3xl shadow-elevated border p-8 animate-slide-up">
              <div className="text-center mb-8">
                <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                  Staff Login
                </h1>
                <p className="text-muted-foreground">
                  Choose how you'd like to sign in
                </p>
              </div>

              <div className="space-y-4">
                <Button
                  onClick={() => {
                    setMethod('qr');
                    setStep('scan');
                  }}
                  variant="outline"
                  className="w-full h-16 text-lg gap-3"
                >
                  <QrCode className="w-6 h-6" />
                  Scan QR Code
                </Button>

                <Button
                  onClick={() => {
                    setMethod('email');
                    setStep('credentials');
                  }}
                  className="w-full h-16 text-lg gap-3 gradient-primary text-primary-foreground"
                >
                  <Mail className="w-6 h-6" />
                  Sign in with Email
                </Button>
              </div>

              <div className="mt-8 text-center">
                <p className="text-sm text-muted-foreground">
                  New staff member?{' '}
                  <Link to="/register" className="text-primary hover:underline font-medium">
                    Register here
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </main>

        <footer className="p-6 text-center text-sm text-muted-foreground">
          <p>© 2024 Nkyinkyim Museum. All rights reserved.</p>
        </footer>
      </div>
    );
  }

  // Email credentials screen
  if (step === 'credentials' && method === 'email') {
    return (
      <div className="min-h-screen gradient-warm pattern-adinkra flex flex-col">
        <header className="p-6">
          <Logo size="md" />
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4 pb-12">
          <div className="w-full max-w-md animate-fade-in">
            <div className="bg-card rounded-3xl shadow-elevated border p-8 animate-slide-up">
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-7 h-7 text-primary" />
                </div>
                <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                  Email Login
                </h1>
                <p className="text-muted-foreground">
                  Enter your credentials to continue
                </p>
              </div>

              <form onSubmit={handleEmailLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full gap-2 gradient-primary text-primary-foreground"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                  Continue to Photo Verification
                </Button>
              </form>

              <Button
                onClick={() => setStep('method')}
                variant="ghost"
                className="w-full mt-4"
              >
                Back to login options
              </Button>
            </div>
          </div>
        </main>

        <footer className="p-6 text-center text-sm text-muted-foreground">
          <p>© 2024 Nkyinkyim Museum. All rights reserved.</p>
        </footer>
      </div>
    );
  }

  // QR Password screen (after photo verification for QR login)
  if (step === 'credentials' && method === 'qr') {
    return (
      <div className="min-h-screen gradient-warm pattern-adinkra flex flex-col">
        <header className="p-6">
          <Logo size="md" />
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4 pb-12">
          <div className="w-full max-w-md animate-fade-in">
            <div className="bg-card rounded-3xl shadow-elevated border p-8 animate-slide-up">
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-7 h-7 text-success" />
                </div>
                <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                  Photo Verified!
                </h1>
                <p className="text-muted-foreground">
                  Enter your password to complete login
                </p>
              </div>

              <form onSubmit={handleQRPasswordLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full gap-2 gradient-primary text-primary-foreground"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Complete Login
                </Button>
              </form>

              <Button
                onClick={() => setStep('method')}
                variant="ghost"
                className="w-full mt-4"
              >
                Cancel
              </Button>
            </div>
          </div>
        </main>

        <footer className="p-6 text-center text-sm text-muted-foreground">
          <p>© 2024 Nkyinkyim Museum. All rights reserved.</p>
        </footer>
      </div>
    );
  }

  // QR Scanner screen
  if (step === 'scan') {
    return (
      <QRScanner
        onScan={handleQRScan}
        onCancel={() => setStep('method')}
      />
    );
  }

  // Photo verification screen
  if (step === 'photo') {
    return (
      <CameraCapture
        onCapture={handlePhotoVerification}
        onCancel={() => setStep('method')}
        title="Photo Verification"
        description="Take a photo to verify your identity"
      />
    );
  }

  return null;
}
