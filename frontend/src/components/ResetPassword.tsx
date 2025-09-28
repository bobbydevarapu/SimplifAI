import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const API_BASE_URL = 'https://u5ygktm879.execute-api.us-east-1.amazonaws.com/dev';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(localStorage.getItem('resetEmail') || '');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessCard, setShowSuccessCard] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [otpValidLength, setOtpValidLength] = useState(false);

  useEffect(() => {
    if (!email) {
      // Try to get from localStorage as fallback
      const stored = localStorage.getItem('resetEmail');
      if (stored) setEmail(stored);
    }
  }, [email]);

  const validatePassword = (pwd: string) => {
    const minLength = 6;
    const hasNumber = /\d/.test(pwd);
    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasLowerCase = /[a-z]/.test(pwd);
    const hasSpecialChar = /[@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(pwd);
    return pwd.length >= minLength && hasNumber && hasUpperCase && hasLowerCase && hasSpecialChar;
  };




  // Enable password fields when OTP is 6 digits
  useEffect(() => {
    setOtpValidLength(otp.length === 6);
  }, [otp]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpValidLength) {
      setSuccessMessage('Please enter the 6-digit OTP sent to your email.');
      setShowSuccessCard(true);
      setTimeout(() => setShowSuccessCard(false), 2000);
      return;
    }
    if (password !== confirmPassword) {
      setSuccessMessage('Passwords do not match');
      setShowSuccessCard(true);
      setTimeout(() => setShowSuccessCard(false), 2500);
      return;
    }
    if (!validatePassword(password)) {
      setSuccessMessage('Password needs 6+ chars, numbers, uppercase, lowercase, and special chars (e.g., @)');
      setShowSuccessCard(true);
      setTimeout(() => setShowSuccessCard(false), 2500);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ email, otp, newPassword: password, action: 'reset' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      const isSuccess = (response.ok && data.statusCode === 200) ||
        (typeof data.message === 'string' && data.message.toLowerCase().includes('password reset successfully'));
      if (isSuccess) {
        setSuccessMessage('👉 Password updated successfully! Redirecting to sign in...');
        setShowSuccessCard(true);
        setTimeout(() => {
          setShowSuccessCard(false);
          navigate('/signin', { replace: true });
        }, 1000);
      } else {
        setSuccessMessage((data.message || 'Error resetting password') + '\n[DEBUG] Response: ' + JSON.stringify(data));
        setShowSuccessCard(true);
        setTimeout(() => setShowSuccessCard(false), 3500);
      }
    } catch (error) {
      console.error('Reset Error:', error);
      setSuccessMessage('Failed to reset password. Please try again.');
      setShowSuccessCard(true);
      setTimeout(() => setShowSuccessCard(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-black/50 border-border/50">
        <CardHeader className="flex items-center space-x-1 p-4">
          <div className="w-10 h-10 bg-gradient-purple rounded-lg flex items-center justify-center">
            <img src="/src/assets/sing.png" alt="SimplifAI Logo" className="w-8 h-8 object-contain" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">SimplifAI</CardTitle>
        </CardHeader>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-white">Reset Password</CardTitle>
          <CardDescription className="text-sm text-gray-400">Enter a new password for your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleReset} className="space-y-6">


            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Email</label>
              <Input
                type="email"
                value={email}
                disabled
                className="bg-black/30 text-white placeholder-gray-400 cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">OTP</label>
              <Input
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                maxLength={6}
                required
                autoComplete="one-time-code"
                className="bg-black/30 text-white placeholder-gray-400"
              />
            </div>

            <div className="space-y-2 relative">
              <label className="text-sm font-medium text-white">New Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-black/30 text-white placeholder-gray-400"
                  disabled={!otpValidLength}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-vault-text-muted hover:text-vault-text-primary"
                  tabIndex={-1}
                  disabled={!otpValidLength}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div className="space-y-2 relative">
              <label className="text-sm font-medium text-white">Confirm Password</label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-black/30 text-white placeholder-gray-400"
                  disabled={!otpValidLength}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-vault-text-muted hover:text-vault-text-primary"
                  tabIndex={-1}
                  disabled={!otpValidLength}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <Button type="submit" variant="vault" className="w-full text-white transition-all duration-200 hover:shadow-[0_0_10px_#a78bfa,0_0_8px_2px_#a78bfa66] hover:border-vault-purple/80 border-2 border-transparent" size="lg" disabled={!otpValidLength}>
              Reset Password
            </Button>
            <style>{`
              .reset-hover-effect {
                border-radius: 0.75rem;
                transition: border-radius 0.3s, box-shadow 0.3s;
              }
              .reset-hover-effect:hover {
                border-radius: 0;
                box-shadow: 0 0 0 2px #a78bfa, 0 0 8px 2px #a78bfa66;
              }
            `}</style>
          </form>
        </CardContent>
      </Card>
      {showSuccessCard && (
        <div className="fixed top-0 left-0 w-full flex justify-center z-50 pt-4 px-2 sm:px-0 pointer-events-none">
          <Card className="w-full max-w-xs sm:max-w-sm md:max-w-md bg-black/80 border-2 border-vault-purple/80 rounded-xl shadow-lg p-4 text-center animate-fade-in pointer-events-auto">
            <CardContent>
              <p className="text-base sm:text-lg font-semibold text-white break-words">{successMessage}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ResetPassword;