import React, { useState, useEffect } from 'react';

const NotificationToggle = ({ 
  title, 
  description, 
  defaultChecked = false, 
  color = 'blue',
  onChange 
}) => {
  const [isChecked, setIsChecked] = useState(defaultChecked);
  const [isSaving, setIsSaving] = useState(false);

  // Auto-save functionality
  useEffect(() => {
    if (isChecked !== defaultChecked) {
      setIsSaving(true);
      
      // Save immediately without delay
      setIsSaving(false);
      if (onChange) {
        onChange(isChecked);
      }


    }
  }, [isChecked, defaultChecked, onChange, title]);

  const handleToggle = () => {
    setIsChecked(!isChecked);
  };

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      checkbox: 'text-blue-600 focus:ring-blue-500',
      saving: 'text-blue-500'
    },
    green: {
      bg: 'bg-green-50',
      checkbox: 'text-green-600 focus:ring-green-500',
      saving: 'text-green-500'
    },
    orange: {
      bg: 'bg-orange-50',
      checkbox: 'text-orange-600 focus:ring-orange-500',
      saving: 'text-orange-500'
    },
    purple: {
      bg: 'bg-purple-50',
      checkbox: 'text-purple-600 focus:ring-purple-500',
      saving: 'text-purple-500'
    }
  };

  const currentColor = colorClasses[color] || colorClasses.blue;

  return (
    <div className={`flex items-center justify-between p-4 ${currentColor.bg} rounded-xl transition-all duration-200`}>
      <div className="flex-1">
        <h5 className="font-medium text-gray-800">{title}</h5>
        <p className="text-sm text-gray-600">{description}</p>
        {isSaving && (
          <p className={`text-xs ${currentColor.saving} mt-1 flex items-center`}>
            <span className="animate-spin mr-1">⟳</span>
            Saving...
          </p>
        )}
      </div>
      <div className="flex items-center">
        <input 
          type="checkbox" 
          checked={isChecked}
          onChange={handleToggle}
          className={`w-5 h-5 ${currentColor.checkbox} rounded focus:ring-2 transition-all duration-200 cursor-pointer`}
          disabled={isSaving}
        />
      </div>
    </div>
  );
};

export default NotificationToggle;