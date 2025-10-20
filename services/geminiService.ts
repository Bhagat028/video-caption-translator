import { GoogleGenAI, Type } from "@google/genai";
import { TranslationResponse } from '../types';
import { extractWavMono16k, blobToBase64 } from '../utils/audioUtils';

// FIX: Initialize the GoogleGenAI client with the API key from environment variables.
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
console.log('[geminiService] API Key loaded:', apiKey ? `Yes (${apiKey.substring(0, 10)}...)` : 'NO - MISSING!');
const ai = new GoogleGenAI({ apiKey });

export async function generateAndTranslateCaptions(
  videoFile: File,
  targetLanguage: string,
  maxWordsPerCaption: number
): Promise<TranslationResponse> {
  console.log('[geminiService] === Starting caption generation ===');
  console.log('[geminiService] Target language:', targetLanguage);
  console.log('[geminiService] Max words per caption:', maxWordsPerCaption);
  console.log('[geminiService] User agent:', navigator.userAgent);

  let audioPart: any;

  const prompt = `You are an expert in audio transcription and translation.
Your task is to:
1. Transcribe the provided audio accurately.
2. Segment the transcription into captions. Each caption should not exceed ${maxWordsPerCaption} words.
3. For each caption, provide word-level timestamps. This is critical. Each word in a caption must have its own "start" and "end" time.
4. Identify the source language of the audio.
5. Translate the captions (including word-level timestamps) into ${targetLanguage}.
6. Provide the output in a single JSON object.

The JSON object must have the following structure:
{
  "sourceLanguage": "The detected source language name (e.g., 'English')",
  "originalCaptions": [ { "start": number, "end": number, "words": [ { "text": "string", "start": number, "end": number } ] } ],
  "translatedCaptions": [ { "start": number, "end": number, "words": [ { "text": "string", "start": number, "end": number } ] } ]
}

- 'start' and 'end' times for captions and words must be in seconds.
- The 'originalCaptions' and 'translatedCaptions' arrays must have the same length.
- The 'start' and 'end' of a caption must encompass the start of its first word and the end of its last word.
`;

  const wordSchema = {
    type: Type.OBJECT,
    properties: {
      text: { type: Type.STRING, description: 'A single word of the caption.' },
      start: { type: Type.NUMBER, description: 'Start time of the word in seconds.' },
      end: { type: Type.NUMBER, description: 'End time of the word in seconds.' },
    },
    required: ['text', 'start', 'end'],
  };
  
  const captionSchema = {
    type: Type.OBJECT,
    properties: {
      start: { type: Type.NUMBER, description: 'Start time of the caption line in seconds' },
      end: { type: Type.NUMBER, description: 'End time of the caption line in seconds' },
      words: { 
        type: Type.ARRAY, 
        description: 'An array of words with their individual timestamps.',
        items: wordSchema 
      },
    },
    required: ['start', 'end', 'words'],
  };

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      sourceLanguage: { type: Type.STRING, description: 'Detected source language' },
      originalCaptions: {
        type: Type.ARRAY,
        items: captionSchema,
      },
      translatedCaptions: {
        type: Type.ARRAY,
        items: captionSchema,
      },
    },
    required: ['sourceLanguage', 'originalCaptions', 'translatedCaptions'],
  };
  
  // FIX: Use the recommended 'gemini-2.5-pro' for complex tasks and call ai.models.generateContent directly.
  console.log('[geminiService] Preparing API request...');
  console.log('[geminiService] Model: gemini-2.5-pro');
  console.log('[geminiService] Prompt length:', prompt.length);

  try {
    // Extract audio from the uploaded video and send ONLY audio to the model.
    const tStart = performance.now();
    console.log('[geminiService] Extracting audio (mono, 16kHz WAV)...');
    const { blob: audioBlob, mimeType: audioMime } = await extractWavMono16k(videoFile);
    console.log('[geminiService] Audio extracted:', {
      mimeType: audioMime,
      sizeBytes: audioBlob.size,
      sizeMB: (audioBlob.size / (1024 * 1024)).toFixed(2),
    });

    // Decide transport: inline vs Files API
    const INLINE_THRESHOLD_BYTES = 15 * 1024 * 1024; // 15 MB default
    const forceFilesApi =
      (import.meta as any)?.env?.VITE_GEMINI_FORCE_FILES_API === 'true' ||
      /Safari\//.test(navigator.userAgent) && !/Chrome\//.test(navigator.userAgent);
    if (forceFilesApi) {
      console.log('[geminiService] Forcing Files API path (env/UA)');
    }

    // Build content part either as inlineData or via file upload
    if (!forceFilesApi && audioBlob.size <= INLINE_THRESHOLD_BYTES) {
      console.log('[geminiService] Using inlineData for audio (<= 15MB)');
      const base64 = await blobToBase64(audioBlob);
      console.log('[geminiService] Base64 length:', base64.length);
      audioPart = {
        inlineData: {
          data: base64,
          mimeType: audioMime,
        },
      };
    } else {
      console.log('[geminiService] Uploading audio via Files API due to size...');
      const audioFile = new File([audioBlob], `${videoFile.name}.wav`, { type: audioMime });
      const uploaded = await ai.files.upload({ file: audioFile, config: { displayName: audioFile.name, mimeType: audioMime } });
      console.log('[geminiService] Audio uploaded. Name:', uploaded?.name, 'URI:', uploaded?.uri);

      // Poll until the file is ACTIVE before referencing it
      const name = uploaded?.name as string;
      const maxWaitMs = 60_000; // 60s
      const pollIntervalMs = 1_000;
      let waited = 0;
      while (true) {
        const info = await ai.files.get({ name });
        const state = (info as any)?.state;
        if (state === 'ACTIVE') {
          console.log('[geminiService] Uploaded audio is ACTIVE');
          break;
        }
        if (state === 'FAILED') {
          throw new Error('Uploaded audio processing failed');
        }
        if (waited >= maxWaitMs) {
          throw new Error('Timed out waiting for uploaded audio to become ACTIVE');
        }
        await new Promise(r => setTimeout(r, pollIntervalMs));
        waited += pollIntervalMs;
      }
      audioPart = {
        fileData: {
          fileUri: uploaded?.uri,
          mimeType: audioMime,
        },
      };
    }
    const tPrep = performance.now();
    console.log('[geminiService] Sending request to Gemini API...', {
      via: audioPart.inlineData ? 'inlineData' : 'fileData',
      audioMime: audioPart.inlineData ? audioPart.inlineData.mimeType : audioPart.fileData.mimeType,
    });
    const doRequest = async () => ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: {
            parts: [{ text: prompt }, audioPart]
        },
        config: {
            responseMimeType: 'application/json',
            responseSchema: responseSchema,
        },
    });
    let result;
    try {
      result = await doRequest();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const usedInline = !!(audioPart as any).inlineData;
      console.warn('[geminiService] Request failed.', { usedInline, msg });
      // Retry once with Files API if inline failed due to network sending request error
      if (usedInline && /Load failed sending request/i.test(msg)) {
        console.log('[geminiService] Retrying via Files API fallback...');
        const audioFile = new File([audioBlob], `${videoFile.name}.wav`, { type: audioMime });
        const uploaded = await ai.files.upload({ file: audioFile, config: { displayName: audioFile.name, mimeType: audioMime } });
        const name = uploaded?.name as string;
        // wait ACTIVE
        let waited = 0;
        const pollIntervalMs = 1000;
        const maxWaitMs = 60000;
        while (true) {
          const info = await ai.files.get({ name });
          const state = (info as any)?.state;
          if (state === 'ACTIVE') break;
          if (state === 'FAILED') throw new Error('Uploaded audio processing failed');
          if (waited >= maxWaitMs) throw new Error('Timed out waiting for uploaded audio to become ACTIVE');
          await new Promise(r => setTimeout(r, pollIntervalMs));
          waited += pollIntervalMs;
        }
        audioPart = { fileData: { fileUri: uploaded?.uri, mimeType: audioMime } };
        console.log('[geminiService] Fallback request to Gemini API with fileData');
        result = await doRequest();
      } else {
        throw e;
      }
    }
    const tDone = performance.now();
    console.log('[geminiService] ✓ API request successful!', {
      timingMs: {
        extract: Math.round(tPrep - tStart),
        request: Math.round(tDone - tPrep),
        total: Math.round(tDone - tStart),
      }
    });

    // FIX: Extract the text response and parse it as JSON.
    console.log('[geminiService] Parsing response...');
    const jsonText = result.text.trim();
    console.log('[geminiService] Response text length:', jsonText.length);

    const parsedResponse = JSON.parse(jsonText) as TranslationResponse;
    console.log('[geminiService] ✓ Response parsed successfully');
    console.log('[geminiService] Source language:', parsedResponse.sourceLanguage);
    console.log('[geminiService] Original captions count:', parsedResponse.originalCaptions.length);
    console.log('[geminiService] Translated captions count:', parsedResponse.translatedCaptions.length);

    return parsedResponse;
  } catch (error) {
    console.error('[geminiService] ❌ ERROR occurred:');
    console.error('[geminiService] Error type:', error?.constructor?.name);
    console.error('[geminiService] Error message:', error instanceof Error ? error.message : String(error));
    console.error('[geminiService] Full error:', error);
    console.error('[geminiService] Hints:', {
      advice: 'If audio is large, Files API is used. For flaky networks, try smaller clips or a stable network. Safari may show generic network errors.',
    });
    throw error;
  }
}
