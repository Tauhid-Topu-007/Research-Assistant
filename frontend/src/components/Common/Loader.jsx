import React from 'react';

const Loader = ({ size = 'medium', color = 'blue', text = 'Loading...' }) => {
  const sizeClasses = {
    small: 'h-6 w-6',
    medium: 'h-12 w-12',
    large: 'h-16 w-16'
  };

  const colorClasses = {
    blue: 'border-blue-600',
    white: 'border-white',
    gray: 'border-gray-600'
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div 
        className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-t-transparent ${colorClasses[color]}`}
      ></div>
      {text && <p className="mt-3 text-gray-600 text-sm">{text}</p>}
    </div>
  );
};

export default Loader;