import React from 'react';
import { CaptionStyle } from '../types';
import { FONT_FAMILIES } from '../constants';

interface StylingControlsProps {
  captionStyle: CaptionStyle;
  onStyleChange: (style: CaptionStyle) => void;
  isPresetActive: boolean;
}

const ControlWrapper: React.FC<{ label: string; htmlFor: string; children: React.ReactNode; isPresetActive: boolean }> = ({ label, htmlFor, children, isPresetActive }) => (
  <div className={`space-y-2 transition-opacity duration-300 ${isPresetActive ? 'opacity-50 cursor-not-allowed' : ''}`}>
    <label htmlFor={htmlFor} className="text-sm font-medium text-slate-400">{label}</label>
    <div className={isPresetActive ? 'pointer-events-none' : ''}>
      {children}
    </div>
  </div>
);

export const StylingControls: React.FC<StylingControlsProps> = ({ captionStyle, onStyleChange, isPresetActive }) => {
  const handleStyleChange = (key: keyof CaptionStyle, value: string | number) => {
    onStyleChange({ ...captionStyle, [key]: value });
  };

  const toRgba = (hex: string, opacity: number) => {
      let c: any;
      if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
          c = hex.substring(1).split('');
          if(c.length== 3){
              c= [c[0], c[0], c[1], c[1], c[2], c[2]];
          }
          c= '0x'+c.join('');
          return `rgba(${[(c>>16)&255, (c>>8)&255, c&255].join(',')},${opacity})`;
      }
      return `rgba(0,0,0,${opacity})`;
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-300 border-b border-slate-700 pb-2">Custom Styles</h3>
      
      {isPresetActive && (
          <div className="text-center text-xs text-slate-400 bg-slate-800/50 p-2 rounded-lg">
              Select the "Custom" preset to enable manual editing.
          </div>
      )}

      {/* Text Styling */}
      <div className="space-y-4">
        <h4 className="font-semibold text-slate-300 text-sm">Text</h4>
        <ControlWrapper label="Font Size" htmlFor="font-size" isPresetActive={isPresetActive}>
          <input
            id="font-size" type="range" min="16" max="64"
            value={captionStyle.fontSize}
            onChange={(e) => handleStyleChange('fontSize', parseInt(e.target.value, 10))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="text-right text-xs text-slate-400">{captionStyle.fontSize}px</div>
        </ControlWrapper>
        <ControlWrapper label="Font Weight" htmlFor="font-weight" isPresetActive={isPresetActive}>
          <input
            id="font-weight" type="range" min="100" max="900" step="100"
            value={captionStyle.fontWeight}
            onChange={(e) => handleStyleChange('fontWeight', parseInt(e.target.value, 10))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="text-right text-xs text-slate-400">{captionStyle.fontWeight}</div>
        </ControlWrapper>
        <ControlWrapper label="Font Family" htmlFor="font-family" isPresetActive={isPresetActive}>
          <select
            id="font-family"
            value={captionStyle.fontFamily}
            onChange={(e) => handleStyleChange('fontFamily', e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg cursor-pointer text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {FONT_FAMILIES.map((font) => (
              <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                {font.name}
              </option>
            ))}
          </select>
        </ControlWrapper>
        <ControlWrapper label="Text Alignment" htmlFor="text-align" isPresetActive={isPresetActive}>
          <div className="flex gap-2">
            {(['left', 'center', 'right'] as const).map((align) => (
              <button
                key={align}
                onClick={() => handleStyleChange('textAlign', align)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  captionStyle.textAlign === align
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {align.charAt(0).toUpperCase() + align.slice(1)}
              </button>
            ))}
          </div>
        </ControlWrapper>
        <ControlWrapper label="Letter Spacing" htmlFor="letter-spacing" isPresetActive={isPresetActive}>
          <input
            id="letter-spacing" type="range" min="-2" max="5" step="0.5"
            value={captionStyle.letterSpacing}
            onChange={(e) => handleStyleChange('letterSpacing', parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="text-right text-xs text-slate-400">{captionStyle.letterSpacing}px</div>
        </ControlWrapper>
        <ControlWrapper label="Line Height" htmlFor="line-height" isPresetActive={isPresetActive}>
          <input
            id="line-height" type="range" min="0.8" max="2" step="0.1"
            value={captionStyle.lineHeight}
            onChange={(e) => handleStyleChange('lineHeight', parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="text-right text-xs text-slate-400">{captionStyle.lineHeight}</div>
        </ControlWrapper>
        <ControlWrapper label="Primary Color" htmlFor="primary-color" isPresetActive={isPresetActive}>
          <input
            id="primary-color" type="color"
            value={captionStyle.primaryColor}
            onChange={(e) => handleStyleChange('primaryColor', e.target.value)}
            className="w-full h-10 p-1 bg-slate-900 border border-slate-700 rounded-lg cursor-pointer"
          />
        </ControlWrapper>
        <ControlWrapper label="Highlight Color" htmlFor="active-color" isPresetActive={isPresetActive}>
          <input
            id="active-color" type="color"
            value={captionStyle.activeColor}
            onChange={(e) => handleStyleChange('activeColor', e.target.value)}
            className="w-full h-10 p-1 bg-slate-900 border border-slate-700 rounded-lg cursor-pointer"
          />
        </ControlWrapper>
      </div>

      {/* Outline Styling */}
      <div className="space-y-4">
        <h4 className="font-semibold text-slate-300 text-sm">Outline</h4>
        <ControlWrapper label="Outline Width" htmlFor="outline-width" isPresetActive={isPresetActive}>
          <input
            id="outline-width" type="range" min="0" max="8" step="0.5"
            value={captionStyle.outlineWidth}
            onChange={(e) => handleStyleChange('outlineWidth', parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="text-right text-xs text-slate-400">{captionStyle.outlineWidth}px</div>
        </ControlWrapper>
        <ControlWrapper label="Outline Color" htmlFor="outline-color" isPresetActive={isPresetActive}>
          <input
            id="outline-color" type="color"
            value={captionStyle.outlineColor}
            onChange={(e) => handleStyleChange('outlineColor', e.target.value)}
            className="w-full h-10 p-1 bg-slate-900 border border-slate-700 rounded-lg cursor-pointer"
          />
        </ControlWrapper>
      </div>
      
      {/* Background Styling */}
      <div className="space-y-4">
        <h4 className="font-semibold text-slate-300 text-sm">Background</h4>
         <ControlWrapper label="Background Opacity" htmlFor="bg-opacity" isPresetActive={isPresetActive}>
          <input
            id="bg-opacity" type="range" min="0" max="1" step="0.05"
            value={captionStyle.backgroundOpacity}
            onChange={(e) => handleStyleChange('backgroundOpacity', parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="text-right text-xs text-slate-400">{Math.round(captionStyle.backgroundOpacity * 100)}%</div>
        </ControlWrapper>
        <ControlWrapper label="Background Color" htmlFor="bg-color" isPresetActive={isPresetActive}>
          <input
            id="bg-color" type="color"
            value={captionStyle.backgroundColor}
            onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
            className="w-full h-10 p-1 bg-slate-900 border border-slate-700 rounded-lg cursor-pointer"
            style={{backgroundColor: toRgba(captionStyle.backgroundColor, captionStyle.backgroundOpacity)}}
          />
        </ControlWrapper>
        <ControlWrapper label="Border Radius" htmlFor="border-radius" isPresetActive={isPresetActive}>
          <input
            id="border-radius" type="range" min="0" max="30" step="2"
            value={captionStyle.borderRadius}
            onChange={(e) => handleStyleChange('borderRadius', parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="text-right text-xs text-slate-400">{captionStyle.borderRadius}px</div>
        </ControlWrapper>
      </div>
    </div>
  );
};