import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path: string;
  isActive?: boolean;
}

const Breadcrumbs: React.FC = () => {
  const location = useLocation();

  // Define route mappings for breadcrumb labels
  const routeLabels: { [key: string]: string } = {
    '/dashboard': 'Dashboard',
    '/requests': 'Requests',
    '/requests/create': 'Create Request',
    '/requests/pending': 'Pending Approval',
    '/requests/approved': 'Approved',
    '/requests/disbursement': 'Disbursement',
    '/requests/overdue': 'Overdue',
    '/analytics': 'Analytics',
    '/analytics/performance': 'Performance',
    '/analytics/reports': 'Reports',
    '/users': 'User Management',
    '/audit': 'Audit Trail',
    '/archive': 'Archive',
    '/security': 'Security',
    '/settings': 'Settings',
    '/profile': 'Profile',
    '/help': 'Help & Support'
  };

  // Generate breadcrumb items from current path
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(segment => segment !== '');
    const breadcrumbs: BreadcrumbItem[] = [];

    // Always start with Dashboard as home
    breadcrumbs.push({
      label: 'Dashboard',
      path: '/dashboard',
      isActive: location.pathname === '/dashboard' || location.pathname === '/'
    });

    // If we're not on dashboard, build the breadcrumb trail
    if (location.pathname !== '/dashboard' && location.pathname !== '/') {
      let currentPath = '';
      
      pathSegments.forEach((segment, index) => {
        currentPath += `/${segment}`;
        const isLast = index === pathSegments.length - 1;
        
        // Get label from route mappings or format the segment
        const label = routeLabels[currentPath] || 
          segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

        breadcrumbs.push({
          label,
          path: currentPath,
          isActive: isLast
        });
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't show breadcrumbs if there's only one item (Dashboard)
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={breadcrumb.path} className="flex items-center">
            {index > 0 && (
              <ChevronRight 
                size={16} 
                className="text-gray-400 mx-2 flex-shrink-0" 
                aria-hidden="true" 
              />
            )}
            
            <div className="flex items-center">
              {index === 0 && (
                <Home 
                  size={16} 
                  className="text-gray-400 mr-2 flex-shrink-0" 
                  aria-hidden="true" 
                />
              )}
              
              {breadcrumb.isActive ? (
                <span 
                  className="text-sm font-medium text-gray-900"
                  aria-current="page"
                >
                  {breadcrumb.label}
                </span>
              ) : (
                <Link
                  to={breadcrumb.path}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                  {breadcrumb.label}
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
