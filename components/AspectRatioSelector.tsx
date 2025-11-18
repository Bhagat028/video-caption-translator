import React from 'react';
import { ASPECT_RATIOS } from '../constants';

interface AspectRatioSelectorProps {
  selectedRatio: string;
  onRatioChange: (ratio: string) => void;
}

export const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({ selectedRatio, onRatioChange }) => {
  return (
    <div className="space-y-3">
      <label className="font-semibold text-slate-300">Video Format</label>
      <div className="space-y-2">
        {ASPECT_RATIOS.map((item) => (
          <button
            key={item.ratio}
            onClick={() => onRatioChange(item.ratio)}
            aria-pressed={selectedRatio === item.ratio}
            className={`w-full p-3 rounded-lg border transition-all duration-200 text-left ${
              selectedRatio === item.ratio
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-semibold text-sm">{item.name}</div>
                <div className={`text-xs mt-0.5 ${
                  selectedRatio === item.ratio ? 'text-indigo-100' : 'text-slate-500'
                }`}>
                  {item.description}
                </div>
              </div>
              <div className={`font-mono text-xs px-2 py-1 rounded ${
                selectedRatio === item.ratio
                  ? 'bg-indigo-700 text-indigo-100'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {item.ratio}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};