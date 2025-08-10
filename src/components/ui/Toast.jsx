import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const Toast = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleShowToast = (event) => {
      const { type, title, message, duration = 5000 } = event.detail;
      const id = Date.now() + Math.random();
      
      const newToast = {
        id,
        type,
        title,
        message,
        duration
      };

      setToasts(prev => [...prev, newToast]);

      // Auto-remove toast after duration
      setTimeout(() => {
        removeToast(id);
      }, duration);
    };

    window.addEventListener('show-toast', handleShowToast);
    return () => window.removeEventListener('show-toast', handleShowToast);
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const getToastStyles = (type) => {
    const baseStyles = "flex items-start p-4 mb-3 rounded-lg shadow-lg border-l-4 bg-white";
    
    switch (type) {
      case 'success':
        return `${baseStyles} border-green-500`;
      case 'error':
        return `${baseStyles} border-red-500`;
      case 'warning':
        return `${baseStyles} border-yellow-500`;
      case 'info':
      default:
        return `${baseStyles} border-blue-500`;
    }
  };

  const getIcon = (type) => {
    const iconProps = { className: "w-5 h-5 mr-3 mt-0.5 flex-shrink-0" };
    
    switch (type) {
      case 'success':
        return <CheckCircle {...iconProps} className={`${iconProps.className} text-green-500`} />;
      case 'error':
        return <AlertCircle {...iconProps} className={`${iconProps.className} text-red-500`} />;
      case 'warning':
        return <AlertTriangle {...iconProps} className={`${iconProps.className} text-yellow-500`} />;
      case 'info':
      default:
        return <Info {...iconProps} className={`${iconProps.className} text-blue-500`} />;
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${getToastStyles(toast.type)} animate-slide-in-right`}
        >
          {getIcon(toast.type)}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-gray-900 mb-1">
              {toast.title}
            </h4>
            <p className="text-sm text-gray-600 break-words">
              {toast.message}
            </p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

// Utility function to show toast from anywhere in the app
export const showToast = (type, title, message, duration = 5000) => {
  const event = new CustomEvent('show-toast', {
    detail: { type, title, message, duration }
  });
  window.dispatchEvent(event);
};

export default Toast;
