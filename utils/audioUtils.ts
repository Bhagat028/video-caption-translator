// Extract mono 16kHz WAV audio from a video (or audio) File using Web Audio API
// and return a Blob with MIME type 'audio/wav'.
export async function extractWavMono16k(file: File): Promise<{ blob: Blob; mimeType: string }> {
  // If the input is already an audio file, attempt to decode directly.
  const arrayBuffer = await file.arrayBuffer();

  // Decode using a temporary AudioContext, then resample via OfflineAudioContext
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const decoded = await audioCtx.decodeAudioData(arrayBuffer.slice(0));

  const targetSampleRate = 16000;
  const duration = decoded.duration; // seconds
  const frameCount = Math.max(1, Math.floor(duration * targetSampleRate));

  const offline = new (window.OfflineAudioContext || (window as any).webkitOfflineAudioContext)(
    1,
    frameCount,
    targetSampleRate
  );

  const source = offline.createBufferSource();
  source.buffer = decoded;
  source.connect(offline.destination);
  source.start(0);
  const rendered = await offline.startRendering();

  // Encode rendered (mono, 16kHz) to 16-bit PCM WAV
  const wavBlob = audioBufferToWav(rendered);
  return { blob: wavBlob, mimeType: 'audio/wav' };
}

// Convert an AudioBuffer (assumed mono) to a 16-bit PCM WAV Blob
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = 1; // rendered above
  const sampleRate = buffer.sampleRate;
  const channelData = buffer.getChannelData(0);
  const bytesPerSample = 2; // 16-bit PCM
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = channelData.length * bytesPerSample;
  const wavSize = 44 + dataSize;

  const arrayBuffer = new ArrayBuffer(wavSize);
  const view = new DataView(arrayBuffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // bits per sample

  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // PCM samples
  floatTo16BitPCM(view, 44, channelData);

  return new Blob([view], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

function floatTo16BitPCM(view: DataView, offset: number, input: Float32Array) {
  let pos = offset;
  for (let i = 0; i < input.length; i++, pos += 2) {
    // clamp
    let s = Math.max(-1, Math.min(1, input[i]));
    // scale to 16-bit signed int
    view.setInt16(pos, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
}

// Convert a Blob to base64 string (without data: prefix)
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      try {
        const result = reader.result as string;
        const base64 = result.split(',')[1] || '';
        resolve(base64);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

