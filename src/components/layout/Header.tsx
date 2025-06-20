'use client';

import React from 'react';
import { Menu } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="text-center mb-10 relative">
      <button 
        onClick={onMenuClick}
        className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-white/50 transition-colors"
      >
        <Menu className="h-6 w-6 text-gray-600" />
      </button>
      <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
        Agentic Course Designer
      </h1>
      <p className="text-gray-500 mt-2 text-lg">
        Your personal AI-powered learning architect.
      </p>
    </header>
  );
} 