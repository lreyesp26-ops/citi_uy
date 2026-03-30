import React, { ButtonHTMLAttributes } from 'react';
import { Spinner } from './Spinner';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  isLoading = false,
  variant = 'primary',
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  const widthClasses = fullWidth ? 'w-full' : '';
  const paddingClasses = 'px-4 py-2.5';

  const variants = {
    primary: 'bg-gradient-to-r from-red-700 via-red-600 to-red-800 text-white hover:from-red-800 hover:via-red-700 hover:to-red-900 focus:ring-red-500 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-red-500 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed',
    ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed',
  };

  return (
    <button
      className={`${baseClasses} ${paddingClasses} ${widthClasses} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Spinner className="text-current" size={18} />}
      {children}
    </button>
  );
};