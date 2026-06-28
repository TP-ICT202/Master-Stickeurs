import {
  GEMINI_API_KEY, DEFAULT_GEMINI_API_KEY, PICSART_API_KEY, EDEN_API_KEY,
  POLINATION_AI_API_KEY, IMAGE_GPT_API_KEY, PEXELS_API_KEY, GROK_API_KEY,
} from '../config';
import { puterTxt2img, puterRemoveBg } from './puter';
import type { AudioMemeResult } from '../types';
import RNFS from 'react-native-fs';
import { mimeFromPath } from '../utils/imageMime';
import { useStore } from '../store/useStore';
import { grokGenerateText, grokGenerateImage } from './grok';

const BASE_URL = 'https://generativelanguage.googleapis.com';
const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];

function isKeyMissing(key: string) {
  return !key || key === '' || key.startsWith('MY_');
}

function parseGeminiJson(text: string): Record<string, string> {
  const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Invalid JSON from Gemini');
  }
}

async function callGemini(body: object): Promise<string | null> {
  let userKey = '';
  try { userKey = useStore.getState().userApiKey; } catch {}
  const keysToTry = [userKey, GEMINI_API_KEY, DEFAULT_GEMINI_API_KEY].filter(k => !isKeyMissing(k));
  if (keysToTry.length === 0) {
    console.warn('[Gemini] Aucune clé API valide trouvée. Configure une clé dans Settings ou .env');
    return null;
  }
  for (const key of keysToTry) {
    for (const model of MODELS) {
      try {
        const url = `${BASE_URL}/v1beta/models/${model}:generateContent?key=${key}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const reason = res.status === 429 ? 'QUOTA DÉPASSÉ' : res.status === 403 || res.status === 401 ? 'CLÉ INVALIDE' : `HTTP ${res.status}`;
          console.warn(`[Gemini] ${model} ${reason}`);
          if (res.status === 429 || res.status === 403 || res.status === 401) break;
          continue;
        }
        const json = await res.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;
        if (text) return text;
      } catch (e) {
        console.warn(`[Gemini] ${model} error:`, e);
      }
    }
  }
  return null;
}

async function callGrokFallback(body: object): Promise<string | null> {
  const prompt = (body as any)?.contents?.[0]?.parts?.[0]?.text;
  if (!prompt || isKeyMissing(GROK_API_KEY)) return null;
  return grokGenerateText(prompt);
}

function buildTextBody(prompt: string) {
  return {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json', temperature: 0.9 },
  };
}

async function callWithFallback(body: object): Promise<string | null> {
  let result = await callGemini(body);
  if (result) return result;
  result = await callGrokFallback(body);
  return result;
}

async function callGeminiWithImage(imagePath: string, prompt: string): Promise<string | null> {
  try {
    const base64Image = await RNFS.readFile(imagePath, 'base64');
    const mimeType = mimeFromPath(imagePath);
    const body = {
      contents: [{
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: base64Image } },
        ],
      }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.85 },
    };
    return callWithFallback(body);
  } catch (e) {
    console.warn('[callGeminiWithImage] error:', e);
    return null;
  }
}

export async function generateMemeTextSuggestions(situation: string): Promise<[string, string]> {
  const prompt = `Tu es un générateur de memes humoristique africain. Situation: "${situation}". NE REPETE PAS la situation. Crée un meme ORIGINAL avec argot francophone africain. JSON uniquement: {"top": "ACCROCHE MAJUSCULES", "bottom": "CHUTE MAJUSCULES"}`;
  try {
    const text = await callWithFallback(buildTextBody(prompt));
    if (!text) return keywordFallbackMeme(situation);
    const obj = parseGeminiJson(text);
    return [obj.top || 'GÉNÉRATION VIDÉ', obj.bottom || 'RÉESSAIE PLUS TARD'];
  } catch {
    return keywordFallbackMeme(situation);
  }
}

export async function transcribeAndGenerateMeme(audioFilePath: string): Promise<AudioMemeResult> {
  try {
    const base64Audio = await RNFS.readFile(audioFilePath, 'base64');
    const mimeType = audioFilePath.endsWith('.m4a') ? 'audio/mp4'
      : audioFilePath.endsWith('.mp3') ? 'audio/mpeg'
      : audioFilePath.endsWith('.wav') ? 'audio/wav'
      : 'audio/mp4';

    const prompt = `Écoute cet audio. 1) Transcris exactement (français). 2) Émotion (happy/surprised/angry/sad/confused/excited). 3) Meme drôle basé sur ce qui est dit. JSON: {"transcription":"...","emotion":"...","top":"HAUT","bottom":"BAS"}`;

    const body = {
      contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType, data: base64Audio } }] }],
      generationConfig: { responseMimeType: 'application/json' },
    };

    const text = await callWithFallback(body);
    if (!text) return { transcription: '', topText: 'GÉNÉRATION AUDIO', bottomText: 'VÉRIFIE TA CLÉ API DANS SETTINGS', emotion: 'confused' };
    const obj = parseGeminiJson(text);
    return {
      transcription: obj.transcription || '',
      topText: obj.top || 'NOTE VOCALE ÉPIQUE',
      bottomText: obj.bottom || 'PROBLÈME DE RÉSEAU',
      emotion: obj.emotion || 'surprised',
    };
  } catch (e) {
    console.warn('[transcribeAndGenerateMeme] error:', e);
    return { transcription: '', topText: 'ERREUR AUDIO', bottomText: 'RÉESSAIE PLUS TARD', emotion: 'confused' };
  }
}

export async function generateVoiceToMemeText(audioTranscript: string): Promise<[string, string]> {
  const prompt = `Message vocal: "${audioTranscript}". Meme ORIGINAL style blague africaine. JSON: {"top":"HAUT","bottom":"BAS"}`;
  try {
    const text = await callWithFallback(buildTextBody(prompt));
    if (!text) return ['NOTE VOCALE BUG', 'PROBLÈME RÉSEAU'];
    const obj = parseGeminiJson(text);
    return [obj.top, obj.bottom];
  } catch {
    return ['QUAND TU T\'ENREGISTRES', 'ET QUE TU SURSAUTES'];
  }
}

export async function analyzeImageForMeme(imagePath: string): Promise<[string, string]> {
  const prompt = `Analyse cette image en détail (personnes, objets, expressions, contexte, absurdité).
Génère un meme TRÈS DRÔLE en français argotique d'Afrique francophone basé UNIQUEMENT sur ce que tu VOIS.
- Décris ce qui se passe visuellement dans ta blague
- Haut = setup lié à l'image, Bas = punchline/twist lié à l'image
- MAJUSCULES
JSON: {"top":"TEXTE HAUT","bottom":"TEXTE BAS","description":"1 phrase de ce que tu vois"}`;

  try {
    const text = await callGeminiWithImage(imagePath, prompt);
    if (!text) return ['GEMINI NE VOIT PAS', 'VÉRIFIE TA CLÉ API'];
    const obj = parseGeminiJson(text);
    console.log('[analyzeImageForMeme] vision:', obj.description || 'ok');
    return [obj.top || 'IMAGE ANALYSÉE', obj.bottom || 'SANS HUMOUR'];
  } catch (e) {
    console.warn('[analyzeImageForMeme]', e);
    return ['L\'IA VOIT MA PHOTO', 'ET SECOUE LA TÊTE'];
  }
}

export async function generateStickerFromImage(imagePath: string): Promise<[string, string]> {
  const prompt = `Analyse cette image. Suggère UN emoji expressif + phrase max 4 mots en argot africain francophone qui commente CE QUI EST VISIBLE dans l'image.
JSON: {"emoji":"🔥","text":"PHRASE COURTE","description":"ce que tu vois"}`;

  try {
    const text = await callGeminiWithImage(imagePath, prompt);
    if (text) {
      const obj = parseGeminiJson(text);
      return [obj.emoji || '😂', obj.text || 'C\'EST GÂTÉ !'];
    }
  } catch (e) {
    console.warn('[generateStickerFromImage]', e);
  }
  return keywordFallbackSticker('image');
}

export async function generateGifQueryFromImage(imagePath: string): Promise<string> {
  const prompt = `Analyse cette image. Génère UNE requête GIF en anglais (2-4 mots) pour KLIPY qui correspond à l'action/émotion VISIBLE dans l'image.
JSON: {"query":"excited celebration","description":"ce que tu vois"}`;

  try {
    const text = await callGeminiWithImage(imagePath, prompt);
    if (text) {
      const obj = parseGeminiJson(text);
      const q = (obj.query || 'funny reaction').toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
      if (q) return q;
    }
  } catch (e) {
    console.warn('[generateGifQueryFromImage]', e);
  }
  return 'funny reaction meme';
}

export async function generateVideoQueryFromImage(imagePath: string): Promise<[string, string]> {
  const prompt = `Analyse cette image. Crée un titre 2-3 mots + punchline TikTok/Reels basée sur CE QUI EST VISIBLE.
JSON: {"title":"TITRE","punchline":"PUNCHLINE","videoQuery":"english search term for stock video"}`;

  try {
    const text = await callGeminiWithImage(imagePath, prompt);
    if (text) {
      const obj = parseGeminiJson(text);
      return [obj.title || 'ALERTE', obj.punchline || obj.videoQuery || 'C\'EST CHAUD'];
    }
  } catch (e) {
    console.warn('[generateVideoQueryFromImage]', e);
  }
  return ['ALERTE GÉNÉRALE', 'C\'EST L\'IMAGE QUI PARLE !'];
}

function pollinationsUrl(prompt: string): string {
  const encoded = encodeURIComponent(`meme background, funny cartoon, no text: ${prompt}`);
  return `https://image.pollinations.ai/prompt/${encoded}?width=512&height=512&nologo=true&seed=${Date.now() % 9999}`;
}

