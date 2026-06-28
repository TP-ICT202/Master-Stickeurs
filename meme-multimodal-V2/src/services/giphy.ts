import { GIPHY_API_KEY } from '../config';

const BASE_URL = 'https://api.giphy.com/v1/gifs';

export interface GiphyResult {
  url: string;
  previewUrl: string;
  title: string;
}

export const FALLBACK_GIFS: GiphyResult[] = [
  { url: 'https://media0.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif', previewUrl: 'https://media0.giphy.com/media/l0MYt5jPR6QX5pnqM/200.gif', title: 'exciting minions' },
  { url: 'https://media3.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif', previewUrl: 'https://media3.giphy.com/media/26ufdipQqU2lhNA4g/200.gif', title: 'funny face' },
  { url: 'https://media0.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif', previewUrl: 'https://media0.giphy.com/media/JIX9t2j0ZTN9S/200.gif', title: 'screaming cat' },
  { url: 'https://media2.giphy.com/media/l0HlNQ03J5JxX6lva/giphy.gif', previewUrl: 'https://media2.giphy.com/media/l0HlNQ03J5JxX6lva/200.gif', title: 'dancing' },
  { url: 'https://media1.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif', previewUrl: 'https://media1.giphy.com/media/3oriO0OEd9QIDdllqo/200.gif', title: 'crying laughing' },
  { url: 'https://media2.giphy.com/media/l4FGI8dL6CqSvvo3i/giphy.gif', previewUrl: 'https://media2.giphy.com/media/l4FGI8dL6CqSvvo3i/200.gif', title: 'angry' },
  { url: 'https://media2.giphy.com/media/3o7abB06u9bNzA8lu8/giphy.gif', previewUrl: 'https://media2.giphy.com/media/3o7abB06u9bNzA8lu8/200.gif', title: 'love' },
  { url: 'https://media4.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif', previewUrl: 'https://media4.giphy.com/media/l0MYt5jPR6QX5pnqM/200.gif', title: 'money' },
  { url: 'https://media2.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif', previewUrl: 'https://media2.giphy.com/media/26ufdipQqU2lhNA4g/200.gif', title: 'sleepy' },
  { url: 'https://media0.giphy.com/media/3oKIPnAiaMCws8n5DG/giphy.gif', previewUrl: 'https://media0.giphy.com/media/3oKIPnAiaMCws8n5DG/200.gif', title: 'family' },
];

export async function searchGif(query: string): Promise<GiphyResult | null> {
  try {
    const res = await fetch(
      `${BASE_URL}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=5&rating=g`,
    );
    if (res.ok) {
      const json = await res.json();
      const items = json.data ?? [];
      if (items.length > 0) {
        const gif = items[0];
        if (gif && gif.images?.original?.url) {
          return {
            url: gif.images.original.url,
            previewUrl: gif.images.fixed_height?.url ?? gif.images.original.url,
            title: gif.title ?? '',
          };
        }
      }
    }
  } catch {
  }
  const idx = Math.abs(hashCode(query)) % FALLBACK_GIFS.length;
  return FALLBACK_GIFS[idx];
}

export async function searchGifs(query: string, count: number = 6): Promise<GiphyResult[]> {
  const results: GiphyResult[] = [];
  try {
    const res = await fetch(
      `${BASE_URL}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=${count}&rating=g`,
    );
    if (res.ok) {
      const json = await res.json();
      const items = json.data ?? [];
      for (const gif of items) {
        if (gif && gif.images?.original?.url) {
          results.push({
            url: gif.images.original.url,
            previewUrl: gif.images.fixed_height?.url ?? gif.images.original.url,
            title: gif.title ?? '',
          });
        }
      }
    }
  } catch {
  }
  if (results.length === 0) {
    const shuffled = [...FALLBACK_GIFS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }
  return results;
}

function hashCode(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    const char = s.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash;
}
