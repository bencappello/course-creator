'use client';

import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  onNewCourse?: () => void;
}

export function Layout({ children, onNewCourse }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleNewCourse = () => {
    setSidebarOpen(false);
    onNewCourse?.();
  };

  return (
    <div className="min-h-screen">
      <Sidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewCourse={handleNewCourse}
      />
      
      <div className="app-container">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        {children}
      </div>
    </div>
  );
} 