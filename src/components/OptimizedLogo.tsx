import React, { memo } from 'react';

interface OptimizedLogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  inverted?: boolean;
}

// Memoized SVG logo component to prevent unnecessary re-renders
const OptimizedLogo: React.FC<OptimizedLogoProps> = memo(({
  size = 40,
  className = '',
  style = {},
  inverted = false
}) => {
  const gradientId = `logo-gradient-${Math.random().toString(36).substr(2, 9)}`;
  const tealGradientId = `logo-teal-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={`optimized-logo ${className}`}
      style={{
        display: 'block',
        ...style
      }}
      aria-label="Quandrox Logo"
      role="img"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop 
            offset="0%" 
            style={{ 
              stopColor: inverted ? '#ffffff' : '#1e3a8a', 
              stopOpacity: 1 
            }} 
          />
          <stop 
            offset="100%" 
            style={{ 
              stopColor: inverted ? '#e2e8f0' : '#312e81', 
              stopOpacity: 1 
            }} 
          />
        </linearGradient>
        <linearGradient id={tealGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop 
            offset="0%" 
            style={{ 
              stopColor: inverted ? '#f0fdfa' : '#14b8a6', 
              stopOpacity: 1 
            }} 
          />
          <stop 
            offset="100%" 
            style={{ 
              stopColor: inverted ? '#ccfbf1' : '#0d9488', 
              stopOpacity: 1 
            }} 
          />
        </linearGradient>
      </defs>
      
      {/* Dark Blue Circle (majority) */}
      <path 
        d="M100 15 A85 85 0 1 1 100 185 A85 85 0 0 1 100 15 Z" 
        fill={`url(#${gradientId})`}
      />
      
      {/* Teal Green Quarter Circle */}
      <path 
        d="M100 100 L185 100 A85 85 0 0 1 100 185 Z" 
        fill={`url(#${tealGradientId})`}
      />
      
      {/* Inner Circle (hole) */}
      <circle 
        cx="100" 
        cy="100" 
        r="35" 
        fill={inverted ? '#1e293b' : '#f8fafc'}
      />
      
      {/* Q Tail extending outward */}
      <path 
        d="M135 135 L160 160 L155 165 L130 140" 
        fill={`url(#${tealGradientId})`}
      />
      <path 
        d="M140 140 L175 175 L170 180 L135 145" 
        fill={`url(#${tealGradientId})`}
      />
    </svg>
  );
});

OptimizedLogo.displayName = 'OptimizedLogo';

export default OptimizedLogo;
