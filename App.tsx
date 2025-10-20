import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { FileUploader } from './components/FileUploader';
import { LanguageSelector } from './components/LanguageSelector';
import { WordCountControl } from './components/WordCountControl';
import { AspectRatioSelector } from './components/AspectRatioSelector';
import { PresetSelector } from './components/PresetSelector';
import { StylingControls } from './components/StylingControls';
import { VideoPlayer } from './components/VideoPlayer';
import { Loader } from './components/Loader';
import { LanguageToggle } from './components/LanguageToggle';
import { generateAndTranslateCaptions } from './services/geminiService';
import { Caption, CaptionStyle, CaptionPreset, TranslationResponse } from './types';
import { DEFAULT_STYLE, LANGUAGES, ASPECT_RATIOS } from './constants';

function App() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [translationResponse, setTranslationResponse] = useState<TranslationResponse | null>(null);
  const [activeCaptions, setActiveCaptions] = useState<Caption[]>([]);
  const [activeLang, setActiveLang] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- User Controls State ---
  const [selectedLanguage, setSelectedLanguage] = useState<string>(LANGUAGES[1].name); // Default to Spanish
  const [maxWords, setMaxWords] = useState(10);
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[0]); // Default to 16:9
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>(DEFAULT_STYLE);
  const [activePreset, setActivePreset] = useState<string>('Classic');

  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      setVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [videoFile]);

  const handleFileChange = (file: File | null) => {
    console.log('[App] onFileChange called with:', file ? {
      name: file.name,
      type: file.type,
      sizeBytes: file.size,
      sizeMB: (file.size / (1024 * 1024)).toFixed(2),
    } : 'null');
    setVideoFile(file);
    setTranslationResponse(null);
    setActiveCaptions([]);
    setError(null);
    setVideoUrl(null);
  };

  const handleGenerateClick = async () => {
    console.log('[App] Generate button clicked');
    if (!videoFile) {
      console.log('[App] No video file selected');
      setError('Please upload a video file first.');
      return;
    }
    console.log('[App] Starting caption generation...');
    setIsLoading(true);
    setError(null);
    setTranslationResponse(null);

    try {
      console.log('[App] Calling generateAndTranslateCaptions...');
      const t0 = performance.now();
      const response = await generateAndTranslateCaptions(videoFile, selectedLanguage, maxWords);
      const t1 = performance.now();
      console.log('[App] generateAndTranslateCaptions completed in', Math.round(t1 - t0), 'ms');
      console.log('[App] ✓ Captions generated successfully!');
      setTranslationResponse(response);
      setActiveCaptions(response.translatedCaptions);
      setActiveLang(selectedLanguage);
    } catch (e: any) {
      console.error('[App] ❌ Failed to generate captions:');
      console.error('[App] Error:', e);
      setError('Failed to generate captions. Please check the console for details.');
    } finally {
      setIsLoading(false);
      console.log('[App] Loading state reset');
    }
  };

  const handlePresetSelect = (preset: CaptionPreset) => {
    if (preset.name === 'Custom') {
        setActivePreset('Custom');
    } else {
        const newStyle: CaptionStyle = {
            ...DEFAULT_STYLE,
            ...preset,
            position: captionStyle.position, // Keep position across presets
        };
        setCaptionStyle(newStyle);
        setActivePreset(preset.name);
    }
  };

  const handleLanguageToggle = (lang: string) => {
      if (!translationResponse) return;
      if (lang === selectedLanguage) {
          setActiveCaptions(translationResponse.translatedCaptions);
      } else {
          setActiveCaptions(translationResponse.originalCaptions);
      }
      setActiveLang(lang);
  };

  const isPresetActive = activePreset !== 'Custom';

  return (
    <div className="bg-slate-950 text-white min-h-screen font-sans">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Controls */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900 p-6 rounded-lg shadow-lg space-y-6">
                <FileUploader onFileChange={handleFileChange} />
                <LanguageSelector selectedLanguage={selectedLanguage} onLanguageChange={setSelectedLanguage} />
                <WordCountControl maxWords={maxWords} onMaxWordsChange={setMaxWords} />
                <AspectRatioSelector selectedRatio={aspectRatio} onRatioChange={setAspectRatio} />
            </div>
            
            <button
                onClick={handleGenerateClick}
                disabled={!videoFile || isLoading}
                className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                  <>
                      <div className="w-6 h-6 border-2 border-dashed rounded-full animate-spin border-white"></div>
                      <span>Generating...</span>
                  </>
              ) : (
                  'Generate & Translate Captions'
              )}
            </button>
            {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}

            <div className="bg-slate-900 p-6 rounded-lg shadow-lg space-y-6">
              <PresetSelector activePreset={activePreset} onPresetSelect={handlePresetSelect} />
              <StylingControls captionStyle={captionStyle} onStyleChange={setCaptionStyle} isPresetActive={isPresetActive} />
            </div>
          </div>

          {/* Right Column: Video Player */}
          <div className="lg:col-span-2">
            <div className="sticky top-24">
              {videoUrl ? (
                <div className="space-y-4">
                  {translationResponse && (
                    <div className="flex justify-center">
                        <LanguageToggle 
                            sourceLang={translationResponse.sourceLanguage}
                            targetLang={selectedLanguage}
                            activeLang={activeLang}
                            onToggle={handleLanguageToggle}
                        />
                    </div>
                  )}
                  <VideoPlayer 
                    videoUrl={videoUrl}
                    captions={activeCaptions}
                    captionStyle={captionStyle}
                    aspectRatio={aspectRatio}
                    onCaptionStyleChange={setCaptionStyle}
                  />
                </div>
              ) : (
                <div className="w-full aspect-video bg-slate-900 rounded-lg flex items-center justify-center text-slate-500 border-2 border-dashed border-slate-700">
                  <p>Upload a video to get started</p>
                </div>
              )}
               {isLoading && !videoUrl && (
                  <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
                    <Loader />
                  </div>
                )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
