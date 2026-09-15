import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

/**
 * Reads a selected file without invoking Expo FileSystem in a browser.
 * Web pickers expose blob/data URLs, which the browser can read directly.
 */
export const readUriAsBase64 = async (uri: string): Promise<string> => {
  if (Platform.OS !== 'web') {
    return new FileSystem.File(uri).base64();
  }

  const response = await fetch(uri);
  if (!response.ok) throw new Error('No se pudo leer el archivo seleccionado.');
  const blob = await response.blob();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string'
      ? resolve(reader.result)
      : reject(new Error('No se pudo leer el archivo seleccionado.'));
    reader.onerror = () => reject(new Error('No se pudo leer el archivo seleccionado.'));
    reader.readAsDataURL(blob);
  });
  return dataUrl.split(',', 2)[1] ?? '';
};

export const readUriAsDataUrl = async (uri: string, mimeType: string): Promise<string> =>
  `data:${mimeType};base64,${await readUriAsBase64(uri)}`;
