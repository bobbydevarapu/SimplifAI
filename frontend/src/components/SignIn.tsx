import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Globe, Search, Shield, X, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'https://u5ygktm879.execute-api.us-east-1.amazonaws.com/dev';

const SignIn = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', rememberMe: false });
  const [showSuccessCard, setShowSuccessCard] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [showOtpSuccessCard, setShowOtpSuccessCard] = useState(false);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const userEmail = localStorage.getItem('userEmail');
    if (isAuthenticated && userEmail) {
      navigate('/dashboard');
    }
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/auth`, {
        method: 'POST',
        body: JSON.stringify({ email: formData.email, password: formData.password }),
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (response.ok && data.statusCode === 200) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userEmail', formData.email);
        setSuccessMessage('Sign in successful! Redirecting to dashboard...');
        setShowSuccessCard(true);
        setTimeout(() => {
          setShowSuccessCard(false);
          navigate('/dashboard');
        }, 2000);
      } else {
        setSuccessMessage(data.message || 'Login failed');
        setShowSuccessCard(true);
        setTimeout(() => setShowSuccessCard(false), 2500);
      }
    } catch (error) {
      console.error('Login Error:', error);
      setSuccessMessage('Failed to login. Please try again.');
      setShowSuccessCard(true);
      setTimeout(() => setShowSuccessCard(false), 2500);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[DEBUG] Forgot password submit:', { forgotEmail });
    if (!forgotEmail) {
      setSuccessMessage('Please enter an email address.');
      setShowSuccessCard(true);
      setTimeout(() => setShowSuccessCard(false), 2500);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ email: forgotEmail, action: 'forgot' }),
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      console.log('[DEBUG] Backend response:', data);
      const otpSent = (typeof data.statusCode !== 'undefined' && data.statusCode === 200) ||
        (typeof data.message === 'string' && data.message.toLowerCase().includes('otp sent'));
      if (response.ok && otpSent) {
        localStorage.setItem('resetEmail', forgotEmail);
        setSuccessMessage('OTP sent to your email. Please check your inbox.');
        setShowSuccessCard(true);
        setTimeout(() => {
          setShowSuccessCard(false);
          navigate('/reset-password', { state: { email: forgotEmail } });
        }, 1200);
      } else if (data.message === 'Email not found or not verified' || response.status === 404) {
        setSuccessMessage('Email not found or not verified. Please use a registered email.');
        setShowSuccessCard(true);
        setTimeout(() => setShowSuccessCard(false), 2500);
      } else {
        setSuccessMessage('OTP send failed: ' + (data.message || 'Error sending OTP') + '\n[DEBUG] Response: ' + JSON.stringify(data));
        setShowSuccessCard(true);
        setTimeout(() => setShowSuccessCard(false), 3500);
      }
    } catch (error) {
      console.error('[DEBUG] Forgot Password Error:', error);
      setSuccessMessage('Failed to send OTP. [DEBUG] Error: ' + (error?.toString() || 'unknown error'));
      setShowSuccessCard(true);
      setTimeout(() => setShowSuccessCard(false), 3500);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleForgotEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => setForgotEmail(e.target.value);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative">
      {/* Blur/dim overlay when modal or pop card is open */}
      {(showForgotModal || showSuccessCard || showOtpSuccessCard) && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-all duration-300 z-[100]"></div>
      )}
      <div className="grid lg:grid-cols-2 w-full max-w-7xl min-h-screen relative z-[200]">
        <div className="hidden lg:flex flex-col justify-center p-4 sm:p-8 xl:p-12 space-y-8">
          <div className="flex items-center space-x-3" aria-label="SimplifAI Features">
            <div className="w-16 h-16 bg-gradient-purple rounded-lg flex items-center justify-center">
              <img src="/src/assets/sing.png" alt="SimplifAI Logo" className="w-12 h-12 object-contain" />
            </div>
            <span className="text-2xl sm:text-3xl font-semibold text-vault-text-primary">SimplifAI</span>
          </div>
          <div className="space-y-6">
            {[{ icon: Shield, title: 'Security', desc: 'Bank-level encryption.' }, { icon: Search, title: 'Search', desc: 'AI-powered insights.' }, { icon: Zap, title: 'Speed', desc: 'Real-time processing.' }, { icon: Globe, title: 'Global', desc: 'Access anywhere.' }].map((feature, index) => (
              <Card key={index} className="p-6 bg-vault-surface-dark border-border/50 hover:bg-vault-surface-hover transition-all duration-300">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-purple rounded-lg flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-vault-text-primary">{feature.title}</h3>
                    <p className="text-sm text-vault-text-secondary">{feature.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
        <div className="flex flex-col justify-center p-4 sm:p-8 xl:p-12">
          <div className="w-full max-w-md mx-auto space-y-6">
            <div className="lg:hidden flex items-center justify-center space-x-3 mb-4 sm:mb-6">
              <div className="w-16 h-16 bg-gradient-purple rounded-lg flex items-center justify-center">
                <img src="/src/assets/sing.png" alt="SimplifAI Logo" className="w-12 h-12 object-contain" />
              </div>
              <span className="text-2xl sm:text-3xl font-semibold text-vault-text-primary">SimplifAI</span>
            </div>
            <div className="flex space-x-1 p-1 bg-vault-surface rounded-lg">
              <Button variant="vault" className="flex-1 hover:border-white hover:shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-300" size="sm" type="submit" form="signInForm">Sign In</Button>
              <Button variant="vaultGhost" className="flex-1 hover:border-white hover:shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-300" size="sm" onClick={() => navigate('/signup')}>Sign Up</Button>
            </div>
            <Card className="bg-vault-surface border-border/50">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Welcome Back</CardTitle>
                <CardDescription>Sign in to access your AI tools</CardDescription>
              </CardHeader>
              <CardContent>
                <form id="signInForm" onSubmit={handleSignIn} className="space-y-4 sm:space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-vault-text-primary">Email</label>
                    <Input id="email" name="email" type="email" placeholder="Enter your email" value={formData.email} onChange={handleInputChange} required autoComplete="email" className="w-full" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium text-vault-text-primary">Password</label>
                    <div className="relative">
                      <Input id="password" name="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={formData.password} onChange={handleInputChange} required autoComplete="current-password" className="w-full" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-vault-text-muted hover:text-vault-text-primary">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
                    <label htmlFor="rememberMe" className="flex items-center space-x-2 text-sm text-vault-text-secondary">
                      <input id="rememberMe" type="checkbox" name="rememberMe" checked={formData.rememberMe} onChange={handleInputChange} className="w-4 h-4 text-vault-purple bg-vault-surface border-border rounded" />
                      <span>Remember me</span>
                    </label>
                    <button type="button" onClick={() => setShowForgotModal(true)} className="text-sm text-vault-purple hover:text-vault-purple-hover underline">
                      Forgot password?
                    </button>
                  </div>
                  <Button type="submit" variant="vault" className="w-full shine-hover relative overflow-hidden group hover:border-white hover:shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-300" size="lg">
                    <span className="relative z-10">Sign In</span>
                    <span className="absolute inset-0 border-2 border-transparent group-hover:border-vault-purple transition-all duration-300 ease-in-out"></span>
                  </Button>
                  <p className="text-center text-sm text-vault-text-secondary">
                    Don’t have an account? <button onClick={() => navigate('/signup')} className="text-vault-purple hover:text-vault-purple-hover">Sign up</button>
                  </p>
                </form>
              </CardContent>
            </Card>
            {/* Only show global pop card if not in forgot modal */}
            {showSuccessCard && !showForgotModal && (
              <div className="fixed top-0 left-0 w-full flex justify-center z-50 pt-4 px-2 sm:px-0 pointer-events-none">
                <Card className="w-full max-w-xs sm:max-w-sm md:max-w-md bg-black/80 border-2 border-vault-purple/80 rounded-xl shadow-lg p-4 text-center animate-fade-in pointer-events-auto">
                  <CardContent>
                    <p className="text-base sm:text-lg font-semibold text-white break-words">{successMessage}</p>
                  </CardContent>
                </Card>
              </div>
            )}
            {showForgotModal && (
              <>
                {/* Blur overlay behind the modal card */}
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"></div>
                {/* Modal card above the blur */}
                <div className="fixed inset-0 flex items-center justify-center z-50">
                  <Card className="w-[90%] max-w-[300px] sm:max-w-[350px] md:max-w-[400px] bg-vault-surface-dark border-2 border-vault-purple/70 rounded-lg shadow-lg p-4 sm:p-6 relative">
                    <CardHeader className="p-2 sm:p-4 border-b border-border/50 flex justify-between items-center">
                      <CardTitle className="text-lg sm:text-xl font-semibold text-vault-text-primary">Forgot Password</CardTitle>
                      <button onClick={() => setShowForgotModal(false)} aria-label="Close" title="Close" className="text-vault-text-muted hover:text-vault-text-primary">
                        <X className="w-5 h-5" />
                      </button>
                    </CardHeader>
                    <CardContent className="p-2 sm:p-4">
                      <form onSubmit={handleForgotSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <label htmlFor="forgotEmail" className="text-sm font-medium text-vault-text-primary">Email</label>
                          <Input id="forgotEmail" type="email" placeholder="Enter your email" value={forgotEmail} onChange={handleForgotEmailChange} required autoComplete="email" className="w-full bg-vault-surface/50 focus:bg-vault-surface transition-colors duration-300" />
                        </div>
                        <Button type="submit" variant="vault" className="w-full hover:bg-vault-hover hover:shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-300" size="lg">
                          Submit
                        </Button>
                      </form>
                      {/* Show pop card only inside modal if modal is open */}
                      {showSuccessCard && showForgotModal && (
                        <div className="fixed top-0 left-0 w-full flex justify-center z-50 pt-4 px-2 sm:px-0 pointer-events-none">
                          <Card className="w-full max-w-xs sm:max-w-sm md:max-w-md bg-black/80 border-2 border-vault-purple/80 rounded-xl shadow-lg p-4 text-center animate-fade-in pointer-events-auto">
                            <CardContent>
                              <p className="text-base sm:text-lg font-semibold text-white break-words">{successMessage}</p>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
            {showOtpSuccessCard && (
              <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-[95vw] max-w-xs sm:max-w-sm md:max-w-md">
                <Card className="bg-black/60 border-2 border-vault-purple/80 rounded-xl shadow-lg p-4 text-center animate-fade-in">
                  <CardContent>
                    <p className="text-base sm:text-lg font-semibold text-white break-words">OTP sent for reset</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;