async function generateWithImageGpt(prompt: string): Promise<string | null> {
  if (isKeyMissing(IMAGE_GPT_API_KEY)) return null;
  const formatted = `Meme background, funny cartoon style, no text, vibrant colors: ${prompt}`;
  try {
    const res = await fetch('https://api.imagegpt.org/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${IMAGE_GPT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: formatted,
        n: 1,
        size: '512x512',
        model: 'dall-e-3',
        quality: 'hd',
      }),
    });
    if (res.ok) {
      const json = await res.json();
      const url = json.data?.[0]?.url || json.images?.[0]?.url || json.url || json.output?.[0];
      if (url) {
        console.log('[ImageGPT] OK');
        return url;
      }
    } else {
      console.warn('[ImageGPT] HTTP', res.status);
    }
  } catch (e) {
    console.warn('[ImageGPT]', e);
  }
  return null;
}

async function generateWithPollinationsPost(prompt: string): Promise<string | null> {
  const formatted = `meme background funny cartoon no text: ${prompt}`;
  if (!isKeyMissing(POLINATION_AI_API_KEY)) {
    try {
      const res = await fetch(`https://image.pollinations.ai/prompt/${encodeURIComponent(formatted)}?width=512&height=512&nologo=true`);
      if (res.ok && res.url) return res.url;
    } catch (e) {
      console.warn('[Pollinations GET]', e);
    }
  }
  return pollinationsUrl(prompt);
}

