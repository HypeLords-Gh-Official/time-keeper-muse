import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { TimeDisplay } from '@/components/TimeDisplay';
import { QRScanner } from '@/components/QRScanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { QrCode, Mail, Loader2, Hash } from 'lucide-react';

type LoginMethod = 'email' | 'qr' | 'staffNumber';
type LoginStep = 'method' | 'credentials' | 'scan';

// Helper to log login activity
const logLoginActivity = async (
  userId: string,
  loginMethod: string,
  success: boolean,
  failureReason?: string
) => {
  try {
    await supabase.from('login_activity').insert({
      user_id: userId,
      login_method: loginMethod,
      ip_address: null, // Can't reliably get client IP from browser
      user_agent: navigator.userAgent,
      device_info: `${navigator.platform} - ${navigator.language}`,
      success,
      failure_reason: failureReason,
    });
  } catch (error) {
    console.error('Failed to log login activity:', error);
  }
};

export default function Auth() {
  const navigate = useNavigate();
  const [method, setMethod] = useState<LoginMethod>('email');
  const [step, setStep] = useState<LoginStep>('method');
  const [loading, setLoading] = useState(false);
  
  // Email login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Staff number login
  const [staffNumber, setStaffNumber] = useState('');

  // Check if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        redirectBasedOnRole(session.user.id);
      }
    });
  }, [navigate]);

  const redirectBasedOnRole = async (userId: string) => {
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (roleData?.role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success('Login successful!');
      if (data.session) {
        await logLoginActivity(data.session.user.id, 'email', true);
        await redirectBasedOnRole(data.session.user.id);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleStaffNumberLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Look up email by staff number
      const { data: profile, error: lookupError } = await supabase
        .from('profiles')
        .select('email, is_approved, user_id')
        .eq('staff_number', staffNumber.toUpperCase())
        .maybeSingle();

      if (lookupError) throw lookupError;
      
      if (!profile) {
        toast.error('Invalid staff number');
        setLoading(false);
        return;
      }

      if (!profile.is_approved) {
        toast.error('Your account is pending approval');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password,
      });

      if (error) throw error;

      toast.success('Login successful!');
      if (data.session) {
        await logLoginActivity(data.session.user.id, 'staff_number', true);
        await redirectBasedOnRole(data.session.user.id);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = async (qrToken: string) => {
    setLoading(true);

    try {
      // Call edge function for instant QR login
      const { data, error } = await supabase.functions.invoke('qr-login', {
        body: { qr_token: qrToken },
      });

      if (error) {
        console.error('QR login edge function error:', error);
        toast.error('Failed to verify QR code');
        setStep('method');
        setLoading(false);
        return;
      }

      if (data.error) {
        toast.error(data.error);
        setStep('method');
        setLoading(false);
        return;
      }

      // Verify the OTP using the token hash
      const { data: authData, error: authError } = await supabase.auth.verifyOtp({
        email: data.email,
        token: data.token_hash,
        type: 'magiclink',
      });

      if (authError) {
        console.error('OTP verification error:', authError);
        toast.error('Login verification failed');
        setStep('method');
        setLoading(false);
        return;
      }

      toast.success(`Welcome back, ${data.full_name}!`);
      
      // Log login activity for QR login
      if (authData.session) {
        await logLoginActivity(authData.session.user.id, 'qr', true);
      }
      
      // Redirect based on role
      if (data.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('QR scan error:', error);
      toast.error('Failed to verify QR code');
      setStep('method');
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
                  <span className="text-xs text-muted-foreground ml-auto">Instant</span>
                </Button>

                <Button
                  onClick={() => {
                    setMethod('staffNumber');
                    setStep('credentials');
                  }}
                  variant="outline"
                  className="w-full h-16 text-lg gap-3"
                >
                  <Hash className="w-6 h-6" />
                  Use Staff Number
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
          <p>© 2026 Nkyinkyim Museum | Ancestor Project | All Rights Reserved | Powered by HypeLords Technology</p>
        </footer>
      </div>
    );
  }

  // QR Scanning screen
  if (step === 'scan') {
    return (
      <QRScanner
        onScan={handleQRScan}
        onCancel={() => {
          setStep('method');
          setLoading(false);
        }}
      />
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
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Sign In
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
          <p>© 2026 Nkyinkyim Museum | Ancestor Project | All Rights Reserved | Powered by HypeLords Technology</p>
        </footer>
      </div>
    );
  }

  // Staff Number credentials screen
  if (step === 'credentials' && method === 'staffNumber') {
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
                  <Hash className="w-7 h-7 text-primary" />
                </div>
                <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                  Staff Number Login
                </h1>
                <p className="text-muted-foreground">
                  Enter your staff number and password
                </p>
              </div>

              <form onSubmit={handleStaffNumberLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="staffNumber">Staff Number</Label>
                  <Input
                    id="staffNumber"
                    type="text"
                    placeholder="e.g. STF001"
                    value={staffNumber}
                    onChange={(e) => setStaffNumber(e.target.value)}
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
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Sign In
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
          <p>© 2026 Nkyinkyim Museum | Ancestor Project | All Rights Reserved | Powered by HypeLords Technology</p>
        </footer>
      </div>
    );
  }

  return null;
}
