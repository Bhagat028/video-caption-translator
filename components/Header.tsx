
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-slate-900/50 backdrop-blur-sm border-b border-slate-800 sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            <span className="text-indigo-400">Gemini</span> Caption Translator
          </h1>
          <p className="text-sm text-slate-400 mt-1">Translate and style video captions with AI</p>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM2 10a8 8 0 1116 0 8 8 0 01-16 0zm5-2.5a.5.5 0 011 0v5a.5.5 0 01-1 0v-5zM12 7.5a.5.5 0 011 0v5a.5.5 0 01-1 0v-5z" clipRule="evenodd" />
        </svg>
      </div>
    </header>
  );
};
