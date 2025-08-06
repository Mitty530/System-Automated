import React, { useState } from 'react';
import { Mail, ArrowRight, Loader2, CheckCircle, AlertCircle, Shield, Clock, Lock } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { useAuth } from '../contexts/AuthContext';

const MagicLinkLoginModal = ({ 
  isOpen, 
  onClose, 
  actionToPerform,
  getRequiredRole 
}) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { signInWithMagicLink } = useAuth();

  // ⚡ Fast client-side email validation
  const validateEmailInstantly = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, error: 'Please enter a valid email address.' };
    }

    // Instant domain check
    const isAdfdEmail = email.endsWith('@adfd.ae');
    const isAuthorizedGmail = email === 'Mamadouourydiallo819@gmail.com';

    if (!isAdfdEmail && !isAuthorizedGmail) {
      return {
        valid: false,
        error: 'Access restricted to ADFD personnel only. Please use your @adfd.ae email address or contact your system administrator for access.'
      };
    }

    return { valid: true };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    // Clear previous states
    setError('');
    setSuccess('');

    // Client-side validation
    const clientValidation = validateEmailInstantly(email);
    if (!clientValidation.valid) {
      setError(clientValidation.error);
      return;
    }

    console.log('🚀 Sending magic link to:', email);
    setIsLoading(true);

    try {
      // Send magic link (validation is handled in AuthContext)
      const { error: magicLinkError } = await signInWithMagicLink(email);
      if (magicLinkError) {
        console.error('❌ Magic link error:', magicLinkError);
        setError(magicLinkError || 'Failed to send login link. Please try again.');
        return;
      }

      console.log('✅ Magic link sent successfully');
      setSuccess('🎉 Login link sent! Check your email and click the link to sign in.');

    } catch (error) {
      console.error('❌ Magic link error:', error);
      setError('Failed to send login link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };



  const handleClose = () => {
    setEmail('');
    setError('');
    setSuccess('');
    setIsLoading(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white p-8 rounded-t-3xl relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_70%,rgba(59,130,246,0.3)_0%,transparent_50%)]"></div>
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_30%,rgba(16,185,129,0.2)_0%,transparent_50%)]"></div>
        </div>

        <div className="relative z-10 flex justify-between items-start">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl opacity-30 blur"></div>
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                🏛️ ADFD Secure Access
              </h2>
              <p className="text-blue-200 text-sm font-medium mt-1">
                {actionToPerform
                  ? `Required Role: ${getRequiredRole(actionToPerform.action)}`
                  : 'Authorized Personnel Only'
                }
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-all duration-200 backdrop-blur-sm border border-white/20"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="p-8 bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Enhanced Instructions */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 mb-8 shadow-sm">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Mail className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-blue-900 text-lg mb-3">🔐 Secure Magic Link Authentication</h3>
              <div className="text-sm text-blue-800 space-y-2 font-medium">
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  <span>Enter your authorized ADFD email address</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  <span>We'll send you a secure, encrypted login link</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  <span>Click the link to access your dashboard instantly</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  <span>No passwords required - enterprise-grade security</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Success Message */}
        {success && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-6 mb-6 shadow-lg animate-fadeIn">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-green-900 text-lg mb-3 flex items-center">
                  <span className="text-2xl mr-2">🎉</span>
                  Magic Link Sent Successfully!
                </h4>
                <p className="text-sm text-green-800 font-medium mb-4 leading-relaxed">{success}</p>

                <div className="bg-green-100 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-2 text-sm text-green-700 mb-3">
                    <Clock className="w-4 h-4" />
                    <span className="font-bold">Next Steps:</span>
                  </div>
                  <ul className="text-sm text-green-700 space-y-2">
                    <li className="flex items-start space-x-2">
                      <span className="text-green-600 font-bold">1.</span>
                      <span>Check your email inbox <strong>(including spam folder)</strong></span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-green-600 font-bold">2.</span>
                      <span>Click the secure login link in the email</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-green-600 font-bold">3.</span>
                      <span>You'll be automatically redirected to your dashboard</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2 text-xs text-amber-700">
                    <Shield className="w-4 h-4" />
                    <span className="font-semibold">Security Notice:</span>
                  </div>
                  <p className="text-xs text-amber-700 mt-1">
                    This secure link expires in <strong>1 hour</strong> and can only be used once for maximum security.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Error Message */}
        {error && (
          <div className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-300 rounded-2xl p-6 mb-6 shadow-lg animate-fadeIn">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-red-900 text-lg mb-3 flex items-center">
                  <span className="text-2xl mr-2">🚫</span>
                  Access Denied
                </h4>
                <p className="text-sm text-red-800 font-medium mb-4 leading-relaxed">{error}</p>

                <div className="bg-red-100 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-2 text-sm text-red-700 mb-3">
                    <Shield className="w-4 h-4" />
                    <span className="font-bold">Need Help?</span>
                  </div>
                  <ul className="text-sm text-red-700 space-y-2">
                    <li className="flex items-start space-x-2">
                      <span className="text-red-600 font-bold">•</span>
                      <span>Ensure you're using your <strong>@adfd.ae</strong> email address</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-red-600 font-bold">•</span>
                      <span>Contact your system administrator for access</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-red-600 font-bold">•</span>
                      <span>Verify you're on the authorized user list</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2 text-xs text-blue-700">
                    <Mail className="w-4 h-4" />
                    <span className="font-semibold">Support Contact:</span>
                  </div>
                  <p className="text-xs text-blue-700 mt-1">
                    For technical support, contact: <strong>admin@adfd.ae</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Login Form - Hide when success */}
        {!success && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label htmlFor="email" className="block text-sm font-bold text-slate-700">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                  <Mail className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@adfd.ae"
                  className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-slate-700 font-medium bg-white/80 backdrop-blur-sm hover:bg-white focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg"
                  required
                  disabled={isLoading}
                  autoComplete="email"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full group relative overflow-hidden bg-gradient-to-r from-slate-800 via-blue-900 to-slate-800 hover:from-slate-700 hover:via-blue-800 hover:to-slate-700 text-white py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              {/* Button Background Animation */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <div className="relative z-10 flex items-center justify-center space-x-3">
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Sending Secure Link...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    <span>Send Secure Access Link</span>
                    {/* Chrome optimization indicator */}
                    {/Chrome/.test(navigator.userAgent) && !/Edg/.test(navigator.userAgent) && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full ml-2">
                        ⚡ Optimized
                      </span>
                    )}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                  </>
                )}
              </div>
            </button>
          </form>
        )}

        {/* World-Class Success State */}
        {success && (
          <div className="space-y-6 animate-fadeIn">
            {/* Success Header */}
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-green-900 mb-2">
                🎉 Magic Link Sent Successfully!
              </h3>
              <p className="text-green-700 font-medium">
                Your secure login link has been sent to:
              </p>
              <div className="bg-green-100 border-2 border-green-300 rounded-xl p-4 mt-3 mb-6">
                <div className="flex items-center justify-center space-x-2">
                  <Mail className="w-5 h-5 text-green-600" />
                  <span className="font-bold text-green-800 text-lg">{email}</span>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
              <h4 className="font-bold text-blue-900 text-lg mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Next Steps:
              </h4>
              <ol className="text-blue-800 space-y-3">
                <li className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  <span className="font-medium">Check your email inbox <strong>(including spam folder)</strong></span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                  <span className="font-medium">Click the secure login link in the email</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                  <span className="font-medium">You'll be automatically redirected to your dashboard</span>
                </li>
              </ol>
            </div>

            {/* Security Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center space-x-2 text-amber-700 mb-2">
                <Shield className="w-4 h-4" />
                <span className="font-bold text-sm">Security Notice:</span>
              </div>
              <p className="text-amber-700 text-sm">
                This secure link expires in <strong>1 hour</strong> and can only be used once for maximum security.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setSuccess('');
                  setEmail('');
                  setError('');
                }}
                className="flex-1 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                <span>Try Different Email</span>
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <Mail className="w-4 h-4" />
                <span>Send Another Link</span>
              </button>
            </div>
          </div>
        )}

        {/* Enhanced Security Notice */}
        <div className="mt-8 bg-gradient-to-r from-slate-100 to-blue-100 border-2 border-slate-200 rounded-2xl p-6 shadow-inner">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center">
                <Lock className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-800 text-sm mb-3">🔒 Security & Privacy Notice</h4>
              <div className="text-xs text-slate-700 space-y-2 leading-relaxed">
                <p className="font-medium">
                  <strong>Access Control:</strong> This system is restricted to authorized ADFD personnel only.
                  Access is limited to users with @adfd.ae email addresses and approved administrators.
                </p>
                <p>
                  <strong>Data Protection:</strong> All communications are encrypted end-to-end.
                  Magic links expire after 1 hour and can only be used once for maximum security.
                </p>
                <p>
                  <strong>Monitoring:</strong> All login attempts are logged and monitored for security purposes.
                  Unauthorized access attempts will be reported to system administrators.
                </p>
                <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-slate-300">
                  <Shield className="w-4 h-4 text-slate-600" />
                  <span className="font-semibold text-slate-800">Enterprise-grade security powered by Supabase</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-600 font-medium">
            By signing in, you agree to the ADFD security policies and terms of use.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default MagicLinkLoginModal;
