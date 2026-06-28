import { KILPY_API_KEY } from '../config';

export interface GifResult {
  url: string;
  previewUrl: string;
  title: string;
}

const FALLBACK_GIFS: GifResult[] = [
  { url: 'https://static.klipy.com/ii/d7aec6f6f171607374b2065c836f92f4/ec/f3/p30ORxL1.gif', previewUrl: 'https://static.klipy.com/ii/d7aec6f6f171607374b2065c836f92f4/ec/f3/NIKSFkmQ.gif', title: 'hello wave' },
  { url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif', previewUrl: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/200.gif', title: 'funny face' },
  { url: 'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif', previewUrl: 'https://media.giphy.com/media/JIX9t2j0ZTN9S/200.gif', title: 'screaming cat' },
  { url: 'https://media.giphy.com/media/l0HlNQ03J5JxX6lva/giphy.gif', previewUrl: 'https://media.giphy.com/media/l0HlNQ03J5JxX6lva/200.gif', title: 'dancing' },
  { url: 'https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif', previewUrl: 'https://media.giphy.com/media/3oriO0OEd9QIDdllqo/200.gif', title: 'laughing' },
];

function pickFallback(query: string): GifResult {
  return FALLBACK_GIFS[Math.abs(hashCode(query)) % FALLBACK_GIFS.length];
}

function parseKlipyItem(item: any): GifResult | null {
  if (!item || item.type === 'ad') return null;
  const formats = item.media_formats || item.files || {};
  const gif = formats.gif || formats.mediumgif || formats.tinygif || formats.mp4;
  const preview = formats.tinygif || formats.gifpreview || formats.nanogif || gif;
  const url = gif?.url || item.url;
  const previewUrl = preview?.url || url;
  if (!url) return null;
  return { url, previewUrl: previewUrl || url, title: item.title || item.content_description || '' };
}

function parseKlipyResponse(json: any): GifResult | null {
  const list = json?.results || json?.data || json?.gifs || [];
  for (const item of list) {
    const parsed = parseKlipyItem(item);
    if (parsed) return parsed;
  }
  return null;
}

async function searchKlipyV1(query: string): Promise<GifResult | null> {
  const url = `https://api.klipy.com/api/v1/${KILPY_API_KEY}/gifs/search?q=${encodeURIComponent(query)}&per_page=10&page=1`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) return null;
  return parseKlipyResponse(await res.json());
}

async function searchKlipyV2(query: string): Promise<GifResult | null> {
  const url = `https://api.klipy.com/v2/search?key=${encodeURIComponent(KILPY_API_KEY)}&q=${encodeURIComponent(query)}&limit=10&contentfilter=high&media_filter=gif,tinygif`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) return null;
  return parseKlipyResponse(await res.json());
}

async function searchKlipyTrending(): Promise<GifResult | null> {
  const url = `https://api.klipy.com/api/v1/${KILPY_API_KEY}/gifs/trending?per_page=10&page=1`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) return null;
  return parseKlipyResponse(await res.json());
}

/** Search GIFs via KLIPY (KILPY) API — replaces Giphy. */
export async function searchGif(query: string): Promise<GifResult | null> {
  const q = (query || 'funny reaction').trim();
  if (!KILPY_API_KEY) {
    console.warn('[KLIPY] KILPY_API_KEY missing');
    return pickFallback(q);
  }
  try {
    const v1 = await searchKlipyV1(q);
    if (v1) {
      console.log('[KLIPY] v1 hit:', v1.title);
      return v1;
    }
    const v2 = await searchKlipyV2(q);
    if (v2) {
      console.log('[KLIPY] v2 hit:', v2.title);
      return v2;
    }
    const trending = await searchKlipyTrending();
    if (trending) return trending;
  } catch (e) {
    console.warn('[KLIPY] search error:', e);
  }
  return pickFallback(q);
}

function hashCode(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
