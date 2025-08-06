import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import LandingPage from './src/components/LandingPage';
import MagicLinkLoginModal from './src/components/MagicLinkLoginModal';
import WithdrawalRequestTracker from './src/components/WithdrawalRequestTracker';
import AuthCallback from './src/components/AuthCallback';
import LogoutConfirmation from './src/components/LogoutConfirmation';
import { useAuth } from './src/contexts/AuthContext';
import { canPerformAction } from './src/utils/rolePermissions';

// Main App Component with Routing
const AppContent = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);


  const [actionToPerform, setActionToPerform] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, getUserProfileByEmail } = useAuth();

  // Create user profile from database
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user && user.email) {
        try {
          // Fast database profile fetch with shorter timeout
          const dbProfile = await Promise.race([
            getUserProfileByEmail(user.email),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Database timeout')), 1500) // Reduced from 5000ms to 1500ms
            )
          ]);

          if (dbProfile) {
            const profile = {
              id: user.id,
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

            // Redirect to dashboard if on landing page
            if (location.pathname === '/') {
              navigate('/dashboard', { replace: true });
            }

          } else {
            // Create optimized fallback profile
            const isAdminGmail = user.email === 'Mamadouourydiallo819@gmail.com';
            const isAdfdUser = user.email?.endsWith('@adfd.ae');

            const fallbackProfile = {
              id: user.id,
              email: user.email,
              name: user.email?.split('@')[0] || 'User',
              role: isAdminGmail ? 'admin' : (isAdfdUser ? 'archive_team' : 'observer'),
              department: isAdminGmail ? 'Administration' : (isAdfdUser ? 'Archive Team' : 'General'),
              can_create_requests: true,
              can_approve_reject: isAdminGmail,
              can_disburse: isAdminGmail,
              can_access_admin_dashboard: isAdminGmail,
              can_override_workflow: isAdminGmail,
              avatar: '👤',
              created_at: user.created_at
            };
            setUserProfile(fallbackProfile);

            // Redirect to dashboard if on landing page
            if (location.pathname === '/') {
              navigate('/dashboard', { replace: true });
            }
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
    };

    fetchUserProfile();
  }, [user, location.pathname, navigate, getUserProfileByEmail]);

  // Handle navigation from landing page
  const handleGetStarted = () => {
    // Add small delay to prevent rapid state changes
    setTimeout(() => {
      if (user && userProfile) {
        navigate('/dashboard');
      } else {
        setShowLoginModal(true);
      }
    }, 100);
  };

  // Handle logout with confirmation
  const handleLogout = async () => {
    try {
      console.log('🔄 Logout initiated by user');

      // Show logout confirmation
      setShowLogoutConfirmation(true);

      // Perform logout
      const result = await signOut();

      if (result?.success !== false) {
        console.log('✅ Logout successful, clearing user profile');
        setUserProfile(null);
        setActionToPerform(null);
        setShowLoginModal(false);
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

  // Validate permission for actions
  const validatePermission = (action, request, user) => {
    return canPerformAction(user.role, action, request?.currentStage);
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
    console.log('Action allowed:', action);
  };

  // Only show loading for specific user actions, not initial page load
  // This allows the landing page to render immediately
  const renderTime = performance.now() - (window.appStartTime || performance.now());
  if (renderTime > 50) {
    console.log(`⚡ App rendered in ${renderTime.toFixed(2)}ms`);
  }

  return (
    <div className="min-h-screen">
      <Routes>
        {/* Auth Callback Route - Must be first */}
        <Route
          path="/auth/callback"
          element={<AuthCallback />}
        />

        {/* Landing Page Route */}
        <Route
          path="/"
          element={
            user && userProfile ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LandingPage onGetStarted={handleGetStarted} />
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
        }}
        actionToPerform={actionToPerform}
        getRequiredRole={getRequiredRoleForAction}
      />

      {/* Logout Confirmation */}
      <LogoutConfirmation
        isVisible={showLogoutConfirmation}
        onComplete={handleLogoutConfirmationComplete}
      />
    </div>
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