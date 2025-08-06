import React from 'react';
import Card from './Card';

const FormSection = ({ 
  title, 
  description, 
  children, 
  className = '',
  variant = 'default' 
}) => {
  const getVariantClasses = () => {
    const variants = {
      default: 'bg-gray-50',
      primary: 'bg-blue-50',
      success: 'bg-green-50',
      warning: 'bg-yellow-50',
      info: 'bg-purple-50'
    };
    return variants[variant] || variants.default;
  };

  return (
    <div className={`${getVariantClasses()} rounded-2xl p-6 ${className}`}>
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export default FormSection;