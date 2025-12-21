import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { PinInput } from '@/components/PinInput';
import { TimeDisplay } from '@/components/TimeDisplay';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function Login() {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handlePinComplete = async (pin: string) => {
    setLoading(true);
    setError(false);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const success = await login(pin);
    setLoading(false);

    if (success) {
      toast.success('Welcome back!', {
        description: 'You have successfully logged in.',
      });
      navigate('/dashboard');
    } else {
      setError(true);
      toast.error('Invalid PIN', {
        description: 'Please check your PIN and try again.',
      });
    }
  };

  return (
    <div className="min-h-screen gradient-warm pattern-adinkra flex flex-col">
      {/* Header */}
      <header className="p-6">
        <Logo size="md" />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md animate-fade-in">
          {/* Time Display */}
          <div className="mb-12">
            <TimeDisplay size="lg" />
          </div>

          {/* Login Card */}
          <div className="bg-card rounded-3xl shadow-elevated border p-8 animate-slide-up">
            <div className="text-center mb-8">
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                Staff Login
              </h1>
              <p className="text-muted-foreground">
                Enter your 4-digit PIN to clock in
              </p>
            </div>

            <div className="relative">
              <PinInput
                onComplete={handlePinComplete}
                error={error}
                disabled={loading}
              />

              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-card/80 rounded-xl">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              )}
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                Forgot your PIN?{' '}
                <button className="text-primary hover:underline font-medium">
                  Contact Admin
                </button>
              </p>
            </div>
          </div>

          {/* Demo hint */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Demo PINs: Staff (1234) • Supervisor (5678) • Admin (0000)</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-sm text-muted-foreground">
        <p>© 2024 Nkyinkyim Museum. All rights reserved.</p>
      </footer>
    </div>
  );
}
