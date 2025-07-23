import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logo from '../logo.svg';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();
  const { signIn, user } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('🔄 Authenticating with Supabase...');

      const { error: signInError } = await signIn(email, password);

      if (signInError) {
        console.error('❌ Login error:', signInError);
        setError(signInError.message || 'Login failed. Please check your credentials.');
        return;
      }

      console.log('✅ Supabase authentication successful');
      // Navigation will be handled by the useEffect hook when user state changes

    } catch (error) {
      console.error('❌ Login error:', error);
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="h-screen w-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 50%, #475569 75%, #64748b 100%)',
        maxHeight: '100vh'
      }}
    >
      {/* Back Button */}
      <a href="/" className="back-button">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Home
      </a>

      {/* Centered Portrait-Oriented Container */}
      <div className="login-container flex relative"
        style={{
          width: '85vw',
          maxWidth: '1200px',
          height: '90vh',
          minHeight: '700px'
        }}
      >
      {/* Premium Styles */}
      <style>{`
        .premium-login-panel {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow:
            0 24px 48px rgba(0, 0, 0, 0.15),
            0 12px 24px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }
        
        .premium-brand-panel {
          background: linear-gradient(135deg, #4a5568 0%, #2b6cb0 100%);
          position: relative;
          overflow: hidden;
        }
        
        .premium-brand-panel::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 30% 70%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 70% 30%, rgba(16, 185, 129, 0.2) 0%, transparent 50%);
        }
        
        .premium-input {
          width: 100%;
          padding: 16px 20px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 500;
          background: rgba(255, 255, 255, 0.9);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          outline: none;
        }
        
        .premium-input:focus {
          border-color: #3b82f6;
          background: white;
          box-shadow: 
            0 0 0 4px rgba(59, 130, 246, 0.1),
            0 8px 16px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }
        
        .premium-button {
          width: 100%;
          padding: 18px 24px;
          background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
          color: #0f172a;
          border: none;
          border-radius: 16px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.3),
            0 4px 16px rgba(0, 0, 0, 0.1);
          position: relative;
          overflow: hidden;
        }

        .premium-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }

        .premium-button:hover::before {
          left: 100%;
        }

        .premium-button:hover {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          box-shadow:
            0 12px 40px rgba(0, 0, 0, 0.4),
            0 8px 24px rgba(0, 0, 0, 0.15);
          transform: translateY(-3px);
        }

        .premium-button:disabled {
          background: #94a3b8;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        
        .fade-in {
          animation: fadeIn 0.8s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Enhanced Password Toggle */
        .password-toggle {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          padding: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
        }

        .password-toggle:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(0, 0, 0, 0.2);
          transform: translateY(-50%) scale(1.05);
        }

        .password-toggle svg {
          width: 20px;
          height: 20px;
          color: #64748b;
          transition: color 0.3s ease;
        }

        .password-toggle:hover svg {
          color: #374151;
        }

        /* World-class Forgot Password Link */
        .forgot-password-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #3b82f6;
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          padding: 12px 20px;
          border-radius: 12px;
          background: rgba(59, 130, 246, 0.05);
          border: 1px solid rgba(59, 130, 246, 0.1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .forgot-password-link::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.1), transparent);
          transition: left 0.5s;
        }

        .forgot-password-link:hover::before {
          left: 100%;
        }

        .forgot-password-link:hover {
          color: #1d4ed8;
          background: rgba(59, 130, 246, 0.1);
          border-color: rgba(59, 130, 246, 0.2);
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(59, 130, 246, 0.2);
        }

        .forgot-password-link svg {
          width: 16px;
          height: 16px;
          transition: transform 0.3s ease;
        }

        .forgot-password-link:hover svg {
          transform: translateX(2px);
        }

        /* Back Button */
        .back-button {
          position: absolute;
          top: 24px;
          left: 24px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: rgba(255, 255, 255, 0.8);
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          padding: 12px 16px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 1000;
        }

        .back-button:hover {
          color: white;
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
        }

        .back-button svg {
          width: 16px;
          height: 16px;
          transition: transform 0.3s ease;
        }

        .back-button:hover svg {
          transform: translateX(-2px);
        }
        
        /* Panel Layout - Ensure exact 50/50 split */
        .login-panel-left,
        .login-panel-right {
          flex: 1;
          width: 50%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .login-container {
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 32px 64px rgba(0, 0, 0, 0.25);
        }
        
        /* Fixed viewport optimizations */
        .premium-login-panel {
          max-height: 90vh;
          overflow-y: auto;
          width: 100%;
          max-width: 480px;
        }

        .premium-brand-panel {
          height: 100%;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @media (max-width: 1024px) {
          .login-container {
            flex-direction: column;
            height: auto;
            min-height: 100vh;
          }

          .login-panel-left,
          .login-panel-right {
            width: 100% !important;
            min-height: 50vh;
            flex: none;
          }
        }

        @media (min-height: 768px) and (max-height: 900px) {
          .premium-login-panel {
            padding: 1.5rem;
            max-width: 420px;
          }
        }

        /* Specific optimizations for common laptop resolutions */
        @media (min-width: 1366px) and (max-width: 1440px) and (min-height: 768px) and (max-height: 900px) {
          .premium-login-panel {
            padding: 1.25rem;
            max-width: 400px;
          }

          .premium-brand-panel {
            padding: 1.5rem;
          }
        }

        @media (min-width: 1920px) and (min-height: 1080px) {
          .premium-login-panel {
            padding: 2rem;
            max-width: 480px;
          }

          .premium-brand-panel {
            padding: 2.5rem;
          }
        }

        /* Portrait-Oriented Vertical Design */
        .login-container {
          display: flex;
          border-radius: 24px;
          overflow: hidden;
          box-shadow:
            0 32px 64px rgba(0, 0, 0, 0.25),
            0 16px 32px rgba(0, 0, 0, 0.15);
        }

        .login-panel-left,
        .login-panel-right {
          width: 50%;
          height: 100%;
          flex: 1 1 50%;
          min-width: 0;
          min-height: 100%;
          max-height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          box-sizing: border-box;
        }

        /* Responsive Portrait Emphasis */
        @media (min-width: 1366px) and (max-width: 1440px) {
          .login-container {
            width: 88vw !important;
            height: 85vh !important;
          }
        }

        @media (min-width: 1441px) and (max-width: 1600px) {
          .login-container {
            width: 85vw !important;
            height: 88vh !important;
            max-width: 1100px !important;
          }
        }

        @media (min-width: 1601px) {
          .login-container {
            width: 80vw !important;
            height: 90vh !important;
            max-width: 1200px !important;
          }
        }

        @media (max-width: 1365px) {
          .login-container {
            width: 92vw !important;
            height: 82vh !important;
            min-height: 650px !important;
          }
        }

        /* Portrait Enhancement Effects */
        .login-container {
          transition: all 0.3s ease;
        }

        .login-container:hover {
          transform: translateY(-2px);
          box-shadow:
            0 40px 80px rgba(0, 0, 0, 0.3),
            0 20px 40px rgba(0, 0, 0, 0.2);
        }

        /* Subtle vertical emphasis animations */
        @keyframes portraitFadeIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .login-container {
          animation: portraitFadeIn 0.8s ease-out;
        }
      `}</style>

      {/* Left Panel - Login Form */}
      <div className="login-panel-left relative z-10">
        <div className={`premium-login-panel p-6 rounded-2xl ${mounted ? 'fade-in' : ''}`}>
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center space-x-3 mb-4">
              <div className="relative">
                <img src={logo} alt="Quandrox Logo" className="h-10 w-10" />
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-20 blur"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Quandrox</h1>
                <p className="text-xs text-gray-500 font-medium">Financial Platform</p>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome Back</h2>
            <p className="text-sm text-gray-600 font-medium">Authorized Personnel Only</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-medium mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="premium-input"
                placeholder="your.email@quandrox.com"
              />
            </div>



            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="premium-input pr-12"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="premium-button"
            >
              <span className="relative z-10">
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Login to Platform'
                )}
              </span>
            </button>
          </form>

          {/* Forgot Password Link */}
          <div className="mt-6 text-center">
            <button
              type="button"
              className="forgot-password-link"
              onClick={() => navigate('/forgot-password')}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Forgot your password?
            </button>
          </div>



          {/* Security Notice */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-sm text-blue-800 font-medium">
                Secure access protected by enterprise-grade encryption
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Premium Branding */}
      <div className="login-panel-right premium-brand-panel relative">
        <div className="relative z-10 text-center text-white w-full max-w-md">
          {/* Logo and Brand */}
          <div className="mb-8">
            <div className="relative inline-block mb-4">
              <img src={logo} alt="Quandrox Logo" className="h-12 w-12 mx-auto filter brightness-0 invert" />
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-30 blur-md"></div>
            </div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              Quandrox
            </h1>
            <p className="text-lg text-blue-200 font-medium">Financial Tracking Platform</p>
          </div>

          {/* Value Proposition */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white">
              Enterprise-Grade Financial Operations
            </h2>
            <p className="text-base text-blue-100 leading-relaxed mb-6">
              Secure, intelligent tracking and management for authorized financial personnel with real-time insights and enterprise security.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-white text-sm">Bank-Grade Security</h3>
                <p className="text-xs text-blue-200">Multi-layer encryption & compliance</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-white text-sm">Real-Time Processing</h3>
                <p className="text-xs text-blue-200">Instant updates & notifications</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-white text-sm">Advanced Analytics</h3>
                <p className="text-xs text-blue-200">Intelligent insights & reporting</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div> {/* Close login-container */}
    </div>
  );
};

export default Login;
