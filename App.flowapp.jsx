import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import LandingPage from './src/components/LandingPage';
import MagicLinkLoginModal from './src/components/MagicLinkLoginModal';
import WithdrawalRequestTracker from './src/components/WithdrawalRequestTracker';
import AuthCallback from './src/components/AuthCallback';
import LogoutConfirmation from './src/components/LogoutConfirmation';
import AuthWrapper from './src/components/AuthWrapper';

import { useAuth } from './src/contexts/AuthContext';
import { canPerformAction } from './src/utils/rolePermissions';

// Main App Component with Routing
const AppContent = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalState, setLoginModalState] = useState({
    email: '',
    isLoading: false,
    error: '',
    success: ''
  });

  const [actionToPerform, setActionToPerform] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading, signOut, getUserProfileByEmail } = useAuth();



  // Create user profile from database
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user && user.email) {
        try {
          setProfileLoading(true);

          // Retry mechanism for database query
          let dbProfile = null;
          let retryCount = 0;
          const maxRetries = 3;

          while (!dbProfile && retryCount < maxRetries) {
            try {
              dbProfile = await getUserProfileByEmail(user.email);
              if (!dbProfile) {
                retryCount++;
                console.log(`⏳ Retry ${retryCount}/${maxRetries} for user profile...`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
              }
            } catch (error) {
              retryCount++;
              console.error(`❌ Attempt ${retryCount} failed:`, error);
              if (retryCount < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
          }

          if (dbProfile) {
            console.log('✅ Database profile found:', dbProfile);
            const profile = {
              id: dbProfile.id, // Use user_profiles.id instead of auth.users.id
              auth_id: user.id, // Keep auth ID for reference
              email: user.email,
              name: dbProfile.full_name || user.email?.split('@')[0] || 'User',
              role: dbProfile.role,
              department: dbProfile.department,
              regional_assignment: dbProfile.regional_assignment,
              can_create_requests: dbProfile.can_create_requests,
              can_approve_reject: dbProfile.can_approve_reject,
              can_disburse: dbProfile.can_disburse,
              can_access_admin_dashboard: dbProfile.can_access_admin_dashboard,
              can_override_workflow: dbProfile.can_override_workflow,
              avatar: user.user_metadata?.avatar_url || '👤',
              created_at: user.created_at
            };
            setUserProfile(profile);
            console.log('✅ User profile set:', profile);

            // Redirect to dashboard if on landing page or auth callback
            if (location.pathname === '/' || location.pathname === '/auth/callback') {
              console.log('🔄 Redirecting to dashboard from:', location.pathname);
              navigate('/dashboard', { replace: true });
            }

          } else {
            // No database profile found - user must be added to database first
            console.warn('❌ No database profile found for user:', user.email);
            console.log('🔄 User authenticated but not in database. Please contact admin to add user.');
            setUserProfile(null);
            // Don't redirect - stay on landing page to show login
          }
        } catch (error) {
          console.error('❌ Error fetching user profile:', error);
          setUserProfile(null);
        } finally {
          setProfileLoading(false);
        }
      } else {
        console.log('ℹ️ No user or email, clearing profile');
        setUserProfile(null);
        setProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, [user, location.pathname, navigate, getUserProfileByEmail]);

  // Handle navigation from landing page
  const handleGetStarted = () => {
    // Add small delay to prevent rapid state changes
    setTimeout(() => {
      console.log('🔄 handleGetStarted called:', { hasUser: !!user, hasUserProfile: !!userProfile });
      if (user && userProfile) {
        console.log('✅ Navigating to dashboard');
        navigate('/dashboard');
      } else if (user && !userProfile) {
        // User is authenticated but not in database
        console.log('⚠️ User authenticated but no profile found');
        alert('⚠️ Account Setup Required\n\nYour email is authenticated but your account needs to be set up by an administrator.\n\nPlease contact your system administrator to complete your account setup.');
      } else {
        console.log('🔄 Opening login modal');
        setShowLoginModal(true);
      }
    }, 100);
  };

  // Handle logout with confirmation
  const handleLogout = async () => {
    try {

      // Show logout confirmation
      setShowLogoutConfirmation(true);

      // Perform logout
      const result = await signOut();

      if (result?.success !== false) {
        setUserProfile(null);
        setActionToPerform(null);
        setShowLoginModal(false);

        // Clear all browser cache and redirect to login
        try {
          // Clear all possible cache locations
          localStorage.clear();
          sessionStorage.clear();

          // Clear browser cache if possible
          if ('caches' in window) {
            caches.keys().then(names => {
              names.forEach(name => {
                caches.delete(name);
              });
            });
          }

        } catch (cacheError) {
          console.warn('Warning: Could not clear all cache:', cacheError);
        }

        // Force redirect to landing page after a short delay
        setTimeout(() => {
          navigate('/', { replace: true });
          window.location.reload(); // Force a complete page reload
        }, 2500); // Wait for logout confirmation to show

      } else {
        console.error('❌ Logout failed:', result?.error);
        setShowLogoutConfirmation(false);
      }
    } catch (error) {
      console.error('❌ Error during logout:', error);
      setShowLogoutConfirmation(false);
    }
  };

  // Handle logout confirmation completion
  const handleLogoutConfirmationComplete = () => {
    setShowLogoutConfirmation(false);
    // Navigate to landing page
    navigate('/', { replace: true });
  };

  // Validate permission for actions using enhanced permission system
  const validatePermission = (action, request, user) => {
    const currentStage = request?.current_stage || request?.currentStage;
    const requestCreatedBy = request?.created_by || request?.createdBy;
    const currentUserId = user?.id;

    return canPerformAction(user.role, action, currentStage, requestCreatedBy, currentUserId);
  };

  // Get required role for action
  const getRequiredRoleForAction = (action) => {
    switch (action) {
      case 'create':
        return 'Archive Team';
      case 'approve':
      case 'reject':
        return 'Operations Team';
      case 'disburse':
        return 'Core Banking Team';
      case 'edit':
        return 'Archive Team';
      case 'delete':
        return 'Administrator';
      case 'view':
        return 'Any Role';
      default:
        return 'Unknown';
    }
  };

  // Handle protected actions that require login
  const handleProtectedAction = (action, request = null) => {
    if (!user || !userProfile) {
      setActionToPerform({ action, request });
      setShowLoginModal(true);
      return;
    }

    if (!validatePermission(action, request, userProfile)) {
      setActionToPerform({ action, request });
      setShowLoginModal(true);
      return;
    }

    // Action is allowed, proceed
  };

  // Improved loading state management - prevent flash of landing page
  const isInitialAuthLoading = authLoading;
  const isProfileLoading = user && profileLoading;
  const isAppLoading = isInitialAuthLoading || isProfileLoading;

  // Show loading screen only during initial auth check or profile loading
  if (isAppLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-white">🏛️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">ADFD Tracking System</h2>
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">
            {isInitialAuthLoading ? 'Checking authentication...' : 'Loading your profile...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthWrapper>
      <Routes>
        {/* Auth Callback Route - Must be first */}
        <Route
          path="/auth/callback"
          element={<AuthCallback />}
        />

        {/* Landing Page Route - Only show if no authenticated user */}
        <Route
          path="/"
          element={
            user && userProfile ? (
              <Navigate to="/dashboard" replace />
            ) : user && !userProfile ? (
              // User authenticated but no profile - show account setup message
              <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl text-white">⚠️</span>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Account Setup Required</h2>
                    <p className="text-gray-600 mb-6">
                      Please contact your administrator to complete your account setup.
                    </p>
                    <button
                      onClick={handleLogout}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <LandingPage onGetStarted={handleGetStarted} userProfile={userProfile} />
            )
          }
        />

        {/* Dashboard Route - Protected */}
        <Route
          path="/dashboard"
          element={
            user && userProfile ? (
              <WithdrawalRequestTracker
                currentUser={userProfile}
                onLogout={handleLogout}
                onProtectedAction={handleProtectedAction}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Magic Link Login Modal */}
      <MagicLinkLoginModal
        isOpen={showLoginModal}
        onClose={() => {
          setShowLoginModal(false);
          setActionToPerform(null);
          setLoginModalState({
            email: '',
            isLoading: false,
            error: '',
            success: ''
          });
        }}
        actionToPerform={actionToPerform}
        getRequiredRole={getRequiredRoleForAction}
        modalState={loginModalState}
        setModalState={setLoginModalState}
      />

      {/* Logout Confirmation */}
      <LogoutConfirmation
        isVisible={showLogoutConfirmation}
        onComplete={handleLogoutConfirmationComplete}
      />


    </AuthWrapper>
  );
};

// Root App Component
const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;