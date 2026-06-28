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

export async function saveMemeToFile(meme: Omit<MemeEntity, 'id' | 'timestamp'>, viewShotRef?: ViewShot | null): Promise<string | null> {
  try {
    const fileName = `meme_${Date.now()}.png`;
    const dir = RNFS.DownloadDirectoryPath || RNFS.CachesDirectoryPath;
    const destPath = `${dir}/${fileName}`;

    let srcPath: string | null = null;

    if (viewShotRef && typeof (viewShotRef as any).capture === 'function') {
      srcPath = await (viewShotRef as any).capture();
    } else if (meme.bgImageUri) {
      srcPath = meme.bgImageUri.replace('file://', '');
    }

    if (srcPath) {
      const exists = await RNFS.exists(srcPath);
      if (exists) {
        await RNFS.copyFile(srcPath, destPath);
        console.log('[saveMemeToFile] saved to:', destPath);
        return destPath;
      }
    }

    return null;
  } catch (e) {
    console.warn('[saveMemeToFile] error:', e);
    return null;
  }
}

export async function shareMeme(options: {
  topText?: string; bottomText?: string; uri?: string; viewRef?: ViewShot | null;
}) {
  try {
    let finalUri = options.uri;
    if (!finalUri && options.viewRef && typeof (options.viewRef as any).capture === 'function') {
      finalUri = await (options.viewRef as any).capture();
    }
    if (finalUri) {
      await Share.share({ url: finalUri, title: 'MemeGen AI' });
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
