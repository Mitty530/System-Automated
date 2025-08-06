import React from 'react';

const Input = ({ className = '', variant = 'default', onChange, value, multiline = false, ...props }) => {
  const baseClasses = 'w-full border rounded-2xl px-4 py-3 text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200';
  
  const variants = {
    default: 'bg-white border-gray-200 hover:border-gray-300 focus:border-blue-500',
    search: 'bg-transparent border-none outline-none',
    glass: 'bg-white/50 border-white/20 backdrop-blur-md'
  };

  const classes = `${baseClasses} ${variants[variant]} ${className}`;

  const handleChange = (e) => {
    if (onChange) {
      onChange(e);
    }
  };

  if (multiline) {
    return (
      <textarea 
        className={classes} 
        value={value || ''}
        onChange={handleChange}
        rows={4}
        {...props} 
      />
    );
  }

  return (
    <input 
      className={classes} 
      value={value || ''}
      onChange={handleChange}
      {...props} 
    />
  );
};

export default Input;