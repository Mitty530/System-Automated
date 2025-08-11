import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 Processing auth callback...');

        // Get the current URL to check for auth tokens
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');

        if (code) {
          console.log('📧 Magic link code found, processing authentication...');

          // Let Supabase handle the auth callback
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error('❌ Auth callback error:', error);
            navigate('/', { replace: true });
            return;
          }

          console.log('✅ Authentication successful, redirecting to dashboard');
        }

        // Redirect to dashboard
        navigate('/dashboard', { replace: true });

      } catch (error) {
        console.error('❌ Auth callback error:', error);
        navigate('/', { replace: true });
      }
    };

    // Process the callback
    handleAuthCallback();
  }, [navigate]);

  // Minimal loading state - user will be redirected immediately
  const renderStatus = () => (
    <div className="text-center">
      <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <span className="text-2xl text-white">🚀</span>
      </div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">Redirecting to dashboard...</h2>
      <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">🏛️ ADFD Tracking System</h1>
          <p className="text-gray-600 text-sm">Secure Authentication</p>
        </div>
        
        {renderStatus()}
        
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            If you're not redirected automatically, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
