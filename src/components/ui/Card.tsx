import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'small' | 'normal' | 'large';
}

export const Card: React.FC<CardProps> = ({ children, className = '', padding = 'normal' }) => {
  const paddingMap = {
    none: '',
    small: 'p-4',
    normal: 'p-6',
    large: 'p-8',
  };

  return (
    <div className={`bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 ${paddingMap[padding]} ${className}`}>
      {children}
    </div>
  );
};
