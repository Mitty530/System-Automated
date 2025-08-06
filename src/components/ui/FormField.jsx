import React from 'react';
import Input from './Input';
import Select from './Select';

const FormField = ({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  placeholder, 
  required = false,
  error,
  success,
  options = [],
  rows,
  className = '',
  ...props 
}) => {
  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  const getFieldClasses = () => {
    let classes = 'w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-sm hover:shadow-md';
    
    if (error) {
      classes += ' border-red-500 bg-red-50 focus:ring-red-500';
    } else if (success) {
      classes += ' border-green-500 bg-green-50 focus:ring-green-500';
    } else {
      classes += ' border-gray-200 bg-white hover:border-gray-300 focus:border-blue-500';
    }
    
    return `${classes} ${className}`;
  };

  const renderField = () => {
    if (type === 'select') {
      return (
        <select
          value={value || ''}
          onChange={handleChange}
          className={getFieldClasses()}
          {...props}
        >
          <option value="" disabled>
            {placeholder || 'Select an option...'}
          </option>
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (type === 'textarea') {
      return (
        <textarea
          value={value || ''}
          onChange={handleChange}
          rows={rows || 3}
          className={getFieldClasses()}
          placeholder={placeholder}
          {...props}
        />
      );
    }

    return (
      <input
        type={type}
        value={value || ''}
        onChange={handleChange}
        className={getFieldClasses()}
        placeholder={placeholder}
        {...props}
      />
    );
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {renderField()}
      {error && (
        <p className="text-sm text-red-600 flex items-center">
          <span className="mr-1">⚠️</span>
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-green-600 flex items-center">
          <span className="mr-1">✅</span>
          {success}
        </p>
      )}
    </div>
  );
};

export default FormField;