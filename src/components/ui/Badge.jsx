import React from 'react';

const Badge = ({ children, variant = 'default', className = '' }) => {
  const baseClasses = 'px-2 py-1 text-xs font-medium rounded-lg border';
  
  const variants = {
    default: 'bg-gray-100 text-gray-800 border-gray-200',
    urgent: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    medium: 'bg-blue-100 text-blue-800 border-blue-200',
    low: 'bg-gray-100 text-gray-800 border-gray-200',
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  };

  const classes = `${baseClasses} ${variants[variant]} ${className}`;

  return (
    <span className={classes}>
      {children}
    </span>
  );
};

export default Badge;