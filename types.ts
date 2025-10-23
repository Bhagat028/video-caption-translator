export interface Caption {
  text: string;
  start: number;
  end: number;
}

export interface TranslationResponse {
  sourceLanguage: string;
  originalCaptions: Caption[];
  translatedCaptions: Caption[];
}

export interface CaptionStyle {
  fontSize: number;
  primaryColor: string;
  activeColor: string;
  outlineColor: string;
  outlineWidth: number;
  fontWeight: number;
  backgroundColor: string;
  backgroundOpacity: number;
  position: {
    x: number; // percentage
    y: number; // percentage
  };
}

export interface CaptionPreset extends Partial<CaptionStyle> {
    name: string;
}