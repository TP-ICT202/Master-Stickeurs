import { Platform, Share } from 'react-native';
import ViewShot from 'react-native-view-shot';
import RNFS from 'react-native-fs';
import type { MemeEntity } from '../types';

export async function captureMemeView(ref: ViewShot | null): Promise<string | null> {
  if (!ref || typeof ref.capture !== 'function') return null;
  try {
    const uri = await ref.capture();
    return uri;
  } catch {
    return null;
  }
}

export async function saveMemeToFile(meme: Omit<MemeEntity, 'id' | 'timestamp'>): Promise<string | null> {
  return null;
}

export async function shareMeme(options: { topText?: string; bottomText?: string; uri?: string }) {
  try {
    if (options.uri) {
      await Share.share({ url: options.uri, title: 'MemeGen AI' });
    } else {
      const text = `${options.topText ?? ''}\n${options.bottomText ?? ''}`;
      await Share.share({ message: text, title: 'MemeGen AI' });
    }
  } catch {
  }
}

export async function deleteMemeFile(path: string | null) {
  if (!path) return;
  try {
    const exists = await RNFS.exists(path);
    if (exists) await RNFS.unlink(path);
  } catch {
  }
}
