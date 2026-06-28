import { Platform, PermissionsAndroid, Alert } from 'react-native';

async function requestAndroidPermission(
  permission: (typeof PermissionsAndroid.PERMISSIONS)[keyof typeof PermissionsAndroid.PERMISSIONS],
  title: string,
  message: string,
): Promise<boolean> {
  try {
    const granted = await PermissionsAndroid.request(permission, {
      title,
      message,
      buttonPositive: 'Autoriser',
      buttonNegative: 'Refuser',
    });
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

export async function requestMicPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  return requestAndroidPermission(
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    'Microphone',
    "MemeGen AI a besoin du micro pour enregistrer ta voix.",
  );
}

export async function requestCameraPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  return requestAndroidPermission(
    PermissionsAndroid.PERMISSIONS.CAMERA,
    'Caméra',
    "MemeGen AI a besoin de la caméra pour prendre des photos.",
  );
}

export async function requestGalleryPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const apiLevel = Platform.Version as number;
  if (apiLevel >= 33) {
    return requestAndroidPermission(
      PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
      'Galerie',
      "MemeGen AI a besoin d'accéder à tes photos.",
    );
  }
  return requestAndroidPermission(
    PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
    'Galerie',
    "MemeGen AI a besoin d'accéder à tes photos.",
  );
}

export function showPermissionDenied(type: 'camera' | 'gallery' | 'mic') {
  const labels = { camera: 'caméra', gallery: 'galerie', mic: 'microphone' };
  Alert.alert('Permission refusée', `Impossible d'utiliser la ${labels[type]} sans autorisation.`);
}
