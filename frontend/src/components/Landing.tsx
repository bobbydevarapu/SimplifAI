import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ArrowRight, Github, Globe, Instagram, Linkedin, Menu, Search, Shield, X, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const navigateFallback = () => console.warn('Navigation unavailable. Ensure react-router-dom v6+ is installed.');

const Landing = () => {
  const navigate = useNavigate() || navigateFallback;
  const [showUpgradeCard, setShowUpgradeCard] = useState(false);
  const [upgradePlan, setUpgradePlan] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // If navigated here with state.openUpgrade, show the upgrade card
    const state: any = location.state as any;
    if (state && state.openUpgrade) {
      setShowUpgradeCard(true);
      // replace history state so reloading doesn't reopen
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const features = [
    { icon: Shield, title: "Enterprise Security", description: "Bank-level encryption for your data." },
    { icon: Search, title: "AI-Powered Search", description: "Instantly find key insights in documents." },
    { icon: Zap, title: "Lightning Fast", description: "Real-time processing with AI efficiency." },
    { icon: Globe, title: "Global Access", description: "Secure sharing across devices." },
  ];

  const handleUpgradeClick = (plan: string) => {
    setUpgradePlan(plan);
    setShowUpgradeCard(true);
  };

  const handleCloseCard = () => setShowUpgradeCard(false);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between"> {/* Reduced py-4 to py-2 */}
          <div className="flex items-center space-x-1" aria-label="SimplifAI Logo">
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 bg-transparent flex items-center justify-center transform hover:scale-105 transition-transform duration-300"> {/* Removed bg-background, reduced sizes */}
              <img src="/src/assets/logo.png" alt="SimplifAI Logo" className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 object-contain" /> {/* Adjusted image size */}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="md:hidden">
              <button onClick={toggleMobileMenu} className="text-vault-text-secondary hover:text-vault-text-primary transition-colors duration-300" aria-label="Toggle Menu">
                <Menu className="w-6 h-6" />
              </button>
            </div>
            <div className={`md:flex ${isMobileMenuOpen ? 'absolute top-12 right-4 bg-background/90 p-4 rounded-lg shadow-lg' : 'hidden md:flex'} md:static md:p-0`}>
              <Button variant="vaultGhost" onClick={() => navigate('/signin')} className="text-sm md:text-base text-vault-text-secondary hover:bg-vault-hover hover:text-vault-text-primary hover:shadow-[0_4px_12px_rgba(167,139,250,0.5)] transition-all duration-300 mr-2" aria-label="Sign In">
                Sign In
              </Button>
              <Button variant="vault" onClick={() => navigate('/signup')} className="text-sm md:text-base hover:bg-vault-hover hover:shadow-[0_4px_12px_rgba(167,139,250,0.5)] transition-all duration-300" aria-label="Sign Up">
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 mt-16 border-b border-border/30"> {/* Adjusted mt-20 to mt-16 for better spacing with smaller header */}
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-8 text-center lg:text-left">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-vault-text-primary leading-tight">
              <span className="text-2xl md:text-3xl lg:text-4xl font-semibold">Simplify & Extract</span><br />
              with AI Precision
            </h1>
            <Card className="bg-black/50 border border-border/20 rounded-3xl p-6 shadow-sm transition-all duration-300">
              <p className="text-base md:text-lg text-gray-200">Unlock complex documents, images, and PDFs with AI-powered extraction.</p>
              <p className="text-sm md:text-base text-gray-400 mt-2">Learn faster with real-time insights.</p>
            </Card>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="vault" size="lg" onClick={() => navigate('/signup')} className="flex items-center justify-center hover:border-white hover:shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-300" aria-label="Get Started Free">
                Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button variant="vaultGhost" size="lg" onClick={() => navigate('/signin')} className="hover:bg-vault-hover hover:text-vault-text-primary hover:shadow-[0_4px_12px_rgba(167,139,250,0.5)] transition-all duration-300" aria-label="Sign In">
                Sign In
              </Button>
            </div>
          </div>
          <div className="relative">
            <Card className="aspect-[4/3] max-w-xl mx-auto bg-black/80 border-border/50 overflow-hidden rounded-3xl shadow-2xl hover:border-white hover:shadow-[0_0_15px_rgba(255,255,255,0.7)] transition-all duration-300">
              <img src="/src/assets/Hero.jpg" alt="SimplifAI Demo" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-br from-vault-purple/10 to-transparent opacity-80"></div>
            </Card>
          </div>
        </div>
      </section>

      {/* Explore Our Plans */}
      <section className="container mx-auto px-4 py-16 border-b border-border/30">
        <div className="text-center space-y-6 mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-vault-purple bg-gradient-purple text-transparent bg-clip-text">Explore Our Plans</h2>
          <p className="text-xl text-vault-text-secondary max-w-2xl mx-auto">Choose a plan to unlock AI tools.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-vault-surface border-2 border-vault-purple/50 rounded-2xl p-6 hover:shadow-[0_0_20px_rgba(167,139,250,0.6)] transition-all duration-300 group">
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 bg-background flex items-center justify-center">
                <img src="/src/assets/logo.png" alt="SimplifAI Logo" className="w-20 h-20 object-contain" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-vault-text-primary text-center">Free Plan</h3>
            <p className="text-center text-vault-text-secondary mt-2">Basic AI tools</p>
            <Button variant="vault" className="w-full mt-4 hover:bg-vault-hover hover:shadow-[0_4px_12px_rgba(167,139,250,0.5)] transition-all duration-300" onClick={() => navigate('/signup')}>
              Get Started
            </Button>
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-vault-purple/50 group-hover:animate-glow rounded-2xl pointer-events-none"></div>
          </Card>
          <Card className="bg-vault-surface border-2 border-vault-purple/50 rounded-2xl p-6 hover:shadow-[0_0_20px_rgba(167,139,250,0.6)] transition-all duration-300 group">
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 bg-background flex items-center justify-center">
                <img src="/src/assets/logo.png" alt="SimplifAI Logo" className="w-20 h-20 object-contain" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-vault-text-primary text-center">Pro Plan</h3>
            <p className="text-center text-vault-text-secondary mt-2">Advanced AI tools</p>
            <Button variant="vault" className="w-full mt-4 bg-red-600 hover:bg-red-700 hover:shadow-[0_4px_12px_rgba(220,38,38,0.5)] transition-all duration-300" onClick={() => handleUpgradeClick('Pro')}>
              Upgrade Now
            </Button>
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-vault-purple/50 group-hover:animate-glow rounded-2xl pointer-events-none"></div>
          </Card>
          <Card className="bg-vault-surface border-2 border-vault-purple/50 rounded-2xl p-6 hover:shadow-[0_0_20px_rgba(167,139,250,0.6)] transition-all duration-300 group">
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 bg-background flex items-center justify-center">
                <img src="/src/assets/logo.png" alt="SimplifAI Logo" className="w-20 h-20 object-contain" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-vault-text-primary text-center">Business Plan</h3>
            <p className="text-center text-vault-text-secondary mt-2">Premium AI tools</p>
            <Button variant="vault" className="w-full mt-4 bg-red-600 hover:bg-red-700 hover:shadow-[0_4px_12px_rgba(220,38,38,0.5)] transition-all duration-300" onClick={() => handleUpgradeClick('Business')}>
              Upgrade Now
            </Button>
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-vault-purple/50 group-hover:animate-glow rounded-2xl pointer-events-none"></div>
          </Card>
        </div>
      </section>

      {/* See It in Action */}
      <section className="container mx-auto px-4 py-16 border-b border-border/30">
        <div className="text-center space-y-6 mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-vault-purple bg-gradient-purple text-transparent bg-clip-text">See It in Action</h2>
          <p className="text-xl text-vault-text-secondary max-w-2xl mx-auto">Explore SimplifAI’s interface on all devices.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="bg-vault-surface border-border/50 p-6 hover:shadow-[0_0_20px_rgba(255,255,255,0.6)] transition-transform duration-300">
            <img src="/src/assets/desktop.jpg" alt="Desktop View" className="w-full h-64 object-cover rounded-lg" />
            <p className="text-center mt-4 text-vault-text-secondary font-medium hover:text-vault-purple transition-colors duration-300">Desktop View</p>
          </Card>
          <Card className="bg-vault-surface border-border/50 p-6 hover:shadow-[0_0_20px_rgba(255,255,255,0.6)] transition-transform duration-300">
            <img src="/src/assets/Mobile.jpg" alt="Mobile View" className="w-full h-64 object-cover rounded-lg" />
            <p className="text-center mt-4 text-vault-text-secondary font-medium hover:text-vault-purple transition-colors duration-300">Mobile View</p>
          </Card>
        </div>
      </section>

      {/* Powerful Features */}
      <section className="container mx-auto px-4 py-16 border-b border-border/30">
        <div className="text-center space-y-6 mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-vault-purple bg-gradient-purple text-transparent bg-clip-text">Powerful Features</h2>
          <p className="text-xl text-vault-text-secondary max-w-2xl mx-auto">Enhance your learning with cutting-edge AI tools.</p>
        </div>
        <div className="grid md:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="bg-vault-surface border-border/50 p-6 hover:shadow-[0_0_20px_rgba(255,255,255,0.6)] transition-all duration-300 group">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-gradient-purple rounded-full flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-vault-text-primary text-center">{feature.title}</h3>
              <p className="text-center text-vault-text-secondary mt-2">{feature.description}</p>
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-vault-purple group-hover:animate-glow rounded-lg pointer-events-none"></div>
            </Card>
          ))}
        </div>
      </section>

      {/* Follow Us Footer */}
      <footer className="container mx-auto px-4 py-12 text-center border-t border-border/50">
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-vault-text-primary">Follow Us</h3>
          <div className="flex justify-center space-x-6">
            <a href="https://github.com/bobbydevarapu" target="_blank" rel="noopener noreferrer" className="text-vault-text-secondary hover:text-vault-hover transition-colors duration-300" aria-label="GitHub">
              <Github className="w-6 h-6" />
            </a>
            <a href="https://www.linkedin.com/in/bobby-devarapu-43874a2ab/" target="_blank" rel="noopener noreferrer" className="text-vault-text-secondary hover:text-vault-hover transition-colors duration-300" aria-label="LinkedIn">
              <Linkedin className="w-6 h-6" />
            </a>
            <a href="https://www.instagram.com/bobby_devarapu/" target="_blank" rel="noopener noreferrer" className="text-vault-text-secondary hover:text-vault-hover transition-colors duration-300" aria-label="Instagram">
              <Instagram className="w-6 h-6" />
            </a>
          </div>
          <p className="text-sm text-vault-text-secondary mt-4">© 2025 SimplifAI. All rights reserved.</p>
        </div>
      </footer>

      {/* Upgrade Card */}
      {showUpgradeCard && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <Card className="w-[300px] bg-black border-2 border-vault-purple/30 rounded-lg shadow-lg">
            <CardHeader className="flex justify-between items-center p-4 border-b border-vault-purple/20">
              <h3 className="text-lg font-semibold text-white">Upgrade Plan</h3>
              <button onClick={handleCloseCard} className="text-gray-400 hover:text-white" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-gray-300">Upgrade to unlock advanced AI features!</p>
              <p className="text-xl font-bold text-white mt-2">
                {upgradePlan === 'Pro' ? '$20/year' : '$40/year'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
export default Landing;