async function generateWithPicsart(prompt: string): Promise<string | null> {
  if (isKeyMissing(PICSART_API_KEY)) return null;
  const formatted = `Meme background, funny cartoon, no text: ${prompt}`;
  try {
    const res = await fetch('https://genai-api.picsart.io/v1/text2image', {
      method: 'POST',
      headers: {
        'x-picsart-api-key': PICSART_API_KEY,
        'Content-Type': 'application/json',
        Prefer: 'wait=60',
      },
      body: JSON.stringify({ prompt: formatted, count: 1 }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.status === 'success' && json.data?.[0]?.url) return json.data[0].url;
    }
  } catch (e) {
    console.warn('[Picsart]', e);
  }
  return null;
}

async function generateWithGeminiNative(prompt: string): Promise<string | null> {
  const keysToTry = [useStore.getState().userApiKey, GEMINI_API_KEY, DEFAULT_GEMINI_API_KEY].filter(k => k && !isKeyMissing(k) && k.startsWith('AIzaSy'));
  if (keysToTry.length === 0) return null;
  const imgPrompt = `Create a funny meme background image based on: ${prompt}. Make it vibrant, colorful, cartoon style, NO text on the image.`;
  for (const key of keysToTry) {
    for (const model of ['gemini-2.5-flash', 'gemini-2.0-flash']) {
      try {
        const url = `${BASE_URL}/v1beta/models/${model}:generateContent?key=${key}`;
        const body = {
          contents: [{ parts: [{ text: imgPrompt }] }],
          generationConfig: { responseModalities: ['Text', 'Image'] },
        };
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) { console.warn(`[Gemini Native Img] ${model} HTTP ${res.status}`); continue; }
        const json = await res.json();
        const parts = json.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData?.data && part.inlineData?.mimeType?.startsWith('image/')) {
            const path = `${RNFS.CachesDirectoryPath}/gemini_img_${Date.now()}.png`;
            await RNFS.writeFile(path, part.inlineData.data, 'base64');
            console.log('[Gemini Native Img] saved:', path);
            return `file://${path}`;
          }
        }
      } catch (e) {
        console.warn(`[Gemini Native Img] ${model} error:`, e);
      }
    }
  }
  return null;
}

