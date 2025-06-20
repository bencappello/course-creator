import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={clsx(
      'bg-white/80 backdrop-blur-lg border border-black/5 rounded-2xl shadow-xl p-10 transition-all duration-300',
      className
    )}>
      {children}
    </div>
  );
} 