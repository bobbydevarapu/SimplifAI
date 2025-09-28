import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const API_BASE_URL = 'https://u5ygktm879.execute-api.us-east-1.amazonaws.com/dev';

const VerifySignupOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Always try to get email/fullName from state, fallback to localStorage
  const [email, setEmail] = useState(location.state?.email || localStorage.getItem('signupEmail') || '');
  const [fullName, setFullName] = useState(location.state?.fullName || localStorage.getItem('signupFullName') || '');
  const [otp, setOtp] = useState('');
  const [showSuccessCard, setShowSuccessCard] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!email) {
      setSuccessMessage('No email provided. Redirecting to sign-in...');
      setShowSuccessCard(true);
      setTimeout(() => {
        setShowSuccessCard(false);
        navigate('/signin');
      }, 2000);
    } else {
      // Always keep localStorage in sync for next step
      localStorage.setItem('signupEmail', email);
      if (fullName) localStorage.setItem('signupFullName', fullName);
    }
  }, [email, fullName, navigate]);

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[DEBUG] Submitting OTP:', { email, otp, fullName });
    if (!otp) {
      setSuccessMessage('Please enter the OTP.');
      setShowSuccessCard(true);
      setTimeout(() => setShowSuccessCard(false), 2500);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/verify-otp`, {
        method: 'POST',
        body: JSON.stringify({ email, otp, purpose: 'signup', fullName }),
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      console.log('[DEBUG] Backend response:', data);
      const otpSuccess =
        (typeof data.statusCode !== 'undefined' && data.statusCode === 200) ||
        (typeof data.message === 'string' && data.message.toLowerCase().includes('otp verified successfully'));
      if (response.ok && otpSuccess) {
        setSuccessMessage('OTP verified! Signing you in and redirecting to dashboard...');
        setShowSuccessCard(true);
        // Clear localStorage for signup flow
        localStorage.removeItem('signupEmail');
        localStorage.removeItem('signupFullName');
        // Mark user as authenticated and save email
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userEmail', email);
        setTimeout(() => {
          setShowSuccessCard(false);
          console.log('[DEBUG] Redirecting to /dashboard');
          window.location.assign(window.location.origin + '/dashboard');
        }, 1000);
        return;
      } else {
        setSuccessMessage('OTP failed: ' + (data.message || 'Invalid or expired OTP') + '\n[DEBUG] Response: ' + JSON.stringify(data));
        setShowSuccessCard(true);
        setTimeout(() => setShowSuccessCard(false), 3500);
      }
    } catch (error) {
      setSuccessMessage('Failed to verify OTP. [DEBUG] Error: ' + (error?.toString() || 'unknown error'));
      setShowSuccessCard(true);
      setTimeout(() => setShowSuccessCard(false), 3500);
      console.error('[DEBUG] Exception in OTP submit:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-black/60 border border-gray-800/50 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 relative overflow-hidden group">
        <div className="absolute inset-0 border-2 border-transparent group-hover:border-vault-purple/50 group-hover:animate-border-glow rounded-xl pointer-events-none"></div>
        <CardHeader className="flex items-center space-x-1 p-4">
          <div className="w-10 h-10 bg-gradient-purple rounded-lg flex items-center justify-center">
            <img src="/src/assets/sing.png" alt="SimplifAI Logo" className="w-8 h-8 object-contain" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">SimplifAI</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-center text-sm text-gray-400 mb-6">Enter the OTP sent to your email</CardDescription>
          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-300">Email</label>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                disabled
                className="w-full bg-gray-800/50 text-white placeholder-gray-500 border-gray-700 focus:border-vault-purple focus:ring-2 focus:ring-vault-purple/50 rounded-lg p-2"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="otp" className="text-sm font-medium text-gray-300">OTP</label>
              <Input
                id="otp"
                name="otp"
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                maxLength={6}
                required
                autoComplete="one-time-code"
                className="w-full bg-gray-800/50 text-white placeholder-gray-500 border-gray-700 focus:border-vault-purple focus:ring-2 focus:ring-vault-purple/50 rounded-lg p-2"
              />
            </div>
            <Button
              type="submit"
              variant="vault"
              className="w-full text-white bg-vault-purple hover:bg-vault-purple/90 rounded-lg py-2 transition-all duration-300 relative overflow-hidden group hover:border-white hover:shadow-[0_0_10px_rgba(255,255,255,0.5)]"
              size="lg"
            >
              <span className="relative z-10">Verify OTP</span>
              <span className="absolute inset-0 border-2 border-transparent group-hover:border-white transition-all duration-300 ease-in-out"></span>
            </Button>
          </form>
        </CardContent>
      </Card>
      {showSuccessCard && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-[95vw] max-w-xs sm:max-w-sm md:max-w-md">
          <Card className="bg-black/60 border-2 border-vault-purple/80 rounded-xl shadow-lg p-4 text-center animate-fade-in">
            <CardContent>
              <p className="text-base sm:text-lg font-semibold text-white break-words">{successMessage}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default VerifySignupOtp;
