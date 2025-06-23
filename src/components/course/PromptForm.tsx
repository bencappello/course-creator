'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useCourseOperations } from '@/hooks/useCourseOperations';

export function PromptForm() {
  const [prompt, setPrompt] = useState('');
  const [numModules, setNumModules] = useState('3');
  const [contentDepth, setContentDepth] = useState('Low');
  const { generateOutline } = useCourseOperations();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      alert('Please enter a course prompt.');
      return;
    }
    generateOutline(prompt, parseInt(numModules), contentDepth);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Design Your Custom Course</h2>
        <p className="text-gray-500 mb-8">What do you want to learn today?</p>
      </div>
      
      <div>
        <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">
          Course Prompt
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none transition text-gray-900 placeholder-gray-500"
          rows={3}
          placeholder="e.g., A course on Brazilian Portuguese for someone who speaks Italian."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="modules" className="block text-sm font-medium text-gray-700">
            Course Length
          </label>
          <select
            id="modules"
            value={numModules}
            onChange={(e) => setNumModules(e.target.value)}
            className="mt-1 w-full p-3 border border-gray-300 rounded-lg text-gray-900"
          >
            <option value="1">1 Module (Quick Start)</option>
            <option value="2">2 Modules (Standard)</option>
            <option value="3">3 Modules (Deep Dive)</option>
          </select>
        </div>

        <div>
          <label htmlFor="depth" className="block text-sm font-medium text-gray-700">
            Content Depth
          </label>
          <select
            id="depth"
            value={contentDepth}
            onChange={(e) => setContentDepth(e.target.value)}
            className="mt-1 w-full p-3 border border-gray-300 rounded-lg text-gray-900"
          >
            <option value="Low">Low (Concise)</option>
            <option value="Medium">Medium (Detailed)</option>
            <option value="High">High (Comprehensive)</option>
          </select>
        </div>
      </div>

      <div className="text-center mt-8">
        <Button type="submit" size="lg">
          Generate Outline
        </Button>
      </div>
    </form>
  );
} 