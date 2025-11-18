import React from 'react';
import { Caption } from '../types';

interface CaptionDebugPanelProps {
  captions: Caption[];
  currentTime: number;
  activeCaption: Caption | undefined;
}

export const CaptionDebugPanel: React.FC<CaptionDebugPanelProps> = ({ captions, currentTime, activeCaption }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const activeCaptionIndex = captions.findIndex(c => c === activeCaption);
  const maxCaptionTime = captions.length > 0 ? Math.max(...captions.map(c => c.end)) : 0;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-xs font-mono">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-slate-300 font-semibold">Caption Debug Info</h4>
        <button
          onClick={() => {
            console.log('=== CAPTION DEBUG ===');
            console.log('Current Time:', currentTime);
            console.log('Total Captions:', captions.length);
            console.log('Active Caption:', activeCaption);
            console.log('All Captions:', captions);
          }}
          className="text-indigo-400 hover:text-indigo-300 text-xs"
        >
          Log to Console
        </button>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-slate-500">Current Time:</span>
            <span className="text-green-400 ml-2 font-bold">{formatTime(currentTime)}</span>
          </div>
          <div>
            <span className="text-slate-500">Total Captions:</span>
            <span className="text-blue-400 ml-2 font-bold">{captions.length}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-slate-500">Active Caption:</span>
            <span className={`ml-2 font-bold ${activeCaption ? 'text-green-400' : 'text-red-400'}`}>
              {activeCaption ? `#${activeCaptionIndex + 1}` : 'None'}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Max Caption Time:</span>
            <span className="text-purple-400 ml-2 font-bold">{formatTime(maxCaptionTime)}</span>
          </div>
        </div>

        {activeCaption && (
          <div className="mt-3 pt-3 border-t border-slate-700">
            <div className="text-slate-400 mb-1">Active Caption Details:</div>
            <div className="bg-slate-900 p-2 rounded">
              <div className="text-slate-300 mb-1">"{activeCaption.text}"</div>
              <div className="text-slate-500">
                {formatTime(activeCaption.start)} → {formatTime(activeCaption.end)}
              </div>
            </div>
          </div>
        )}

        {!activeCaption && currentTime > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-700">
            <div className="text-yellow-400 text-xs">
              ⚠️ No caption active at {formatTime(currentTime)}
            </div>
            <div className="text-slate-500 text-xs mt-1">
              Checking nearby captions...
            </div>
            {captions
              .filter(c => Math.abs(c.start - currentTime) < 5 || Math.abs(c.end - currentTime) < 5)
              .slice(0, 3)
              .map((c, i) => (
                <div key={i} className="text-slate-400 text-xs mt-1">
                  • {formatTime(c.start)} - {formatTime(c.end)}: "{c.text.substring(0, 30)}..."
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
