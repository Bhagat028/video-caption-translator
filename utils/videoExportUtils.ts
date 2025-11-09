import { Caption, CaptionStyle } from '../types';

/**
 * Exports a video with burned-in captions using canvas rendering
 */
export async function exportVideoWithCaptions(
  videoFile: File,
  captions: Caption[],
  captionStyle: CaptionStyle,
  aspectRatio: string,
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; extension: string }> {
  return new Promise(async (resolve, reject) => {
    try {
      // Create video element
      const video = document.createElement('video');
      video.src = URL.createObjectURL(videoFile);
      video.muted = false; // Don't mute to capture audio
      video.volume = 1.0;
      video.crossOrigin = 'anonymous';
      
      await new Promise((resolveVideo, rejectVideo) => {
        video.onloadedmetadata = resolveVideo;
        video.onerror = () => rejectVideo(new Error('Failed to load video'));
      });

      // Calculate canvas dimensions based on aspect ratio
      const dimensions = getVideoDimensions(video, aspectRatio);
      console.log('[videoExportUtils] Canvas dimensions:', dimensions);
      
      // Create canvas for rendering
      const canvas = document.createElement('canvas');
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: false })!;

      // Setup MediaRecorder with video stream at fixed frame rate for smoothness
      const videoStream = canvas.captureStream(); // Let it auto-capture when canvas updates
      
      // Try to capture audio directly from the video file
      let audioStream: MediaStream | null = null;
      try {
        // Create audio element specifically for audio capture
        const audioElement = document.createElement('audio');
        audioElement.src = URL.createObjectURL(videoFile);
        audioElement.preload = 'auto';
        
        await new Promise((res) => {
          audioElement.onloadedmetadata = res;
        });
        
        // Use AudioContext to capture clean audio
        const audioContext = new AudioContext();
        const source = audioContext.createMediaElementSource(audioElement);
        const dest = audioContext.createMediaStreamDestination();
        source.connect(dest);
        
        audioStream = dest.stream;
        console.log('[videoExportUtils] Audio stream created with', audioStream.getAudioTracks().length, 'tracks');
        
        // Store for cleanup
        (video as any)._audioContext = audioContext;
        (video as any)._audioElement = audioElement;
      } catch (err) {
        console.warn('[videoExportUtils] Could not capture audio:', err);
      }
      
      // Combine video and audio streams
      const combinedStream = new MediaStream();
      videoStream.getVideoTracks().forEach(track => combinedStream.addTrack(track));
      
      if (audioStream) {
        audioStream.getAudioTracks().forEach(track => combinedStream.addTrack(track));
      }
      
      console.log('[videoExportUtils] Combined stream - Audio tracks:', combinedStream.getAudioTracks().length);
      console.log('[videoExportUtils] Combined stream - Video tracks:', combinedStream.getVideoTracks().length);

      // Get the best supported video format
      const { mimeType, extension } = getBestVideoFormat();
      console.log('[videoExportUtils] Using format:', mimeType, 'Extension:', extension);

      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 8000000, // 8 Mbps for smoother video
        audioBitsPerSecond: 192000, // 192 kbps for better audio quality
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        URL.revokeObjectURL(video.src);
        
        // Clean up audio resources
        const audioElement = (video as any)._audioElement;
        const audioContext = (video as any)._audioContext;
        if (audioElement) {
          URL.revokeObjectURL(audioElement.src);
        }
        if (audioContext) {
          audioContext.close();
        }
        
        console.log('[videoExportUtils] Export complete. Blob size:', blob.size, 'bytes');
        resolve({ blob, extension });
      };

      mediaRecorder.onerror = (e) => {
        console.error('MediaRecorder error:', e);
        reject(new Error('Failed to record video'));
      };

      // Start recording with larger buffer to prevent glitches
      mediaRecorder.start(1000); // Collect data every 1000ms (1 second) for smoother recording
      
      // Play video and audio together - they will sync naturally via MediaRecorder
      const audioElement = (video as any)._audioElement;
      
      // Start both at exactly the same time
      if (audioElement) {
        audioElement.currentTime = 0;
        video.currentTime = 0;
        
        // Start both simultaneously
        await Promise.all([
          video.play(),
          audioElement.play()
        ]);
        
        console.log('[videoExportUtils] Video and audio started');
      } else {
        await video.play();
        console.log('[videoExportUtils] Video started (no audio)');
      }
      
      let isRecording = true;
      let frameCount = 0;
      
      const renderFrame = () => {
        if (!isRecording || video.ended || video.paused) {
          isRecording = false;
          mediaRecorder.stop();
          if (audioElement) {
            audioElement.pause();
          }
          return;
        }
        
        frameCount++;

        // Clear canvas with black background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Calculate dimensions to maintain aspect ratio and fit video in canvas
        const videoAspect = video.videoWidth / video.videoHeight;
        const canvasAspect = canvas.width / canvas.height;
        
        let drawWidth = canvas.width;
        let drawHeight = canvas.height;
        let offsetX = 0;
        let offsetY = 0;

        // Fit video inside canvas (letterbox/pillarbox)
        if (videoAspect > canvasAspect) {
          // Video is wider - fit width, add top/bottom bars
          drawWidth = canvas.width;
          drawHeight = canvas.width / videoAspect;
          offsetY = (canvas.height - drawHeight) / 2;
        } else {
          // Video is taller - fit height, add left/right bars
          drawHeight = canvas.height;
          drawWidth = canvas.height * videoAspect;
          offsetX = (canvas.width - drawWidth) / 2;
        }

        // Draw video frame centered and maintaining aspect ratio (no cropping)
        ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);

        // Find active caption
        const currentTime = video.currentTime;
        const activeCaption = captions.find(
          c => currentTime >= c.start && currentTime <= c.end
        );

        // Draw caption if active
        if (activeCaption) {
          drawCaption(ctx, activeCaption.text, captionStyle, canvas.width, canvas.height);
        }

        // Report progress
        if (onProgress) {
          const progress = (video.currentTime / video.duration) * 100;
          onProgress(progress);
        }

        // Use consistent frame timing instead of requestAnimationFrame for smoother recording
        setTimeout(() => {
          requestAnimationFrame(renderFrame);
        }, 1000 / 30); // 30 FPS
      };

      renderFrame();
    } catch (error) {
      console.error('Error exporting video:', error);
      reject(error);
    }
  });
}

