import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isValidLink, setIsValidLink] = useState(false);
  const [isCheckingLink, setIsCheckingLink] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);

    // Parse tokens from URL hash (Supabase sends them in hash, not query params)
    const parseHashParams = () => {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      return {
        access_token: params.get('access_token'),
        refresh_token: params.get('refresh_token'),
        type: params.get('type')
      };
    };

    const { access_token: accessToken, refresh_token: refreshToken, type } = parseHashParams();

    console.log('🔍 Parsing URL tokens:', { accessToken: !!accessToken, refreshToken: !!refreshToken, type });

    if (!accessToken || !refreshToken || type !== 'recovery') {
      setMessage('Invalid or expired reset link. Please request a new password reset from the login page.');
      setMessageType('error');
      setIsValidLink(false);
      setIsCheckingLink(false);

      // Redirect to login after 5 seconds
      setTimeout(() => {
        navigate('/login');
      }, 5000);
      return;
    }

    // Set the session with the tokens from the URL hash
    const setSession = async () => {
      try {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (error) {
          console.error('Session error:', error);
          setMessage('Invalid or expired reset link. Please request a new password reset from the login page.');
          setMessageType('error');
          setIsValidLink(false);

          // Redirect to login after 5 seconds
          setTimeout(() => {
            navigate('/login');
          }, 5000);
        } else {
          console.log('✅ Valid reset link - session established');
          setIsValidLink(true);
          setMessage('');

          // Clean up the URL hash after successful token parsing
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (error) {
        console.error('Error setting session:', error);
        setMessage('An error occurred. Please try again or request a new password reset.');
        setMessageType('error');
        setIsValidLink(false);

        // Redirect to login after 5 seconds
        setTimeout(() => {
          navigate('/login');
        }, 5000);
      } finally {
        setIsCheckingLink(false);
      }
    };

    setSession();
  }, [navigate]);

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number';
    }
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      return 'Password must contain at least one special character (@$!%*?&)';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setMessageType('');

    // Validation
    if (!password.trim()) {
      setMessage('Please enter a new password.');
      setMessageType('error');
      setIsLoading(false);
      return;
    }

    if (!confirmPassword.trim()) {
      setMessage('Please confirm your new password.');
      setMessageType('error');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match. Please try again.');
      setMessageType('error');
      setIsLoading(false);
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setMessage(passwordError);
      setMessageType('error');
      setIsLoading(false);
      return;
    }

    try {
      console.log('🔄 Updating password...');

      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('❌ Password update error:', error);
        setMessage(error.message || 'Failed to update password. Please try again.');
        setMessageType('error');
      } else {
        console.log('✅ Password updated successfully');

        // Log password change to history
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from('password_history').insert({
              user_id: user.id,
              change_type: 'reset',
              changed_by: 'user',
              ip_address: null, // Could be enhanced to capture real IP
              user_agent: navigator.userAgent
            });
            console.log('✅ Password change logged to history');
          }
        } catch (historyError) {
          console.warn('⚠️ Failed to log password change to history:', historyError);
          // Don't fail the password reset if history logging fails
        }

        setMessage('Password saved successfully! Redirecting to login page...');
        setMessageType('success');

        // Sign out the user and redirect to login after 2.5 seconds
        setTimeout(async () => {
          await supabase.auth.signOut();
          navigate('/login');
        }, 2500);
      }

    } catch (error) {
      console.error('❌ Password update error:', error);
      setMessage('An error occurred while updating your password. Please try again.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking link validity
  if (isCheckingLink) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <svg className="animate-spin w-8 h-8 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Verifying Reset Link</h2>
            <p className="text-gray-600">Please wait while we validate your password reset request...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state for invalid links
  if (!isValidLink) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-red-200">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-red-800 mb-4">Invalid Reset Link</h2>
            {message && (
              <div className="bg-red-100 border-2 border-red-300 text-red-800 p-4 rounded-lg mb-6 font-medium">
                {message}
              </div>
            )}
            <p className="text-gray-600 mb-6">Redirecting you to the login page...</p>
            <button
              onClick={() => navigate('/login')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Go to Login Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div
          className="text-center mb-8"
          style={{
            animation: mounted ? 'fadeInDown 0.8s ease-out' : 'none'
          }}
        >
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-2xl">🚀</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Enter New Password</h1>
          <p className="text-gray-700 font-medium">Create your new secure password</p>
        </div>

        {/* Main Card */}
        <div
          className="bg-white rounded-2xl shadow-xl p-8 border border-blue-200"
          style={{
            animation: mounted ? 'fadeInUp 0.8s ease-out 0.2s both' : 'none'
          }}
        >
          {/* Message Display */}
          {message && (
            <div
              className={`p-5 rounded-lg text-sm mb-6 font-semibold shadow-sm ${
                messageType === 'success'
                  ? 'bg-green-50 text-green-900 border-2 border-green-300'
                  : 'bg-red-50 text-red-900 border-2 border-red-300'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {messageType === 'success' ? (
                    <svg className="w-6 h-6 text-green-700" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-red-700" fill="currentColor" viewBox="0 0 20 20">
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-gray-800 mb-3">
                Enter New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg focus:ring-3 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200 pr-12 text-gray-800 font-medium"
                  placeholder="Enter your new password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-blue-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-bold text-gray-800 mb-3">
                Re-enter Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg focus:ring-3 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200 pr-12 text-gray-800 font-medium"
                  placeholder="Re-enter your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-blue-600 transition-colors"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showConfirmPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-lg border border-blue-200">
              <h4 className="text-sm font-bold text-blue-900 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Password Requirements:
              </h4>
              <ul className="text-sm text-blue-800 space-y-2 font-medium">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  At least 8 characters long
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  One uppercase letter (A-Z)
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  One lowercase letter (a-z)
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  One number (0-9)
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  One special character (@$!%*?&)
                </li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-lg font-bold text-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving Password...
                </div>
              ) : (
                'Save Password'
              )}
            </button>
          </form>

          {/* Back to Login Link */}
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-semibold transition-colors hover:underline"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Login
            </button>
          </div>
        </div>

        {/* Footer */}
        <div
          className="text-center mt-8 text-sm text-gray-600 font-medium"
          style={{
            animation: mounted ? 'fadeInUp 0.8s ease-out 0.4s both' : 'none'
          }}
        >
          <p className="flex items-center justify-center">
            <span className="mr-2">🚀</span>
            © 2025 Quandrox. Secure password management.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
