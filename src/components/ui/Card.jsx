import React from 'react';

const Card = ({ children, className = '', variant = 'default', ...props }) => {
  const baseClasses = 'backdrop-blur-xl border border-white/20 shadow-lg';
  
  const variants = {
    default: 'bg-white/80 rounded-3xl',
    glass: 'bg-white/80 rounded-3xl',
    gradient: 'bg-gradient-to-r rounded-3xl',
    stats: 'bg-white/80 rounded-3xl hover:shadow-xl transform hover:scale-105 transition-all duration-300'
  };

  const classes = `${baseClasses} ${variants[variant]} ${className}`;

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export default Card;