/**
 * Calculate video dimensions based on aspect ratio
 */
function getVideoDimensions(video: HTMLVideoElement, aspectRatio: string) {
  const ratioMap: Record<string, [number, number]> = {
    '16:9': [16, 9],
    '9:16': [9, 16],
    '4:5': [4, 5],
    '1:1': [1, 1],
  };

  const [ratioWidth, ratioHeight] = ratioMap[aspectRatio] || [16, 9];
  
  // Start with a base dimension and calculate based on aspect ratio
  let width: number;
  let height: number;
  
  // Use video's largest dimension as base, then apply aspect ratio
  if (video.videoWidth >= video.videoHeight) {
    // Landscape or square video
    width = Math.min(video.videoWidth, 1920); // Cap at 1920px
    height = Math.round((width * ratioHeight) / ratioWidth);
  } else {
    // Portrait video
    height = Math.min(video.videoHeight, 1920); // Cap at 1920px
    width = Math.round((height * ratioWidth) / ratioHeight);
  }

  // Ensure dimensions are even numbers (required for video encoding)
  width = Math.round(width / 2) * 2;
  height = Math.round(height / 2) * 2;

  return { width, height };
}

/**
 * Draw caption text on canvas with styling
 */
function drawCaption(
  ctx: CanvasRenderingContext2D,
  text: string,
  style: CaptionStyle,
  canvasWidth: number,
  canvasHeight: number
) {
  // Scale font size based on canvas height to match preview
  // Assuming preview is based on viewport, we scale to canvas dimensions
  // Base scale: if canvas is 1080px height, use fontSize as-is
  const scaleFactor = canvasHeight / 1080;
  const scaledFontSize = Math.round(style.fontSize * scaleFactor);
  const scaledOutlineWidth = style.outlineWidth * scaleFactor;
  
  // Set font with scaled size
  ctx.font = `${style.fontWeight} ${scaledFontSize}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Calculate position (convert from percentage to pixels)
  const x = (style.position.x / 100) * canvasWidth;
  const y = (style.position.y / 100) * canvasHeight;

  // Measure text
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const textHeight = scaledFontSize;

  // Draw background
  const padding = 10 * scaleFactor;
  const bgX = x - textWidth / 2 - padding;
  const bgY = y - textHeight / 2 - padding;
  const bgWidth = textWidth + padding * 2;
  const bgHeight = textHeight + padding * 2;

  // Parse background color and apply opacity
  const bgColor = style.backgroundColor;
  const r = parseInt(bgColor.slice(1, 3), 16);
  const g = parseInt(bgColor.slice(3, 5), 16);
  const b = parseInt(bgColor.slice(5, 7), 16);
  
  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${style.backgroundOpacity})`;
  ctx.roundRect(bgX, bgY, bgWidth, bgHeight, 8 * scaleFactor);
  ctx.fill();

  // Draw text outline
  if (scaledOutlineWidth > 0) {
    ctx.strokeStyle = style.outlineColor;
    ctx.lineWidth = scaledOutlineWidth * 2;
    ctx.strokeText(text, x, y);
  }

  // Draw text
  ctx.fillStyle = style.primaryColor;
  ctx.fillText(text, x, y);
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Check if MP4 recording is supported (Safari)
 */
export function isMp4Supported(): boolean {
  return MediaRecorder.isTypeSupported('video/mp4');
}

/**
 * Get the best supported video format and extension
 */
export function getBestVideoFormat(): { mimeType: string; extension: string } {
  // Check for MP4 support (Safari)
  if (MediaRecorder.isTypeSupported('video/mp4;codecs=h264,aac')) {
    return { mimeType: 'video/mp4;codecs=h264,aac', extension: 'mp4' };
  }
  if (MediaRecorder.isTypeSupported('video/mp4')) {
    return { mimeType: 'video/mp4', extension: 'mp4' };
  }
  
  // Fallback to WebM (Chrome, Firefox)
  if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
    return { mimeType: 'video/webm;codecs=vp9,opus', extension: 'webm' };
  }
  if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
    return { mimeType: 'video/webm;codecs=vp8,opus', extension: 'webm' };
  }
  
  return { mimeType: 'video/webm', extension: 'webm' };
}
