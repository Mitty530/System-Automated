import React, { memo } from 'react';
import { DollarSign } from 'lucide-react';

const OptimizedLogo = memo(({ size = 32, className = '' }) => {
  return (
    <div 
      className={`bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg ${className}`}
      style={{ 
        width: size, 
        height: size,
        minWidth: size,
        minHeight: size
      }}
    >
      <DollarSign 
        size={Math.floor(size * 0.6)} 
        className="text-white" 
      />
    </div>
  );
});

OptimizedLogo.displayName = 'OptimizedLogo';

export default OptimizedLogo;
