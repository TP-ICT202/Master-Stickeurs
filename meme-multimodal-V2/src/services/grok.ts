import RNFS from 'react-native-fs';
import { GROK_API_KEY } from '../config';

function isMissing(key: string) { return !key || key === ''; }

const BASE = 'https://api.x.ai/v1';

export async function grokGenerateText(prompt: string): Promise<string | null> {
  if (isMissing(GROK_API_KEY)) return null;
  try {
    const res = await fetch(`${BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-2-latest',
        messages: [
          { role: 'system', content: 'Tu es un générateur de memes. Réponds UNIQUEMENT en JSON.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.85,
      }),
    });
    if (!res.ok) {
      console.warn('[Grok] HTTP', res.status);
      return null;
    }
    const json = await res.json();
    return json.choices?.[0]?.message?.content?.trim() ?? null;
  } catch (e) {
    console.warn('[Grok] error:', e);
    return null;
  }
}

export async function grokGenerateImage(prompt: string): Promise<string | null> {
  if (isMissing(GROK_API_KEY)) return null;
  try {
    const res = await fetch(`${BASE}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-2-image',
        prompt: `meme background, funny cartoon style, no text: ${prompt}`,
        n: 1,
        size: '1024x1024',
      }),
    });
    if (!res.ok) {
      console.warn('[Grok Image] HTTP', res.status);
      return null;
    }
    const json = await res.json();
    const url = json.data?.[0]?.url;
    if (url) {
      console.log('[Grok Image] OK');
      return url;
    }
    return null;
  } catch (e) {
    console.warn('[Grok Image] error:', e);
    return null;
  }
}
