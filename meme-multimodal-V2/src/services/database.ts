import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MemeEntity } from '../types';

const STORAGE_KEY = 'saved_memes';

export async function loadMemes(): Promise<MemeEntity[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as MemeEntity[];
    return [];
  } catch {
    return [];
  }
}

export async function saveMeme(meme: Omit<MemeEntity, 'id' | 'timestamp'>): Promise<MemeEntity> {
  const memes = await loadMemes();
  const newId = memes.length > 0 ? Math.max(...memes.map((m) => m.id)) + 1 : 1;
  const entity: MemeEntity = { ...meme, id: newId, timestamp: Date.now() };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([entity, ...memes]));
  return entity;
}

export async function deleteMeme(id: number): Promise<void> {
  const memes = await loadMemes();
  const filtered = memes.filter((m) => m.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}
