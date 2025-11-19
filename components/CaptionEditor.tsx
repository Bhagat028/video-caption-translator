import React, { useState, useRef } from 'react';
import { Caption } from '../types';

interface CaptionEditorProps {
  captions: Caption[];
  onCaptionsChange: (captions: Caption[]) => void;
}

export const CaptionEditor: React.FC<CaptionEditorProps> = ({ captions, onCaptionsChange }) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');

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

  const formatSRTTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  };

  const parseSRTTime = (timeStr: string): number => {
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0]);
    const mins = parseInt(parts[1]);
    const secsParts = parts[2].split(',');
    const secs = parseInt(secsParts[0]);
    const ms = parseInt(secsParts[1]);
    return hours * 3600 + mins * 60 + secs + ms / 1000;
  };

  const handleDelete = (index: number) => {
    const updatedCaptions = captions.filter((_, i) => i !== index);
    onCaptionsChange(updatedCaptions);
  };

  const handleAddCaption = () => {
    const lastCaption = captions[captions.length - 1];
    const newStart = lastCaption ? lastCaption.end + 0.5 : 0;
    const newCaption: Caption = {
      text: 'New caption',
      start: newStart,
      end: newStart + 3,
    };
    onCaptionsChange([...captions, newCaption]);
  };

  const handleDuplicate = (index: number) => {
    const caption = captions[index];
    const newCaption: Caption = {
      ...caption,
      start: caption.end + 0.5,
      end: caption.end + 3.5,
    };
    const updatedCaptions = [...captions];
    updatedCaptions.splice(index + 1, 0, newCaption);
    onCaptionsChange(updatedCaptions);
  };

  const handleSort = () => {
    const sorted = [...captions].sort((a, b) => a.start - b.start);
    onCaptionsChange(sorted);
  };

  const handleExportSRT = () => {
    let srtContent = '';
    captions.forEach((caption, index) => {
      srtContent += `${index + 1}\n`;
      srtContent += `${formatSRTTime(caption.start)} --> ${formatSRTTime(caption.end)}\n`;
      srtContent += `${caption.text}\n\n`;
    });

    const blob = new Blob([srtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'captions.srt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportSRT = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const importedCaptions = parseSRT(content);
      if (importedCaptions.length > 0) {
        onCaptionsChange(importedCaptions);
      }
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const parseSRT = (content: string): Caption[] => {
    const captions: Caption[] = [];
    const blocks = content.trim().split(/\n\s*\n/);

    for (const block of blocks) {
      const lines = block.trim().split('\n');
      if (lines.length < 3) continue;

      const timeLine = lines[1];
      const timeMatch = timeLine.match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);
      if (!timeMatch) continue;

      const start = parseSRTTime(timeMatch[1]);
      const end = parseSRTTime(timeMatch[2]);
      const text = lines.slice(2).join('\n');

      captions.push({ text, start, end });
    }

    return captions;
  };

  const handleFindReplace = () => {
    if (!findText) return;

    const updatedCaptions = captions.map(caption => ({
      ...caption,
      text: caption.text.replace(new RegExp(findText, 'gi'), replaceText)
    }));

    onCaptionsChange(updatedCaptions);
    setFindText('');
    setReplaceText('');
    setShowFindReplace(false);
  };

  return (
    <div className="space-y-4">
      {/* Header with Actions */}
      <div className="bg-slate-900 pb-3 mb-4 border-b-2 border-indigo-500/30">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h3 className="text-xl font-bold text-indigo-400">📝 Edit Captions</h3>
            <p className="text-sm text-slate-400 mt-1">Make changes to your transcript - all edits are saved automatically</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-indigo-400">{captions.length}</div>
            <div className="text-xs text-slate-500">Captions</div>
          </div>
        </div>
        <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-3 text-sm text-indigo-200">
          <p className="font-semibold mb-1">💡 Quick Guide:</p>
          <ul className="text-xs space-y-1 text-slate-300">
            <li>• Click caption text to edit spelling/wording</li>
            <li>• Use Find & Replace to fix recurring errors</li>
            <li>• Expand "Adjust timing" to change when captions appear</li>
            <li>• All changes update live in the video above</li>
          </ul>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleAddCaption}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Caption
        </button>

        <button
          onClick={() => setShowFindReplace(!showFindReplace)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          Find & Replace
        </button>

        <button
          onClick={handleSort}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h7a1 1 0 100-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" />
          </svg>
          Sort by Time
        </button>

        <button
          onClick={handleExportSRT}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Export SRT
        </button>

        <label className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center justify-center gap-2 col-span-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          Import SRT
          <input
            ref={fileInputRef}
            type="file"
            accept=".srt"
            onChange={handleImportSRT}
            className="hidden"
          />
        </label>
      </div>

      {/* Find & Replace Panel */}
      {showFindReplace && (
        <div className="bg-slate-800 p-4 rounded-lg border border-purple-500/50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-purple-300">Find & Replace - Fix Spelling Errors</h4>
            <button
              onClick={() => setShowFindReplace(false)}
              className="text-slate-400 hover:text-slate-300"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              placeholder="Find text (e.g., 'teh')"
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
            <input
              type="text"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder="Replace with (e.g., 'the')"
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <button
            onClick={handleFindReplace}
            disabled={!findText}
            className="mt-3 w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
          >
            Replace All Occurrences
          </button>
          <p className="text-xs text-slate-500 mt-2">Case-insensitive search across all captions</p>
        </div>
      )}

      {captions.length === 0 ? (
        <div className="text-center text-slate-400 py-8 bg-slate-800 rounded-lg border border-slate-700">
          <p className="mb-2">No captions yet.</p>
          <p className="text-sm">Generate captions, add manually, or import an SRT file.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
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

                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleDuplicate(index)}
                    className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 p-2 rounded transition-colors"
                    title="Duplicate caption"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                      <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(index)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-2 rounded transition-colors"
                    title="Delete caption"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
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
      )}
    </div>
  );
};
