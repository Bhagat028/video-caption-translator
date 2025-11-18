import React, { useState, useEffect, useRef } from 'react';
import { Caption, CaptionStyle } from '../types';

interface VideoPlayerProps {
  videoUrl: string;
  captions: Caption[];
  captionStyle: CaptionStyle;
  aspectRatio: string;
  onCaptionStyleChange: (style: CaptionStyle) => void;
  onTimeUpdate?: (currentTime: number, activeCaption: Caption | undefined) => void;
}

const getAspectRatioPadding = (ratio: string) => {
  switch (ratio) {
    case '16:9': return '56.25%';
    case '9:16': return '177.77%';
    case '4:5': return '125%';
    case '1:1': return '100%';
    default: return '56.25%';
  }
};

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, captions, captionStyle, aspectRatio, onCaptionStyleChange, onTimeUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  // Ref to store drag start information to prevent recalculating dimensions during drag
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    initialCaptionX: number;
    initialCaptionY: number;
    captionWidthPercent: number;
    captionHeightPercent: number;
  } | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const timeUpdateHandler = () => {
      const time = video.currentTime;
      setCurrentTime(time);
      const active = captions.find(c => time >= c.start && time <= c.end);
      if (onTimeUpdate) {
        onTimeUpdate(time, active);
      }
    };
    video.addEventListener('timeupdate', timeUpdateHandler);

    return () => video.removeEventListener('timeupdate', timeUpdateHandler);
  }, [videoUrl, captions, onTimeUpdate]);

  const activeCaption = captions.find(c => currentTime >= c.start && currentTime <= c.end);
  
  const textShadow = `${captionStyle.outlineWidth}px ${captionStyle.outlineWidth}px 0 ${captionStyle.outlineColor}, -${captionStyle.outlineWidth}px -${captionStyle.outlineWidth}px 0 ${captionStyle.outlineColor}, ${captionStyle.outlineWidth}px -${captionStyle.outlineWidth}px 0 ${captionStyle.outlineColor}, -${captionStyle.outlineWidth}px ${captionStyle.outlineWidth}px 0 ${captionStyle.outlineColor}`;

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !captionRef.current) return;
    e.preventDefault();
    setIsDragging(true);
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const captionRect = captionRef.current.getBoundingClientRect();

    // Store initial dimensions and positions at the start of the drag.
    // This is the key to preventing the "shrinking" bug.
    dragStartRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initialCaptionX: captionStyle.position.x,
        initialCaptionY: captionStyle.position.y,
        captionWidthPercent: (captionRect.width / containerRect.width) * 100,
        captionHeightPercent: (captionRect.height / containerRect.height) * 100,
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current || !dragStartRef.current) return;
    
    const { startX, startY, initialCaptionX, initialCaptionY, captionWidthPercent, captionHeightPercent } = dragStartRef.current;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    
    // Calculate mouse delta in pixels
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    
    // Convert pixel delta to percentage delta relative to the container
    const deltaPercentX = (deltaX / containerRect.width) * 100;
    const deltaPercentY = (deltaY / containerRect.height) * 100;
    
    // Calculate new raw position by applying the delta to the initial position
    const newX = initialCaptionX + deltaPercentX;
    const newY = initialCaptionY + deltaPercentY;
    
    // Clamp the position based on the STABLE, initial dimensions
    const halfWidth = captionWidthPercent / 2;
    const halfHeight = captionHeightPercent / 2;
    
    const clampedX = Math.max(halfWidth, Math.min(100 - halfWidth, newX));
    const clampedY = Math.max(halfHeight, Math.min(100 - halfHeight, newY));

    onCaptionStyleChange({
      ...captionStyle,
      position: {
        x: clampedX,
        y: clampedY,
      }
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartRef.current = null; // Clear drag state
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging]);


  return (
    <div ref={containerRef} className="relative w-full bg-black rounded-lg overflow-hidden shadow-lg" style={{ paddingTop: getAspectRatioPadding(aspectRatio) }}>
      <video
        ref={videoRef}
        key={videoUrl}
        controls
        className="absolute top-0 left-0 w-full h-full"
        src={videoUrl}
      />
      {activeCaption && (
        <div
          ref={captionRef}
          onMouseDown={handleMouseDown}
          className={`absolute text-center select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} p-2`}
          style={{
            left: `${captionStyle.position.x}%`,
            top: `${captionStyle.position.y}%`,
            transform: 'translate(-50%, -50%)',
            fontSize: `${captionStyle.fontSize}px`,
            fontWeight: captionStyle.fontWeight,
            fontFamily: captionStyle.fontFamily,
            textAlign: captionStyle.textAlign,
            letterSpacing: `${captionStyle.letterSpacing}px`,
            lineHeight: captionStyle.lineHeight,
            color: captionStyle.primaryColor,
            backgroundColor: `rgba(${parseInt(captionStyle.backgroundColor.slice(1, 3), 16)}, ${parseInt(captionStyle.backgroundColor.slice(3, 5), 16)}, ${parseInt(captionStyle.backgroundColor.slice(5, 7), 16)}, ${captionStyle.backgroundOpacity})`,
            padding: '0.2em 0.5em',
            borderRadius: `${captionStyle.borderRadius}px`,
            whiteSpace: 'pre-wrap',
            maxWidth: '90%',
            textShadow: captionStyle.outlineWidth > 0 ? textShadow : 'none',
          }}
        >
          {activeCaption.text}
        </div>
      )}
    </div>
  );
};