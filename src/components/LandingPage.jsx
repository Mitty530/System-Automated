import React, { useEffect, useState, useRef } from 'react';
import {
  Rocket,
  ScanText,
  Zap,
  Shield,
  Clock,
  Users,
  ArrowRight,
  DollarSign,
  CheckCircle,
  Star
} from 'lucide-react';
import Button from './ui/Button';
import Card from './ui/Card';
import Badge from './ui/Badge';

const LandingPage = ({ onGetStarted }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [stats, setStats] = useState({
    accuracy: 0,
    processing: 0,
    monitoring: 0,
    uptime: 0
  });
  const particlesRef = useRef(null);

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    const handleMouseMove = (e) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);

    // Create particles
    createParticles();

    // Animate stats on scroll
    const observeElements = () => {
      const elements = document.querySelectorAll('.animate-on-scroll');
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      });

      elements.forEach((el) => observer.observe(el));
    };

    observeElements();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Create floating particles
  const createParticles = () => {
    if (!particlesRef.current) return;

    for (let i = 0; i < 50; i++) {
      const particle = document.createElement('div');
      particle.className = 'landing-particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.width = Math.random() * 4 + 2 + 'px';
      particle.style.height = particle.style.width;
      particle.style.animationDelay = Math.random() * 20 + 's';
      particle.style.animationDuration = (Math.random() * 10 + 15) + 's';
      particlesRef.current.appendChild(particle);
    }
  };

  // Animate counters
  const animateCounter = (target, key) => {
    let current = 0;
    const increment = target / 100;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      setStats(prev => ({ ...prev, [key]: Math.floor(current) }));
    }, 20);
  };

  // Start counter animations
  useEffect(() => {
    setTimeout(() => {
      animateCounter(99.9, 'accuracy');
      animateCounter(85, 'processing');
      animateCounter(24, 'monitoring');
      animateCounter(100, 'uptime');
    }, 1000);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Custom cursor */}
      <div 
        className="landing-cursor" 
        style={{ 
          left: cursorPosition.x - 10, 
          top: cursorPosition.y - 10 
        }}
      />
      <div 
        className="landing-cursor-follower" 
        style={{ 
          left: cursorPosition.x - 20, 
          top: cursorPosition.y - 20 
        }}
      />
      
      {/* Particles container */}
      <div 
        ref={particlesRef}
        className="fixed inset-0 pointer-events-none z-0" 
      />

      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'landing-nav-blur shadow-lg' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold landing-gradient-text font-['Space_Grotesk']">
                  Quandrox
                </h1>
                <p className="text-sm text-gray-600">Tracking System</p>
              </div>
            </div>
            
            <ul className="hidden md:flex items-center space-x-8 text-gray-700 font-medium">
              <li><a href="#hero" className="hover:text-blue-600 transition-colors">Platform</a></li>
              <li><a href="#features" className="hover:text-blue-600 transition-colors">Features</a></li>
              <li><a href="#security" className="hover:text-blue-600 transition-colors">Security</a></li>
            </ul>

            <div className="flex items-center space-x-4">
              <Button 
                variant="primary" 
                className="flex items-center space-x-2"
                onClick={onGetStarted}
              >
                <ArrowRight size={16} />
                <span>Get Started</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="relative min-h-screen flex items-center landing-hero-bg">
        {/* Background Image */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1714779573280-c7a66c4a34f9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGdyYWRpZW50JTIwdGVjaG5vbG9neSUyMGZsb3dpbmd8ZW58MHwwfHxibHVlfDE3NTQxNjcwOTJ8MA&ixlib=rb-4.1.0&q=85')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-fade-in-up">
            <Badge variant="default" className="mb-6 bg-white/20 text-white border-white/30 backdrop-blur-sm">
              <Zap size={14} className="mr-2" />
              Enterprise Fund Disbursement Platform
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 font-['Space_Grotesk'] leading-tight">
              Transform Fund Disbursement with{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Intelligent Automation
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              Enterprise-grade withdrawal request platform powered by intelligent form processing, 
              regional intelligence, and bank-level security.
            </p>
            
            {/* Animated Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
              <div className="animate-count-up">
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {stats.accuracy}%
                </div>
                <div className="text-gray-300 text-sm">Accuracy Rate</div>
              </div>
              <div className="animate-count-up">
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {stats.processing}%
                </div>
                <div className="text-gray-300 text-sm">Faster Processing</div>
              </div>
              <div className="animate-count-up">
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {stats.monitoring}/7
                </div>
                <div className="text-gray-300 text-sm">Hour Monitoring</div>
              </div>
              <div className="animate-count-up">
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {stats.uptime}%
                </div>
                <div className="text-gray-300 text-sm">Uptime SLA</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="primary" 
                className="text-lg px-8 py-4"
                onClick={onGetStarted}
              >
                <Rocket size={20} className="mr-2" />
                Start Free Trial
              </Button>
              <Button size="lg" variant="secondary" className="text-lg px-8 py-4">
                <Star size={20} className="mr-2" />
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-on-scroll">
            <Badge variant="default" className="mb-4">
              <Zap size={16} className="mr-2" />
              Powerful Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-['Space_Grotesk']">
              Built for Enterprise Financial Operations
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Advanced AI capabilities, intelligent automation, and enterprise-grade security 
              designed for the most demanding financial institutions.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="landing-feature-card p-8 animate-on-scroll hover:-translate-y-2 hover:shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mb-6">
                <ScanText size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Intelligent Form Processing</h3>
              <p className="text-gray-600 leading-relaxed">
                Advanced form validation and processing system ensures accurate data entry and validation. 
                Streamlined workflow processes withdrawal requests efficiently.
              </p>
            </Card>

            <Card className="landing-feature-card p-8 animate-on-scroll hover:-translate-y-2 hover:shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 flex items-center justify-center mb-6">
                <Shield size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Bank-Level Security</h3>
              <p className="text-gray-600 leading-relaxed">
                Multi-layered security architecture with end-to-end encryption, role-based access control, 
                and comprehensive audit trails.
              </p>
            </Card>

            <Card className="landing-feature-card p-8 animate-on-scroll hover:-translate-y-2 hover:shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center mb-6">
                <Clock size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Real-Time Processing</h3>
              <p className="text-gray-600 leading-relaxed">
                Instant document processing and validation with real-time status updates. 
                Reduce processing time from hours to minutes.
              </p>
            </Card>

            <Card className="landing-feature-card p-8 animate-on-scroll hover:-translate-y-2 hover:shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mb-6">
                <Users size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Multi-Role Management</h3>
              <p className="text-gray-600 leading-relaxed">
                Comprehensive role-based system supporting administrators, finance managers, 
                operations teams, and end users with customizable permissions.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-24 bg-gray-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-on-scroll">
            <Badge variant="default" className="mb-4">
              <Shield size={16} className="mr-2" />
              Enterprise Security
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-['Space_Grotesk']">
              Bank-Level Security & Compliance
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Multi-layered security architecture designed for financial institutions with comprehensive 
              audit trails, encryption, and compliance frameworks.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="landing-feature-card p-8 animate-on-scroll hover:-translate-y-2 hover:shadow-2xl">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  <Shield size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">End-to-End Encryption</h3>
                  <p className="text-gray-600 leading-relaxed">
                    All data is encrypted in transit and at rest using AES-256 encryption. 
                    Zero-knowledge architecture ensures that sensitive financial data remains protected.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="landing-feature-card p-8 animate-on-scroll hover:-translate-y-2 hover:shadow-2xl">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 flex items-center justify-center flex-shrink-0">
                  <Users size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Role-Based Access Control</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Granular permission system with multi-factor authentication, session management, 
                    and principle of least privilege access for all user roles.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="landing-feature-card p-8 animate-on-scroll hover:-translate-y-2 hover:shadow-2xl">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                  <ScanText size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Comprehensive Audit Trails</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Complete logging of all system activities with immutable audit trails, 
                    real-time monitoring, and automated compliance reporting.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="landing-feature-card p-8 animate-on-scroll hover:-translate-y-2 hover:shadow-2xl">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                  <Clock size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">24/7 Security Monitoring</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Continuous security monitoring with AI-powered threat detection, 
                    automated incident response, and real-time alerts for suspicious activities.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div 
          className="absolute inset-0 landing-hero-bg opacity-95"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1531124448996-ffe8d56777ad?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTAwNDR8MHwxfHNlYXJjaHw5fHxwYXJ0aWNsZXMlMjBkb3RzJTIwdGVjaG5vbG9neSUyMGFic3RyYWN0fGVufDB8MHx8Ymx1ZXwxNzU0MTY3MDkyfDA&ixlib=rb-4.1.0&q=85')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        
        <div className="relative z-10 max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-['Space_Grotesk']">
            Ready to Transform Your Financial Operations?
          </h2>
          <p className="text-xl text-gray-300 mb-12 leading-relaxed">
            Join leading financial institutions worldwide who trust our platform for secure, 
            efficient, and intelligent fund disbursement operations.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="primary" 
              className="text-lg px-8 py-4"
              onClick={onGetStarted}
            >
              <ArrowRight size={20} className="mr-2" />
              Go to Dashboard
            </Button>
            <Button size="lg" variant="secondary" className="text-lg px-8 py-4 bg-white/20 text-white border-white/30 hover:bg-white/30">
              <CheckCircle size={20} className="mr-2" />
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;