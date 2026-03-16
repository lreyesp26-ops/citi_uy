import React from 'react';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
}

export const Spinner: React.FC<SpinnerProps> = ({ className = '', size = 'md' }) => {
  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
  };
  const numericSize = typeof size === 'number' ? size : sizeMap[size] || 24;
  return <Loader2 size={numericSize} className={`animate-spin text-red-600 ${className}`} />;
};
