import React from 'react';
import { CaptionPreset } from '../types';
import { CAPTION_PRESETS } from '../constants';

interface PresetSelectorProps {
  activePreset: string;
  onPresetSelect: (preset: CaptionPreset) => void;
}

const customPreset: CaptionPreset = { name: 'Custom' };
const allPresets = [...CAPTION_PRESETS, customPreset];

export const PresetSelector: React.FC<PresetSelectorProps> = ({ activePreset, onPresetSelect }) => {
  return (
    <div className="space-y-2 relative z-10">
      <label className="font-semibold text-slate-300">Style Presets</label>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-2">
        {allPresets.map((preset) => {
          const hasKaraokeEffect = preset.name !== 'Custom' && preset.primaryColor !== preset.activeColor && preset.activeColor;

          const presetStyle: React.CSSProperties = {
            color: preset.primaryColor || '#FFFFFF',
            backgroundColor: '#334155', // slate-700
            WebkitTextStroke: `${preset.outlineWidth ?? 2}px ${preset.outlineColor || '#000000'}`,
            fontWeight: preset.fontWeight || 700,
            pointerEvents: 'none', // Text shouldn't capture clicks
          };

          if (hasKaraokeEffect) {
            presetStyle.background = `linear-gradient(to right, ${preset.activeColor} 50%, ${preset.primaryColor} 50%)`;
            presetStyle.WebkitBackgroundClip = 'text';
            presetStyle.WebkitTextFillColor = 'transparent';
            delete presetStyle.color;
          }

          return (
            <button
              key={preset.name}
              onClick={() => onPresetSelect(preset)}
              aria-pressed={activePreset === preset.name}
              className={`p-2 border rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors cursor-pointer ${
                  activePreset === preset.name ? 'border-indigo-500 bg-slate-800' : 'border-slate-700'
              }`}
              type="button"
            >
              <div
                className="w-full h-8 rounded flex items-center justify-center text-xs font-bold pointer-events-none"
                style={presetStyle}
              >
                Aa
              </div>
              <p className="mt-2 text-sm text-slate-400 text-center truncate pointer-events-none">{preset.name}</p>
            </button>
          )
        })}
      </div>
    </div>
  );
};