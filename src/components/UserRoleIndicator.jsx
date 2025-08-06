import React from 'react';
import { Shield, User, Settings, Eye, Building, DollarSign } from 'lucide-react';
import Badge from './ui/Badge';
import { getRoleDisplayName, getRoleColor, USER_ROLES } from '../utils/rolePermissions';

const UserRoleIndicator = ({ userRole, showIcon = true, showLabel = true, size = 'sm' }) => {
  const getRoleIcon = (role) => {
    const icons = {
      [USER_ROLES.ADMIN]: Shield,
      [USER_ROLES.ARCHIVE_TEAM]: Building,
      [USER_ROLES.OPERATIONS_TEAM]: Settings,
      [USER_ROLES.CORE_BANKING]: DollarSign,
      [USER_ROLES.LOAN_ADMINISTRATOR]: User,
      [USER_ROLES.OBSERVER]: Eye
    };
    return icons[role] || User;
  };

  const IconComponent = getRoleIcon(userRole);
  const roleColor = getRoleColor(userRole);
  const roleName = getRoleDisplayName(userRole);

  const iconSize = size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';

  return (
    <div className="flex items-center space-x-2">
      {showIcon && (
        <div className={`p-1 rounded-lg ${roleColor.replace('text-', 'bg-').replace('-800', '-100')}`}>
          <IconComponent className={`${iconSize} ${roleColor.split(' ')[1]}`} />
        </div>
      )}
      {showLabel && (
        <Badge variant="default" className={roleColor}>
          {roleName}
        </Badge>
      )}
    </div>
  );
};

export default UserRoleIndicator;