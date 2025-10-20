import React from 'react';

interface WordCountControlProps {
  maxWords: number;
  onMaxWordsChange: (count: number) => void;
}

export const WordCountControl: React.FC<WordCountControlProps> = ({ maxWords, onMaxWordsChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      onMaxWordsChange(value);
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor="max-words" className="font-semibold text-slate-300">Words Per Caption</label>
      <input
        id="max-words"
        type="number"
        min="1"
        max="20"
        value={maxWords}
        onChange={handleChange}
        className="w-full p-3 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
      />
    </div>
  );
};