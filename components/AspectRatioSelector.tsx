import React from 'react';
import { ASPECT_RATIOS } from '../constants';

interface AspectRatioSelectorProps {
  selectedRatio: string;
  onRatioChange: (ratio: string) => void;
}

export const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({ selectedRatio, onRatioChange }) => {
  return (
    <div className="space-y-2">
      <label className="font-semibold text-slate-300">Aspect Ratio</label>
      <div className="flex space-x-2">
        {ASPECT_RATIOS.map((ratio) => (
          <button
            key={ratio}
            onClick={() => onRatioChange(ratio)}
            aria-pressed={selectedRatio === ratio}
            className={`w-full p-3 rounded-lg border transition-colors duration-200 ${
              selectedRatio === ratio
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {ratio}
          </button>
        ))}
      </div>
    </div>
  );
};