import React from 'react';
import { AlertCircle, Lock } from 'lucide-react';
import Card from './ui/Card';
import { hasPermission, canPerformAction, getRoleDisplayName } from '../utils/rolePermissions';

const PermissionGuard = ({
  children,
  requiredPermission = null,
  requiredAction = null,
  userRole = null,
  requestStage = null,
  requestCreatedBy = null,
  currentUserId = null,
  fallback = null,
  showError = true
}) => {
  // If no permission requirements specified, allow access
  if (!requiredPermission && !requiredAction) {
    return children;
  }

  // Check permission-based access
  if (requiredPermission && !hasPermission(userRole, requiredPermission)) {
    return fallback || (showError ? (
      <Card className="p-6 text-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600 mb-4">
              You don't have permission to access this feature.
            </p>
            <div className="text-sm text-gray-500">
              <p>Your role: <span className="font-medium">{getRoleDisplayName(userRole)}</span></p>
              <p>Required permission: <span className="font-medium">{requiredPermission}</span></p>
            </div>
          </div>
        </div>
      </Card>
    ) : null);
  }

  // Check action-based access
  if (requiredAction && !canPerformAction(userRole, requiredAction, requestStage, requestCreatedBy, currentUserId)) {
    return fallback || (showError ? (
      <Card className="p-6 text-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Action Not Allowed</h3>
            <p className="text-gray-600 mb-4">
              You cannot perform this action at the current workflow stage.
            </p>
            <div className="text-sm text-gray-500">
              <p>Your role: <span className="font-medium">{getRoleDisplayName(userRole)}</span></p>
              <p>Action: <span className="font-medium">{requiredAction}</span></p>
              {requestStage && <p>Current stage: <span className="font-medium">{requestStage}</span></p>}
            </div>
          </div>
        </div>
      </Card>
    ) : null);
  }

  // Permission granted, render children
  return children;
};

export default PermissionGuard;