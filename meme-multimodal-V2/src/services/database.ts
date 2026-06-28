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
  const ids = memes.map((m) => typeof m.id === 'number' && !Number.isNaN(m.id) ? m.id : 0);
  const newId = ids.length > 0 ? Math.max(...ids) + 1 : 1;
  const entity: MemeEntity = { id: newId, timestamp: Date.now(), ...meme };
  const payload = JSON.stringify([entity, ...memes]);
  if (payload.length > 4_000_000) {
    const trimmed = [entity, ...memes.slice(0, 50)].map((e) => ({ ...e, bgImageUri: null }));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } else {
    await AsyncStorage.setItem(STORAGE_KEY, payload);
  }
  return entity;
}

export async function deleteMeme(id: number): Promise<void> {
  const memes = await loadMemes();
  const filtered = memes.filter((m) => m.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}
