import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import logo from '../logo.svg';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);



  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateEmailDomain = (email: string): boolean => {
    const adminEmail = 'Mamadouourydiallo819@gmail.com';
    const allowedDomain = '@adfd.ae';

    // Normalize email for comparison (case-insensitive)
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedAdminEmail = adminEmail.toLowerCase();

    // Allow admin email as exception (case-insensitive)
    if (normalizedEmail === normalizedAdminEmail) {
      return true;
    }

    // Check if email ends with allowed domain (case-insensitive)
    const domainMatch = normalizedEmail.endsWith(allowedDomain.toLowerCase());
    return domainMatch;
  };

  const checkEmailExists = async (email: string) => {
    // Since we already validated the domain, we'll allow password reset
    // for all valid ADFD emails. The actual email existence will be
    // validated by Supabase's password reset functionality.
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setMessageType('');

    // Validation
    if (!email.trim()) {
      setMessage('Please enter your email address.');
      setMessageType('error');
      setIsLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      setMessage('Please enter a valid email address.');
      setMessageType('error');
      setIsLoading(false);
      return;
    }

    if (!validateEmailDomain(email)) {
      setMessage('Unauthorized user. Only authorized personnel are allowed to access this system.');
      setMessageType('error');
      setIsLoading(false);
      return;
    }

    // Check if email exists in our system
    const emailExists = await checkEmailExists(email);
    if (!emailExists) {
      setMessage('This email address is not registered in our system. Please contact your administrator.');
      setMessageType('error');
      setIsLoading(false);
      return;
    }

    try {
      console.log('🔄 Sending password reset email...');

      const { error } = await resetPassword(email);

      if (error) {
        console.error('❌ Password reset error:', error);
        setMessage(error.message || 'An error occurred while processing your request. Please try again later.');
        setMessageType('error');
      } else {
        setMessage(`Password reset instructions have been sent to ${email}. Please check your inbox and follow the instructions to reset your password.`);
        setMessageType('success');
        console.log('✅ Password reset email sent successfully');
      }

    } catch (error) {
      console.error('❌ Password reset error:', error);
      setMessage('An error occurred while processing your request. Please try again later.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
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
      <button 
        onClick={handleBackToLogin}
        className="back-button"
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Login
      </button>

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
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
            transition: left 0.5s;
          }

          .premium-button:hover::before {
            left: 100%;
          }

          .premium-button:hover {
            transform: translateY(-3px);
            box-shadow:
              0 12px 40px rgba(0, 0, 0, 0.4),
              0 6px 20px rgba(0, 0, 0, 0.15);
          }

          .premium-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
          }

          .premium-button:disabled:hover {
            transform: none;
            box-shadow:
              0 8px 32px rgba(0, 0, 0, 0.3),
              0 4px 16px rgba(0, 0, 0, 0.1);
          }

          .fade-in {
            animation: fadeInUp 0.6s ease-out;
          }

          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .premium-select {
            width: 100%;
            padding: 16px 20px;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 500;
            background: rgba(255, 255, 255, 0.9);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            outline: none;
            appearance: none;
            background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
            background-position: right 12px center;
            background-repeat: no-repeat;
            background-size: 16px;
            padding-right: 48px;
          }

          .premium-select:focus {
            border-color: #3b82f6;
            background: white;
            box-shadow: 
              0 0 0 4px rgba(59, 130, 246, 0.1),
              0 8px 16px rgba(0, 0, 0, 0.1);
            transform: translateY(-2px);
          }

          .back-button {
            position: absolute;
            top: 2rem;
            left: 2rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 1rem 2rem;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 1rem;
            color: white;
            text-decoration: none;
            font-size: 0.9rem;
            font-weight: 600;
            backdrop-filter: blur(20px);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
            z-index: 10;
            box-shadow:
              0 8px 32px rgba(0, 0, 0, 0.2),
              0 4px 16px rgba(0, 0, 0, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.2);
          }

          .back-button:hover {
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 100%);
            transform: translateX(-4px) translateY(-2px);
            box-shadow:
              0 12px 40px rgba(0, 0, 0, 0.3),
              0 6px 20px rgba(0, 0, 0, 0.15),
              inset 0 1px 0 rgba(255, 255, 255, 0.3);
            border-color: rgba(255, 255, 255, 0.4);
          }

          .back-button:active {
            transform: translateX(-2px) translateY(-1px);
          }

          .back-button svg {
            width: 1rem;
            height: 1rem;
          }

          .login-container {
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
            border-radius: 1rem;
            overflow: hidden;
          }

          @media (max-width: 768px) {
            .login-container {
              flex-direction: column;
              width: 95vw;
              height: 95vh;
            }
            
            .premium-login-panel {
              border-radius: 1rem 1rem 0 0 !important;
              border-right: 1px solid rgba(255, 255, 255, 0.2) !important;
              border-bottom: none !important;
              flex: 0.6;
            }
            
            .premium-brand-panel {
              border-radius: 0 0 1rem 1rem !important;
              border-left: none !important;
              border-top: 1px solid rgba(255, 255, 255, 0.2) !important;
              flex: 0.4;
            }
            
            .back-button {
              top: 1rem !important;
              left: 1rem !important;
              padding: 0.75rem 1.5rem !important;
              font-size: 0.8rem !important;
              gap: 0.5rem !important;
            }
          }
        `}</style>

        {/* Left Panel - Form */}
        <div
          className="premium-login-panel flex flex-col justify-center"
          style={{
            flex: '1',
            borderRadius: '1rem 0 0 1rem',
            padding: '3rem'
          }}
        >
          <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-8">
              <h2
                className="text-3xl font-bold text-gray-800 mb-2 fade-in"
                style={{
                  animationDelay: '0.2s',
                  animationFillMode: 'both'
                }}
              >
                Reset Password
              </h2>
              <p
                className="text-gray-600 fade-in"
                style={{
                  animationDelay: '0.4s',
                  animationFillMode: 'both'
                }}
              >
                Enter your details to receive reset instructions
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-12">
              {/* Email Field */}
              <div
                className="fade-in mb-8"
                style={{
                  animationDelay: '0.6s',
                  animationFillMode: 'both'
                }}
              >
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-6">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="premium-input"
                  placeholder="your.email@adfd.ae"
                />
              </div>



              {/* Message Display */}
              {message && (
                <div
                  className={`p-6 rounded-lg text-sm mb-8 font-semibold shadow-md ${
                    messageType === 'success'
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-red-100 text-red-800 border-2 border-red-300'
                  }`}
                  style={{
                    animation: 'fadeInUp 0.3s ease-out'
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {messageType === 'success' ? (
                        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 leading-relaxed">
                      {message}
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="mt-8 mb-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="premium-button fade-in"
                  style={{
                    animationDelay: '1s',
                    animationFillMode: 'both'
                  }}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Sending Instructions...</span>
                    </div>
                  ) : (
                    'Send Reset Instructions'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Panel - Branding */}
        <div
          className="premium-brand-panel flex flex-col justify-center items-center text-white relative"
          style={{
            flex: '1',
            borderRadius: '0 1rem 1rem 0',
            padding: '3rem'
          }}
        >
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="absolute -top-10 -left-10 w-40 h-40 rounded-full opacity-20"
              style={{
                background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
                animation: 'float 6s ease-in-out infinite'
              }}
            />
            <div
              className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full opacity-20"
              style={{
                background: 'linear-gradient(45deg, #f59e0b, #ef4444)',
                animation: 'float 8s ease-in-out infinite reverse'
              }}
            />
          </div>

          <div className="relative z-10 text-center">
            <div className="mb-8">
              <div
                className="w-24 h-24 mx-auto mb-6 flex items-center justify-center"
                style={{
                  animation: mounted ? 'fadeInUp 1s ease-out' : 'none'
                }}
              >
                <img
                  src={logo}
                  alt="ADFD Logo"
                  className="w-full h-full"
                  style={{
                    objectFit: 'contain'
                  }}
                />
              </div>
              <h1
                className="text-4xl font-bold mb-4"
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: mounted ? 'fadeInUp 1s ease-out 0.2s both' : 'none'
                }}
              >
                Password Recovery
              </h1>
              <p
                className="text-lg opacity-90 leading-relaxed"
                style={{
                  animation: mounted ? 'fadeInUp 1s ease-out 0.4s both' : 'none'
                }}
              >
                Secure and reliable password reset for ADFD team members
              </p>
            </div>

            <div
              className="space-y-4 text-sm opacity-80"
              style={{
                animation: mounted ? 'fadeInUp 1s ease-out 0.6s both' : 'none'
              }}
            >
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Secure Password Recovery</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Account Verification</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span>Email Instructions</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Styles */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
        }
      `}</style>
    </div>
  );
};

export default ForgotPassword;
