import { GEMINI_API_KEY, PICSART_API_KEY, EDEN_API_KEY, POLINATION_AI_API_KEY, KILPY_API_KEY, API_LEAGUE_KEY } from '../config';
import { puterTxt2img, puterRemoveBg } from './puter';
import type { AudioMemeResult } from '../types';
import RNFS from 'react-native-fs';

const BASE_URL = 'https://generativelanguage.googleapis.com';
const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];

function isKeyMissing(key: string) {
  return !key || key === '';
}

async function callGemini(body: object): Promise<string | null> {
  for (const model of MODELS) {
    try {
      const url = `${BASE_URL}/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      console.log(`[Gemini] Trying ${model}...`);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[Gemini] ${model} HTTP ${res.status}: ${errText.slice(0, 150)}`);
        continue;
      }
      const json = await res.json();
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;
      if (text) {
        console.log(`[Gemini] ${model} success`);
        return text;
      }
    } catch (e) {
      console.warn(`[Gemini] ${model} fetch error:`, e);
    }
  }
  console.warn('[Gemini] All models failed');
  return null;
}

function buildTextBody(prompt: string) {
  return {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' },
  };
}

export async function generateMemeTextSuggestions(situation: string): Promise<[string, string]> {
  if (isKeyMissing(GEMINI_API_KEY)) {
    return keywordFallbackMeme(situation);
  }
  const prompt = `Tu es un générateur de memes humoristique africain. La situation est: "${situation}". NE REPETE PAS la situation textuellement. Crée un meme ORIGINAL et INATTENDU qui fait le lien avec la situation mais avec une tournure surprenante. Style "blague africaine" - argot, detournement, exaggeration. Le texte du haut (top) est l'accroche, le texte du bas (bottom) est la chute. Retourne UNIQUEMENT ce JSON brut: {"top": "TOP TEXT EN MAJUSCULES (accroche originale)", "bottom": "BOTTOM TEXT EN MAJUSCULES (chute inattendue)"}`;
  try {
    const text = await callGemini(buildTextBody(prompt));
    if (!text) return keywordFallbackMeme(situation);
    const obj = JSON.parse(text);
    return [obj.top || 'GÉNÉRATION VIDÉ', obj.bottom || 'RÉESSAIE PLUS TARD'];
  } catch (e) {
    console.warn('[generateMemeTextSuggestions] parse error:', e);
    return keywordFallbackMeme(situation);
  }
}

export async function transcribeAndGenerateMeme(audioFilePath: string): Promise<AudioMemeResult> {
  if (isKeyMissing(GEMINI_API_KEY)) {
    return { transcription: 'Clé API manquante', topText: 'AUDIO REÇU SANS CLÉ API', bottomText: 'VA SUR aistudio.google.com !', emotion: 'confused' };
  }
  try {
    const base64Audio = await RNFS.readFile(audioFilePath, 'base64');

    const mimeType = audioFilePath.endsWith('.3gp') ? 'audio/3gpp'
      : audioFilePath.endsWith('.m4a') ? 'audio/mp4'
      : audioFilePath.endsWith('.mp3') ? 'audio/mpeg'
      : audioFilePath.endsWith('.wav') ? 'audio/wav'
      : audioFilePath.endsWith('.webm') ? 'audio/webm'
      : audioFilePath.endsWith('.ogg') ? 'audio/ogg'
      : 'audio/3gpp';

    const prompt = `Écoute cet enregistrement audio et : 1. Transcris exactement ce qui est dit (en français). 2. Identifie l'émotion principale (happy, surprised, angry, sad, confused, excited). 3. Génère un texte de meme drôle basé sur ce qui a été dit. Retourne UNIQUEMENT ce JSON brut : {"transcription": "texte exact", "emotion": "surprised", "top": "TEXTE DU HAUT", "bottom": "TEXTE DU BAS"}`;

    const body = {
      contents: [{
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: base64Audio } },
        ],
      }],
      generationConfig: { responseMimeType: 'application/json' },
    };

    const text = await callGemini(body);
    if (!text) return { transcription: '', topText: 'GEMINI N\'A PAS RÉPONDU', bottomText: 'VÉRIFIE TA CONNEXION ET TA CLÉ API', emotion: 'confused' };
    const obj = JSON.parse(text);
    return {
      transcription: obj.transcription || '',
      topText: obj.top || 'AUDIO REÇU ET ANALYSÉ',
      bottomText: obj.bottom || 'MAIS L\'IA N\'A RIEN COMPRIS',
      emotion: obj.emotion || 'confused',
    };
  } catch (e) {
    console.warn('[transcribeAndGenerateMeme] error:', e);
    return { transcription: '', topText: 'QUAND TU ENREGISTRES TA VOIX', bottomText: 'ET QUE L\'IA SURSAUTE EN T\'ENTENDANT', emotion: 'surprised' };
  }
}