export async function generateImageFromPrompt(prompt: string): Promise<string | null> {
  if (!prompt.trim()) return null;
  console.log('[generateImageFromPrompt]', prompt.slice(0, 80));

  const native = await generateWithGeminiNative(prompt);
  if (native) return native;

  const grok = await grokGenerateImage(prompt);
  if (grok) return grok;

  const imageGpt = await generateWithImageGpt(prompt);
  if (imageGpt) return imageGpt;

  const picsart = await generateWithPicsart(prompt);
  if (picsart) return picsart;

  const puter = await puterTxt2img(`meme background funny cartoon no text: ${prompt}`);
  if (puter) return puter;

  const pexels = await searchPexelsBackground(prompt);
  if (pexels) return pexels;

  const pollUrl = pollinationsUrl(prompt);
  console.log('[generateImageFromPrompt] Pollinations final fallback');
  return pollUrl;
}

async function searchPexelsBackground(query: string): Promise<string | null> {
  if (isKeyMissing(PEXELS_API_KEY)) return null;
  try {
    const searchTerms = query.split(' ').slice(0, 3).join(' ');
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchTerms)}&per_page=1&orientation=square`,
      { headers: { Authorization: PEXELS_API_KEY } },
    );
    if (res.ok) {
      const json = await res.json();
      const url = json.photos?.[0]?.src?.medium || json.photos?.[0]?.src?.original;
      if (url) {
        console.log('[Pexels] found:', url);
        return url;
      }
    }
  } catch (e) {
    console.warn('[Pexels]', e);
  }
  return null;
}

const BG_REMOVAL_PROVIDERS = ['clipdrop', 'picsart', 'api4ai', 'sentisight'];

export async function removeImageBackground(imagePath: string): Promise<string | null> {
  if (!isKeyMissing(EDEN_API_KEY)) {
    for (const provider of BG_REMOVAL_PROVIDERS) {
      try {
        const formData = new FormData();
        formData.append('providers', provider);
        formData.append('file', { uri: imagePath, type: mimeFromPath(imagePath), name: 'sticker.jpg' } as any);
        const res = await fetch('https://api.edenai.run/v2/image/background_removal', {
          method: 'POST',
          headers: { Authorization: `Bearer ${EDEN_API_KEY}` },
          body: formData,
        });
        if (res.ok) {
          const json = await res.json();
          const url = json.results?.[provider]?.image || json.results?.[provider]?.generated_image;
          if (url) return url;
        }
      } catch (e) {
        console.warn(`[removeImageBackground] ${provider}`, e);
      }
    }
  }
  return puterRemoveBg(imagePath);
}

export async function generateStickerSuggestion(contextText: string): Promise<[string, string]> {
  const prompt = `Situation: "${contextText}". Emoji + phrase max 4 mots argot africain. JSON: {"emoji":"🔥","text":"PHRASE"}`;
  try {
    const text = await callWithFallback(buildTextBody(prompt));
    if (!text) return keywordFallbackSticker(contextText);
    const obj = parseGeminiJson(text);
    return [obj.emoji || '😂', obj.text || 'ON EST ENSEMBLE !'];
  } catch {
    return keywordFallbackSticker(contextText);
  }
}

export async function generateGifSearchQuery(contextText: string): Promise<string> {
  const prompt = `Contexte: "${contextText}". Requête GIF anglaise 2-4 mots pour KLIPY. JSON: {"query":"excited minion"}`;
  try {
    const text = await callWithFallback(buildTextBody(prompt));
    if (!text) return keywordFallbackGifQuery(contextText);
    const result = parseGeminiJson(text).query || 'funny face';
    return result.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim() || 'funny reaction';
  } catch {
    return keywordFallbackGifQuery(contextText);
  }
}

export async function generateVideoStoryboard(contextText: string): Promise<[string, string]> {
  const prompt = `Contexte: "${contextText}". Titre 2-3 mots + punchline TikTok. JSON: {"title":"TITRE","punchline":"PUNCHLINE","videoQuery":"english stock video search"}`;
  try {
    const text = await callWithFallback(buildTextBody(prompt));
    if (!text) return ['STORY', 'C\'EST CHAUD !'];
    const obj = parseGeminiJson(text);
    return [obj.title || 'ALERTE', obj.punchline || 'DÉSASTRE'];
  } catch {
    return ['BUG REPORT', 'L\'EXCEPTION A FRAPPÉ !'];
  }
}

function keywordFallbackMeme(input: string): [string, string] {
  const l = input.toLowerCase();
  if (l.includes('travail') || l.includes('boulot') || l.includes('job')) return ['QUAND LE PATRON PARLE', 'JE PENSAIS AU WEEK-END'];
  if (l.includes('amour') || l.includes('fille') || l.includes('garçon')) return ['L\'AMOUR C\'EST BEAU', 'MAIS LE FRIC C\'EST MIEUX'];
  if (l.includes('argent') || l.includes('fric') || l.includes('thune')) return ['QUAND TU VOIS TON SOLDE', 'LE DÉCOUVERT PARLE'];
  if (l.includes('manger') || l.includes('bouffe') || l.includes('faim')) return ['LE RIZ C\'EST LA VIE', 'SANS LUI JE SUIS MORT'];
  return ['QUAND TU TAPES UN MESSAGE', 'L\'IA RÉFLÉCHIT ENCORE'];
}

function keywordFallbackSticker(input: string): [string, string] {
  const l = input.toLowerCase();
  if (l.includes('travail') || l.includes('boulot')) return ['💼', "C'EST LE BOULOT !"];
  if (l.includes('rire') || l.includes('drôle')) return ['😂', 'TROP DRÔLE !'];
  if (l.includes('colère') || l.includes('fâché')) return ['😡', 'TROP EN COLÈRE !'];
  return ['🔥', "C'EST CHAUD !"];
}

function keywordFallbackGifQuery(input: string): string {
  const l = input.toLowerCase();
  if (l.includes('travail') || l.includes('boulot')) return 'office worker frustrated';
  if (l.includes('rire') || l.includes('drôle')) return 'laughing funny meme';
  if (l.includes('danse') || l.includes('musique')) return 'dancing funny celebration';
  if (l.includes('colère') || l.includes('fâché')) return 'angry screaming face';
  return 'funny reaction meme';
}

export { PEXELS_API_KEY };
