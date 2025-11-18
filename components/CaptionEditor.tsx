import React, { useState } from 'react';
import { Caption } from '../types';

interface CaptionEditorProps {
  captions: Caption[];
  onCaptionsChange: (captions: Caption[]) => void;
}

export const CaptionEditor: React.FC<CaptionEditorProps> = ({ captions, onCaptionsChange }) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleTextChange = (index: number, newText: string) => {
    const updatedCaptions = [...captions];
    updatedCaptions[index] = { ...updatedCaptions[index], text: newText };
    onCaptionsChange(updatedCaptions);
  };

  const handleTimingChange = (index: number, field: 'start' | 'end', value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) return;

    const updatedCaptions = [...captions];
    updatedCaptions[index] = { ...updatedCaptions[index], [field]: numValue };
    onCaptionsChange(updatedCaptions);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    return `${mins}:${secs.padStart(5, '0')}`;
  };

  const handleDelete = (index: number) => {
    const updatedCaptions = captions.filter((_, i) => i !== index);
    onCaptionsChange(updatedCaptions);
  };

  if (captions.length === 0) {
    return (
      <div className="text-center text-slate-400 py-8">
        No captions to edit. Generate captions first.
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
      <div className="flex justify-between items-center mb-4 sticky top-0 bg-slate-900 pb-2 z-10">
        <h3 className="text-lg font-semibold text-slate-300">Edit Captions</h3>
        <span className="text-sm text-slate-400">{captions.length} captions</span>
      </div>

      {captions.map((caption, index) => (
        <div
          key={index}
          className="bg-slate-800 p-4 rounded-lg space-y-2 border border-slate-700 hover:border-slate-600 transition-colors"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded">
                  #{index + 1}
                </span>
                <span className="text-xs text-slate-500">
                  {formatTime(caption.start)} → {formatTime(caption.end)}
                </span>
              </div>

              <textarea
                value={caption.text}
                onChange={(e) => handleTextChange(index, e.target.value)}
                onFocus={() => setEditingIndex(index)}
                onBlur={() => setEditingIndex(null)}
                className={`w-full bg-slate-900 text-slate-200 px-3 py-2 rounded border ${
                  editingIndex === index ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-700'
                } focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none`}
                rows={2}
                placeholder="Caption text..."
              />
            </div>

            <button
              onClick={() => handleDelete(index)}
              className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-2 rounded transition-colors"
              title="Delete caption"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Timing Controls */}
          <details className="text-xs">
            <summary className="cursor-pointer text-slate-500 hover:text-slate-400 select-none">
              Adjust timing
            </summary>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 block mb-1">Start (seconds)</label>
                <input
                  type="number"
                  value={caption.start.toFixed(2)}
                  onChange={(e) => handleTimingChange(index, 'start', e.target.value)}
                  step="0.1"
                  min="0"
                  className="w-full bg-slate-900 text-slate-200 px-2 py-1 rounded border border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">End (seconds)</label>
                <input
                  type="number"
                  value={caption.end.toFixed(2)}
                  onChange={(e) => handleTimingChange(index, 'end', e.target.value)}
                  step="0.1"
                  min="0"
                  className="w-full bg-slate-900 text-slate-200 px-2 py-1 rounded border border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </details>
        </div>
      ))}
    </div>
  );
};