export async function generateVoiceToMemeText(audioTranscript: string): Promise<[string, string]> {
  if (isKeyMissing(GEMINI_API_KEY)) return ['AUDIO SANS CLÉ API', 'LE SILENCE EST ASSOURDISSANT'];
  const prompt = `Message vocal: "${audioTranscript}". NE COPIE PAS le message. Crée un meme ORIGINAL qui s'en inspire avec un détournement humoristique africain. JSON: {"top": "TOP TEXT MAJUSCULES (accroche originale)", "bottom": "BOTTOM TEXT MAJUSCULES (chute inattendue)"}`;
  try {
    const text = await callGemini(buildTextBody(prompt));
    if (!text) return ['QUAND LA NOTE VOCALE BUG', 'PROBLÈME RÉSEAU'];
    const obj = JSON.parse(text);
    return [obj.top, obj.bottom];
  } catch (e) {
    console.warn('[generateVoiceToMemeText] error:', e);
    return ['QUAND TU T\'ENREGISTRES', 'ET QUE TU SURSAUTES EN T\'ENTENDANT'];
  }
}

export async function analyzeImageForMeme(imagePath: string): Promise<[string, string]> {
  if (isKeyMissing(GEMINI_API_KEY)) return ['PHOTO SANS CLÉ API', 'CONFIGURATION VIDE'];
  try {
    const base64Image = await RNFS.readFile(imagePath, 'base64');

    const prompt = `Analyse cette image avec humour. Génère un texte de meme drôle en français argotique d'Afrique francophone qui décrit ce qu'on voit. Retourne UNIQUEMENT ce JSON brut : {"top": "TEXTE DU HAUT", "bottom": "TEXTE DU BAS"}`;
    const body = {
      contents: [{
        parts: [
          { text: prompt },
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
        ],
      }],
      generationConfig: { responseMimeType: 'application/json' },
    };
    const text = await callGemini(body);
    if (!text) return ['QUAND LE MULTIMODAL CAPOTE', 'PAS DE PIXELS'];
    const obj = JSON.parse(text);
    return [obj.top, obj.bottom];
  } catch (e) {
    console.warn('[analyzeImageForMeme] error:', e);
    return ['L\'IA QUI VOIT MA PHOTO', 'ET QUI SECOUE LA TÊTE'];
  }
}

async function generateImageWithPuter(prompt: string): Promise<string | null> {
  const url = await puterTxt2img(prompt);
  if (url) console.log('[Puter] Image generated:', url);
  return url;
}

export async function generateImageFromPrompt(prompt: string): Promise<string | null> {
  const formatted = `Meme background image, funny cartoon style, no text: ${prompt}`;
  console.log('[generateImageFromPrompt] prompt:', prompt);

  if (!isKeyMissing(PICSART_API_KEY)) {
    try {
      console.log('[Picsart] Calling API with key:', PICSART_API_KEY.slice(0, 8) + '...');
      const res = await fetch('https://genai-api.picsart.io/v1/text2image', {
        method: 'POST',
        headers: {
          'x-picsart-api-key': PICSART_API_KEY,
          'Content-Type': 'application/json',
          Prefer: 'wait=60',
        },
        body: JSON.stringify({ prompt: formatted, count: 1 }),
      });
      console.log('[Picsart] Response status:', res.status);
      if (res.ok) {
        const json = await res.json();
        console.log('[Picsart] Response JSON:', JSON.stringify(json).slice(0, 300));
        if (json.status === 'success' && json.data?.[0]?.url) {
          console.log('[Picsart] Image URL:', json.data[0].url);
          return json.data[0].url;
        }
        console.warn('[Picsart] Unexpected response format:', JSON.stringify(json).slice(0, 200));
      } else {
        const errText = await res.text();
        console.warn(`[Picsart] HTTP ${res.status}: ${errText.slice(0, 200)}`);
      }
    } catch (e) {
      console.warn('[Picsart] error:', e);
    }
  } else {
    console.warn('[Picsart] API key missing');
  }

  const puterResult = await generateImageWithPuter(formatted);
  if (puterResult) return puterResult;

  console.warn('[generateImageFromPrompt] All image APIs failed, returning null');
  return null;
}

