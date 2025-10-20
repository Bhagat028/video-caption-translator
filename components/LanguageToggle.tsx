import React from 'react';

interface LanguageToggleProps {
  sourceLang: string;
  targetLang: string;
  activeLang: string;
  onToggle: (lang: string) => void;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ sourceLang, targetLang, activeLang, onToggle }) => {
  return (
    <div className="flex justify-center space-x-1 rounded-lg bg-slate-900/70 p-1">
      <button
        onClick={() => onToggle(sourceLang)}
        aria-pressed={activeLang === sourceLang}
        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
          activeLang === sourceLang
            ? 'bg-indigo-600 text-white shadow'
            : 'text-slate-300 hover:bg-slate-800'
        }`}
      >
        {sourceLang}
      </button>
      <button
        onClick={() => onToggle(targetLang)}
        aria-pressed={activeLang === targetLang}
        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
          activeLang === targetLang
            ? 'bg-indigo-600 text-white shadow'
            : 'text-slate-300 hover:bg-slate-800'
        }`}
      >
        {targetLang}
      </button>
    </div>
  );
};
