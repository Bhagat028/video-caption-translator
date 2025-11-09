import React, { useState } from 'react';
import { Caption, CaptionStyle } from '../types';
import { exportVideoWithCaptions, downloadBlob } from '../utils/videoExportUtils';

interface DownloadButtonProps {
  videoFile: File;
  captions: Caption[];
  captionStyle: CaptionStyle;
  aspectRatio: string;
  disabled?: boolean;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({
  videoFile,
  captions,
  captionStyle,
  aspectRatio,
  disabled = false,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setIsExporting(true);
    setProgress(0);
    setError(null);

    try {
      console.log('[DownloadButton] Starting video export...');
      const { blob, extension } = await exportVideoWithCaptions(
        videoFile,
        captions,
        captionStyle,
        aspectRatio,
        (p) => setProgress(Math.round(p))
      );

      console.log('[DownloadButton] Video exported successfully');
      
      // Generate filename with correct extension
      const originalName = videoFile.name.replace(/\.[^/.]+$/, '');
      const filename = `${originalName}_with_captions.${extension}`;
      
      downloadBlob(blob, filename);
      console.log('[DownloadButton] Download initiated:', filename);
    } catch (err) {
      console.error('[DownloadButton] Export failed:', err);
      setError('Failed to export video. Please try again.');
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleDownload}
        disabled={disabled || isExporting}
        className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
      >
        {isExporting ? (
          <>
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Exporting... {progress}%</span>
          </>
        ) : (
          <>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span>Download Video with Captions</span>
          </>
        )}
      </button>
      
      {isExporting && (
        <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
          <div
            className="bg-green-500 h-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
      
      {error && (
        <p className="text-red-400 text-sm text-center">{error}</p>
      )}
      
      {!isExporting && !error && (
        <p className="text-slate-400 text-xs text-center">
          Video will be exported with captions burned in (MP4 on Safari, WebM on Chrome/Firefox)
        </p>
      )}
    </div>
  );
};