const BG_REMOVAL_PROVIDERS = ['clipdrop', 'picsart', 'api4ai', 'sentisight'];

export async function removeImageBackground(imagePath: string): Promise<string | null> {
  if (isKeyMissing(EDEN_API_KEY)) {
    console.warn('[removeImageBackground] Eden AI key missing');
    return null;
  }
  for (const provider of BG_REMOVAL_PROVIDERS) {
    try {
      const formData = new FormData();
      formData.append('providers', provider);
      formData.append('file', {
        uri: imagePath,
        type: 'image/jpeg',
        name: 'sticker.jpg',
      } as any);

      const res = await fetch('https://api.edenai.run/v2/image/background_removal', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${EDEN_API_KEY}` },
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        const url = json.results?.[provider]?.image || json.results?.[provider]?.generated_image;
        if (url) {
          console.log('[removeImageBackground] success with', provider, ':', url);
          return url;
        }
      } else {
        const errText = await res.text();
        console.warn(`[removeImageBackground] ${provider} HTTP ${res.status}: ${errText.slice(0, 100)}`);
      }
    } catch (e) {
      console.warn(`[removeImageBackground] ${provider} error:`, e);
    }
  }
  const puterResult = await puterRemoveBg(imagePath);
  if (puterResult) return puterResult;

  console.warn('[removeImageBackground] all providers failed');
  return null;
}

export async function generateStickerSuggestion(contextText: string): Promise<[string, string]> {
  if (isKeyMissing(GEMINI_API_KEY)) return keywordFallbackSticker(contextText);
  const prompt = `Situation : "${contextText}" Suggère un emoji expressif et une phrase max 4 mots en argot africain francophone. JSON brut : {"emoji": "🔥", "text": "C'EST GÂTÉ !"}`;
  try {
    const text = await callGemini(buildTextBody(prompt));
    if (!text) return keywordFallbackSticker(contextText);
    const obj = JSON.parse(text);
    return [obj.emoji || '😂', obj.text || 'ON EST ENSEMBLE !'];
  } catch (e) {
    console.warn('[generateStickerSuggestion] error:', e);
    return keywordFallbackSticker(contextText);
  }
}

export async function generateGifSearchQuery(contextText: string): Promise<string> {
  if (isKeyMissing(GEMINI_API_KEY)) return keywordFallbackGifQuery(contextText);
  const prompt = `Contexte : "${contextText}" Requête GIF en anglais, courte et drôle. JSON brut : {"query": "excited minion jumping"}`;
  try {
    const text = await callGemini(buildTextBody(prompt));
    if (!text) return keywordFallbackGifQuery(contextText);
    return JSON.parse(text).query || 'funny face';
  } catch (e) {
    console.warn('[generateGifSearchQuery] error:', e);
    return keywordFallbackGifQuery(contextText);
  }
}

export async function generateVideoStoryboard(contextText: string): Promise<[string, string]> {
  if (isKeyMissing(GEMINI_API_KEY)) return ['PROJET EN FEU', 'C\'EST GÂTÉ !'];
  const prompt = `Contexte : "${contextText}" Titre 2-3 mots + punchline rythmée pour une vidéo TikTok/Reels. JSON brut : {"title": "ALERTE CODEUR", "punchline": "QUAND LE CLIENT VEUT DU 3D DEMAIN"}`;
  try {
    const text = await callGemini(buildTextBody(prompt));
    if (!text) return ['STORY', 'C\'EST CHAUD !'];
    const obj = JSON.parse(text);
    return [obj.title || 'ALERTE', obj.punchline || 'DÉSASTRE'];
  } catch (e) {
    console.warn('[generateVideoStoryboard] error:', e);
    return ['BUG REPORT', 'L\'EXCEPTION A ENCORE FRAPPÉ !'];
  }
}

function keywordFallbackMeme(input: string): [string, string] {
  const l = input.toLowerCase();
  if (l.includes('travail') || l.includes('boulot') || l.includes('job') || l.includes('taf') || l.includes('emploi'))
    return ['QUAND LE PATRON PARLE', 'JE PENSAIS DÉJÀ AU WEEK-END'];
  if (l.includes('amour') || l.includes('fille') || l.includes('garçon') || l.includes('copain') || l.includes('copine') || l.includes('mari') || l.includes('femme'))
    return ['L\'AMOUR C\'EST BEAU', 'MAIS LE FRIC C\'EST MIEUX'];
  if (l.includes('argent') || l.includes('fric') || l.includes('thune') || l.includes('sous') || l.includes('payer') || l.includes('prix'))
    return ['QUAND TU VOIS TON SOLDE', 'LE DÉCouvert PARLE PLUS FORT'];
  if (l.includes('manger') || l.includes('bouffe') || l.includes('riz') || l.includes('faim') || l.includes('cuisine'))
    return ['LE RIZ C\'EST LA VIE', ' SANS LUI JE SUIS MORT'];
  if (l.includes('école') || l.includes('cours') || l.includes('prof') || l.includes('examen') || l.includes('étudier'))
    return ['LE PROF PARLE DEPUIS 2H', 'MA TÊTE EST DÉJÀ À LA MAISON'];
  if (l.includes('voiture') || l.includes('moto') || l.includes('conduire') || l.includes('permis'))
    return ['MON PERMIS DE CONDUIRE', 'UNE PHOTO D\'IDENTITÉ AMÉLIORÉE'];
  if (l.includes('dormir') || l.includes('lit') || l.includes('sommeil') || l.includes('réveil'))
    return ['LE RÉVEIL SONNE', 'MON CORPS DIT NON'];
  if (l.includes('famille') || l.includes('maman') || l.includes('papa') || l.includes('parent') || l.includes('enfant'))
    return ['LA FAMILLE C\'EST SACRÉ', 'SAUF PENDANT LES FÊTES'];
  if (l.includes('téléphone') || l.includes('appel') || l.includes('message') || l.includes('whatsapp'))
    return ['TU AS VU MES MESSAGES', 'POURQUOI TU NE RÉPONDS PAS ?'];
  if (l.includes('musique') || l.includes('danse') || l.includes('chanter') || l.includes('concert'))
    return ['QUAND TON MORCEAU PRÉFÉRÉ PASSE', 'TU DEVIENS UNE STAR'];
  return ['QUAND TU TAPES UN MESSAGE', 'L\'IA RÉFLÉCHIT ENCORE'];
}

function keywordFallbackSticker(input: string): [string, string] {
  const l = input.toLowerCase();
  if (l.includes('travail') || l.includes('boulot') || l.includes('job')) return ['💼', "C'EST LE BOULOT !"];
  if (l.includes('amour') || l.includes('fille') || l.includes('garçon')) return ['❤️', "L'AMOUR !"];
  if (l.includes('argent') || l.includes('fric') || l.includes('thune')) return ['💰', "C'EST L'ARGENT !"];
  if (l.includes('manger') || l.includes('bouffe') || l.includes('faim')) return ['🍚', 'LE RIZ !'];
  if (l.includes('dormir') || l.includes('lit')) return ['😴', 'AU LIT !'];
  if (l.includes('triste') || l.includes('pleur') || l.includes('mal')) return ['😭', "C'EST TRISTE !"];
  if (l.includes('rire') || l.includes('drôle') || l.includes('marrant')) return ['😂', 'TROP DRÔLE !'];
  if (l.includes('danse') || l.includes('musique') || l.includes('concert')) return ['🕺', 'ON DANSE !'];
  if (l.includes('famille') || l.includes('maman') || l.includes('papa')) return ['👨‍👩‍👧‍👦', 'LA FAMILLE !'];
  if (l.includes('cris') || l.includes('colère') || l.includes('fâché')) return ['😡', 'TROP EN COLÈRE !'];
  return ['🔥', "C'EST CHAUD !"];
}

function keywordFallbackGifQuery(input: string): string {
  const l = input.toLowerCase();
  if (l.includes('travail') || l.includes('boulot') || l.includes('job')) return 'office worker frustrated';
  if (l.includes('amour') || l.includes('fille') || l.includes('garçon')) return 'romantic love cute';
  if (l.includes('argent') || l.includes('fric') || l.includes('thune')) return 'money rich celebration';
  if (l.includes('manger') || l.includes('bouffe') || l.includes('faim')) return 'eating food funny';
  if (l.includes('dormir') || l.includes('lit')) return 'sleeping tired funny';
  if (l.includes('triste') || l.includes('pleur') || l.includes('mal')) return 'crying sad face';
  if (l.includes('rire') || l.includes('drôle') || l.includes('marrant')) return 'laughing funny meme';
  if (l.includes('danse') || l.includes('musique')) return 'dancing funny celebration';
  if (l.includes('famille') || l.includes('maman') || l.includes('papa')) return 'family reunion funny';
  if (l.includes('colère') || l.includes('fâché') || l.includes('cris')) return 'angry screaming face';
  return 'funny reaction meme';
}
