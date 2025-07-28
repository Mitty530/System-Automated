import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AuditTrailService } from '../../lib/auditTrail';
import Header from './Header';
import Sidebar from './Sidebar';
import Breadcrumbs from './Breadcrumbs';

interface MainLayoutProps {
  children?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const [previousPath, setPreviousPath] = useState<string>('');

  // Track navigation for audit trail
  useEffect(() => {
    if (previousPath && previousPath !== location.pathname) {
      AuditTrailService.logNavigation(previousPath, location.pathname, {
        user_role: user?.role,
        timestamp: new Date().toISOString()
      });
    }
    setPreviousPath(location.pathname);
  }, [location.pathname, previousPath, user?.role]);

  // Log page views
  useEffect(() => {
    AuditTrailService.logDataAccess('page', 'view', location.pathname, {
      page_title: document.title,
      referrer: document.referrer,
      user_role: user?.role
    });
  }, [location.pathname, user?.role]);

  // Handle sidebar toggle
  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
    AuditTrailService.logUserActivity('view', `Sidebar ${sidebarOpen ? 'closed' : 'opened'}`);
  };

  // Handle sidebar collapse
  const handleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
    AuditTrailService.logUserActivity('view', `Sidebar ${sidebarCollapsed ? 'expanded' : 'collapsed'}`);
  };

  // Close sidebar on mobile when clicking outside
  const handleOverlayClick = () => {
    if (sidebarOpen) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onToggle={handleSidebarToggle}
        onCollapse={handleSidebarCollapse}
      />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={handleOverlayClick}
        />
      )}

      {/* Main content area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
      }`}>
        {/* Header */}
        <Header
          onSidebarToggle={handleSidebarToggle}
          sidebarOpen={sidebarOpen}
        />

        {/* Breadcrumbs */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-3">
          <Breadcrumbs />
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children || <Outlet />}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500">
              <div className="flex items-center space-x-4">
                <span>© 2024 ADFD Tracking System</span>
                <span>•</span>
                <span>Version 1.0.0</span>
              </div>
              <div className="flex items-center space-x-4 mt-2 sm:mt-0">
                <span>User: {user?.name}</span>
                <span>•</span>
                <span>Role: {user?.role}</span>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Online</span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;
