import { CaptionPreset, CaptionStyle } from './types';

export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
];

export const ASPECT_RATIOS = ['16:9', '9:16', '1:1', '4:5'];

export const DEFAULT_STYLE: CaptionStyle = {
  fontSize: 32,
  primaryColor: '#FFFFFF',
  activeColor: '#FFFF00',
  outlineColor: '#000000',
  outlineWidth: 2,
  fontWeight: 700,
  backgroundColor: '#000000',
  backgroundOpacity: 0.5,
  position: { x: 50, y: 80 },
};

export const CAPTION_PRESETS: CaptionPreset[] = [
  {
    name: 'Minimalist',
    fontSize: 28,
    primaryColor: '#FFFFFF',
    activeColor: '#FFFFFF', // Same as primary to disable effect
    outlineWidth: 0,
    fontWeight: 500,
    backgroundOpacity: 0,
  },
  {
    name: 'Classic',
    fontSize: 32,
    primaryColor: '#FFFFFF',
    activeColor: '#FFFF00',
    outlineColor: '#000000',
    outlineWidth: 2,
    fontWeight: 700,
    backgroundOpacity: 0.5,
  },
  {
    name: 'Impact',
    fontSize: 48,
    primaryColor: '#FFFF00',
    activeColor: '#FFFFFF',
    outlineColor: '#000000',
    outlineWidth: 3,
    fontWeight: 900,
    backgroundOpacity: 0,
  },
  {
    name: 'Clean',
    fontSize: 30,
    primaryColor: '#000000',
    activeColor: '#4F46E5', // Indigo-600
    outlineWidth: 0,
    fontWeight: 600,
    backgroundColor: '#FFFFFF',
    backgroundOpacity: 0.8,
  },
  {
    name: 'Neon',
    primaryColor: '#39FF14',
    activeColor: '#F0F9FF',
    outlineColor: '#000000',
    outlineWidth: 1,
    fontWeight: 700,
    backgroundOpacity: 0,
  },
  {
    name: 'Karaoke',
    fontSize: 42,
    primaryColor: '#E5E7EB',
    activeColor: '#F87171',
    outlineColor: '#000000',
    outlineWidth: 3,
    fontWeight: 900,
    backgroundOpacity: 0.2,
  },
];