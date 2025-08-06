import React from 'react';

const Select = ({ children, className = '', onChange, value, ...props }) => {
  const classes = `w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${className}`;

  const handleChange = (e) => {
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <select 
      className={classes} 
      value={value || ''}
      onChange={handleChange}
      {...props}
    >
      {children}
    </select>
  );
};

export default Select;