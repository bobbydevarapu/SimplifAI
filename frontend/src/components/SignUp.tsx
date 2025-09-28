import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CognitoUserAttribute, CognitoUserPool } from 'amazon-cognito-identity-js';
import { Eye, EyeOff, Globe, Search, Shield, Zap } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const poolData = {
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
};
const userPool = new CognitoUserPool(poolData);

const SignUp = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', agreeToTerms: false });
  const [showSuccessCard, setShowSuccessCard] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const validatePassword = (password: string) => {
    const minLength = 6;
    const hasNumber = /\d/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasSpecialChar = /[@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password);
    return password.length >= minLength && hasNumber && hasUpperCase && hasLowerCase && hasSpecialChar;
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agreeToTerms) {
      setSuccessMessage('Please agree to the Terms of Service and Privacy Policy');
      setShowSuccessCard(true);
      setTimeout(() => setShowSuccessCard(false), 2500);
      return;
    }
    if (!formData.fullName || !formData.email.includes('@') || !validatePassword(formData.password)) {
      setSuccessMessage('Please provide a valid full name, email, and strong password (min 6 chars, numbers, uppercase, lowercase, special chars).');
      setShowSuccessCard(true);
      setTimeout(() => setShowSuccessCard(false), 2500);
      return;
    }
    const attributeList = [new CognitoUserAttribute({ Name: 'name', Value: formData.fullName }), new CognitoUserAttribute({ Name: 'email', Value: formData.email })];
    userPool.signUp(formData.email, formData.password, attributeList, null, (err, result) => {
      if (err) {
        setSuccessMessage(err.message || 'Error during signup');
        setShowSuccessCard(true);
        setTimeout(() => setShowSuccessCard(false), 2500);
        return;
      }
      setSuccessMessage('👉 OTP sent successfully to your email');
      setShowSuccessCard(true);
      // Store email and fullName in localStorage for OTP flow
      localStorage.setItem('signupEmail', formData.email);
      localStorage.setItem('signupFullName', formData.fullName);
      setTimeout(() => {
        setShowSuccessCard(false);
        navigate('/verify-signup-otp', { state: { email: formData.email, fullName: formData.fullName } });
      }, 2000);
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen gap-4 lg:gap-4">
        <div className="hidden lg:flex flex-col justify-center p-4 sm:p-6 xl:p-8 space-y-6 ml-8">
          <div className="flex items-center space-x-2" aria-label="SimplifAI Features">
            <div className="w-16 h-16 bg-gradient-purple rounded-lg flex items-center justify-center">
              <img src="/src/assets/sing.png" alt="SimplifAI Logo" className="w-12 h-12 object-contain" />
            </div>
            <span className="text-2xl sm:text-3xl font-semibold text-vault-text-primary">SimplifAI</span>
          </div>
          <div className="space-y-4">
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
        <div className="flex flex-col justify-center p-4 sm:p-6 xl:p-8">
          <div className="w-full max-w-md mx-auto space-y-6">
            <div className="lg:hidden flex items-center space-x-2 justify-center mb-4 sm:mb-6">
              <div className="w-16 h-16 bg-gradient-purple rounded-lg flex items-center justify-center">
                <img src="/src/assets/sing.png" alt="SimplifAI Logo" className="w-12 h-12 object-contain" />
              </div>
              <span className="text-2xl sm:text-3xl font-semibold text-vault-text-primary">SimplifAI</span>
            </div>
            <div className="flex space-x-1 p-1 bg-vault-surface rounded-lg">
              <Button variant="vaultGhost" className="flex-1 hover:border-white hover:shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-300" size="sm" onClick={() => navigate('/signin')}>Sign In</Button>
              <Button variant="vault" className="flex-1 hover:border-white hover:shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-300" size="sm" type="submit" form="signupForm">Sign Up</Button>
            </div>
            <Card className="bg-vault-surface border-border/50">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-vault-text-primary">Create Account</CardTitle>
                <CardDescription className="text-sm text-vault-text-secondary">Start your AI-powered learning journey</CardDescription>
              </CardHeader>
              <CardContent>
                <form id="signupForm" onSubmit={handleSignUp} className="space-y-4 sm:space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="fullName" className="text-sm font-medium text-vault-text-primary">Full Name</label>
                    <Input id="fullName" name="fullName" type="text" placeholder="Enter your full name" value={formData.fullName} onChange={handleInputChange} required autoComplete="name" className="w-full bg-vault-surface/50 focus:bg-vault-surface transition-colors duration-300" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-vault-text-primary">Email</label>
                    <Input id="email" name="email" type="email" placeholder="Enter your email" value={formData.email} onChange={handleInputChange} required autoComplete="email" className="w-full bg-vault-surface/50 focus:bg-vault-surface transition-colors duration-300" />
                  </div>
                  <div className="space-y-2 relative">
                    <label htmlFor="password" className="text-sm font-medium text-vault-text-primary">Password</label>
                    <div className="relative">
                      <Input id="password" name="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={formData.password} onChange={handleInputChange} required autoComplete="new-password" className="w-full pr-10 bg-vault-surface/50 focus:bg-vault-surface transition-colors duration-300" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-vault-text-muted hover:text-vault-text-primary">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <input id="agreeToTerms" type="checkbox" name="agreeToTerms" checked={formData.agreeToTerms} onChange={handleInputChange} className="w-4 h-4 text-vault-purple bg-vault-surface border-border rounded mt-0.5" required />
                    <label htmlFor="agreeToTerms" className="text-xs text-vault-text-secondary">
                      I agree to the <a href="#" className="text-vault-purple hover:text-vault-purple-hover">Terms of Service</a> and{' '}
                      <a href="#" className="text-vault-purple hover:text-vault-purple-hover">Privacy Policy</a>
                    </label>
                  </div>
                  <Button type="submit" variant="vault" className="w-full shine-hover relative overflow-hidden group hover:border-white hover:shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-300" size="lg">
                    <span className="relative z-10">Create Account</span>
                    <span className="absolute inset-0 border-2 border-transparent group-hover:border-vault-purple transition-all duration-300 ease-in-out"></span>
                  </Button>
                  <p className="text-center text-sm text-vault-text-secondary">
                    Already have an account?{' '}
                    <button onClick={() => navigate('/signin')} className="text-vault-purple hover:text-vault-purple-hover">Sign in</button>
                  </p>
                </form>
                {showSuccessCard && (
                  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 pt-4">
                    <Card className="w-[85%] max-w-[300px] sm:max-w-[350px] bg-vault-surface-dark/90 border-4 border-vault-purple/80 rounded-lg shadow-lg p-3 sm:p-4 text-center">
                      <CardContent>
                        <p className="text-sm sm:text-lg font-semibold text-white font-sans antialiased leading-relaxed">{successMessage}</p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;