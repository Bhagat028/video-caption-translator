// Helper function to convert a File object to a GoogleGenerativeAI.Part object.
export async function fileToGenerativePart(file: File) {
  console.log('[captionUtils] Starting file conversion...');
  console.log('[captionUtils] File name:', file.name);
  console.log('[captionUtils] File size:', file.size, 'bytes');
  console.log('[captionUtils] File type:', file.type);

  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // The result includes the data URI prefix, which we need to remove.
      // e.g., "data:video/mp4;base64,...." -> "...."
      const base64Data = (reader.result as string).split(',')[1];
      console.log('[captionUtils] Base64 data length:', base64Data.length);
      resolve(base64Data);
    };
    reader.readAsDataURL(file);
  });

  const result = {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type,
    },
  };

  console.log('[captionUtils] File conversion complete');
  return result;
}
