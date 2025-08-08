import React, { useState } from 'react';
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
  suggestions = [],
  rows,
  className = '',
  ...props
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
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

    // For fields with suggestions, render input with datalist
    if (suggestions && suggestions.length > 0) {
      const datalistId = `suggestions-${label?.replace(/\s+/g, '-').toLowerCase()}`;

      return (
        <div className="relative">
          <input
            type={type}
            value={value || ''}
            onChange={handleChange}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className={getFieldClasses()}
            placeholder={placeholder}
            list={datalistId}
            {...props}
          />
          <datalist id={datalistId}>
            {suggestions.map((suggestion, index) => (
              <option key={index} value={suggestion} />
            ))}
          </datalist>
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none first:rounded-t-lg last:rounded-b-lg"
                  onClick={() => {
                    onChange(suggestion);
                    setShowSuggestions(false);
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
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