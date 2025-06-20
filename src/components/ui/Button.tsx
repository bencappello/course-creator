import React from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  className, 
  children, 
  ...props 
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'bg-indigo-600 text-white hover:bg-indigo-700 hover:transform hover:-translate-y-1 hover:shadow-lg': variant === 'primary',
          'bg-gray-200 text-gray-700 border border-gray-300 hover:bg-gray-300 hover:transform hover:-translate-y-1': variant === 'secondary',
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-6 py-3 text-base': size === 'md',
          'px-8 py-4 text-lg': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
} 