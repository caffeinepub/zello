export const MAX_ATTACHMENT_SIZE = 100_000_000; // 100 MB

export async function fileToUint8Array(file: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      resolve(new Uint8Array(arrayBuffer));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

export function isImage(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

export function isAudio(mimeType: string): boolean {
  return mimeType.startsWith('audio/');
}

export function createBlobUrl(data: Uint8Array, mimeType: string): string {
  // Convert to a new Uint8Array to ensure compatibility with Blob constructor
  const blob = new Blob([new Uint8Array(data)], { type: mimeType });
  return URL.createObjectURL(blob);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
