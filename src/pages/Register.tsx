import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { CameraCapture } from '@/components/CameraCapture';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { generateQRCode } from '@/lib/qrcode';
import { Camera, Loader2, ArrowLeft, UserPlus, CheckCircle2 } from 'lucide-react';

type RegistrationStep = 'form' | 'photo' | 'success';

const DEPARTMENTS = [
  'Tours',
  'Exhibitions',
  'Administration',
  'Maintenance',
  'Education',
  'Gift Shop',
  'Security',
  'Cafe',
];

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState<RegistrationStep>('form');
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');
  
  // Photo and QR state
  const [profilePhoto, setProfilePhoto] = useState<Blob | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [generatedQRCode, setGeneratedQRCode] = useState<string | null>(null);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName || !email || !password || !department) {
      toast.error('Please fill in all fields');
      return;
    }
    
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    // Move to photo capture step
    setStep('photo');
    setShowCamera(true);
  };

  const handlePhotoCapture = async (blob: Blob) => {
    setProfilePhoto(blob);
    setShowCamera(false);
    
    // Now complete registration
    await completeRegistration(blob);
  };

  const completeRegistration = async (photoBlob: Blob) => {
    setLoading(true);
    
    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      const userId = authData.user.id;
      const qrCode = generateQRCode(userId);

      // 2. Upload profile photo
      const photoPath = `${userId}/profile.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(photoPath, photoBlob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        console.error('Photo upload error:', uploadError);
        // Continue without photo if upload fails
      }

      // Get public URL for photo
      const { data: urlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(photoPath);

      // 3. Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          full_name: fullName,
          email: email,
          department: department,
          profile_photo_url: urlData?.publicUrl || null,
          qr_code: qrCode,
          is_approved: false,
        });

      if (profileError) throw profileError;

      // 4. Create user role (default to staff)
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'staff',
        });

      if (roleError) throw roleError;

      setGeneratedQRCode(qrCode);
      setStep('success');
      toast.success('Registration successful!');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed');
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  const handleCameraCancel = () => {
    setShowCamera(false);
    setStep('form');
  };

  if (step === 'success' && generatedQRCode) {
    return (
      <div className="min-h-screen gradient-warm pattern-adinkra flex flex-col">
        <header className="p-6">
          <Logo size="md" />
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4 pb-12">
          <div className="w-full max-w-md animate-fade-in">
            <div className="bg-card rounded-3xl shadow-elevated border p-8 text-center">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                Welcome, {fullName}!
              </h1>
              <p className="text-muted-foreground mb-8">
                Your account has been created. Save your QR code to log in quickly.
              </p>

              <QRCodeDisplay value={generatedQRCode} userName={fullName} />

              <div className="mt-8 p-4 bg-warning/10 rounded-xl">
                <p className="text-sm text-warning-foreground">
                  <strong>Important:</strong> Your account is pending approval by an administrator. You'll be notified when your account is activated.
                </p>
              </div>

              <Button
                onClick={() => navigate('/')}
                className="w-full mt-6 gradient-primary text-primary-foreground"
              >
                Go to Login
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-warm pattern-adinkra flex flex-col">
      <header className="p-6 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Logo size="md" />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md animate-fade-in">
          <div className="bg-card rounded-3xl shadow-elevated border p-8">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-7 h-7 text-primary" />
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                Staff Registration
              </h1>
              <p className="text-muted-foreground">
                Create your account to start clocking in
              </p>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

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
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                Continue to Photo Capture
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/" className="text-primary hover:underline font-medium">
                  Log In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {showCamera && (
        <CameraCapture
          onCapture={handlePhotoCapture}
          onCancel={handleCameraCancel}
          title="Take Profile Photo"
          description="Position your face within the circle and take a clear photo"
        />
      )}

      <footer className="p-6 text-center text-sm text-muted-foreground">
        <p>© 2024 Nkyinkyim Museum. All rights reserved.</p>
      </footer>
    </div>
  );
}
