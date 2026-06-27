/**
 * MemeGen AI - Universal API Utility (api.js)
 * 
 * This file provides a highly robust utility function to generate structured memes (top and bottom texts)
 * from user context (text or base64 image) using either the Google Gemini API directly or the Eden AI API.
 * It uses environment variables from your '.env' configuration (GEMINI_API_KEY and EDEN_API_KEY).
 */

const BASE_URL_GEMINI = 'https://generativelanguage.googleapis.com';
const BASE_URL_EDEN = 'https://api.edenai.run/v2';

/**
 * Clean up text response and extract a valid JSON block.
 * This is 100% robust against markdown backticks (```json ... ```) and other extraneous text.
 * 
 * @param {string} input - Raw text response from the AI
 * @returns {string} - Cleaned JSON string
 */
function cleanAndExtractJson(input) {
  let str = input.trim();
  
  if (str.startsWith('```')) {
    const lastBackticks = str.lastIndexOf('```');
    if (lastBackticks > 3) {
      const firstLineEnd = str.indexOf('\n');
      if (firstLineEnd !== -1 && firstLineEnd < lastBackticks) {
        str = str.substring(firstLineEnd + 1, lastBackticks);
      } else {
        str = str.replace(/```json/g, '').replace(/```/g, '');
      }
    } else {
      str = str.replace(/```json/g, '').replace(/```/g, '');
    }
  }
  
  str = str.trim();
  
  const firstBrace = str.indexOf('{');
  const lastBrace = str.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return str.substring(firstBrace, lastBrace + 1);
  }
  
  const firstBracket = str.indexOf('[');
  const lastBracket = str.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    return str.substring(firstBracket, lastBracket + 1);
  }
  
  return str;
}

/**
 * Primary utility function to generate meme captions based on text or image context.
 * 
 * @param {Object} params
 * @param {string} params.contextText - The user situation or discussion context
 * @param {string} [params.imageBase64] - Optional base64-encoded image data
 * @param {string} [params.mimeType="image/jpeg"] - MIME type of the base64 image (e.g., "image/jpeg", "image/png")
 * @param {string} [params.geminiKey] - Optional direct Gemini API Key override
 * @param {string} [params.edenKey] - Optional direct Eden AI API Key override
 * @returns {Promise<{top: string, bottom: string}>} - The structured meme object
 */
export async function generateMemeFromContext({
  contextText,
  imageBase64,
  mimeType = 'image/jpeg',
  geminiKey,
  edenKey
}) {
  // 1. Resolve keys from overrides or environment variables
  const finalGeminiKey = geminiKey || (typeof process !== 'undefined' && process.env ? process.env.GEMINI_API_KEY : '') || '';
  const finalEdenKey = edenKey || (typeof process !== 'undefined' && process.env ? process.env.EDEN_API_KEY : '') || '';

  if (!contextText && !imageBase64) {
    return {
      top: 'QUAND LE CONTEXTE EST COMPLETEMENT VIDE',
      bottom: 'L\'IA PEUT RIEN FAIRE SANS INSTRUCTIONS !'
    };
  }

  const prompt = `
    Tu es un générateur de mèmes plein d'humour et d'ironie d'Afrique de l'Ouest (Cameroun, Côte d'Ivoire, Sénégal, etc.), fan de blagues courtes et de punchlines locales.
    Analyse la situation, discussion ou image fournie par l'utilisateur :
    "${contextText || 'Analyse cette image pour en faire un mème'}"
    
    Suggère un texte de mème ultra drôle adapté à ce contexte.
    Retourne STRICTEMENT un objet JSON valide avec deux propriétés 'top' et 'bottom' représentant respectivement la légende du haut et celle du bas en lettres MAJUSCULES.
    IMPORTANT: Ne mets aucun bloc de code Markdown, juste le JSON brut valide. Pas d'explications superflues.
    Format attendu :
    {"top": "TEXTE DU HAUT EN MAJUSCULES", "bottom": "TEXTE DU BAS EN MAJUSCULES"}
  `.trim();

  // 2. Try direct Gemini API if GEMINI_API_KEY is available
  if (finalGeminiKey && finalGeminiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const parts = [{ text: prompt }];
      
      // If image is supplied, append inlineData block
      if (imageBase64) {
        // Strip out base64 prefixes if present (e.g. "data:image/jpeg;base64,")
        const pureBase64 = imageBase64.includes('base64,') 
          ? imageBase64.split('base64,')[1] 
          : imageBase64;
          
        parts.push({
          inlineData: {
            mimeType: mimeType,
            data: pureBase64
          }
        });
      }

      const response = await fetch(`${BASE_URL_GEMINI}/v1beta/models/gemini-3.5-flash:generateContent?key=${finalGeminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: parts }],
          generationConfig: { 
            responseMimeType: 'application/json'
          }
        })
      });

      if (response.ok) {
        const resJson = await response.json();
        const rawText = resJson.candidates[0].content.parts[0].text;
        const cleanJsonStr = cleanAndExtractJson(rawText);
        const parsed = JSON.parse(cleanJsonStr);
        return {
          top: (parsed.top || 'QUAND L\'IA ESSAYE DE FAIRE TOUT SEULE').toUpperCase(),
          bottom: (parsed.bottom || 'C\'EST DRÔLE MAIS PEUT MIEUX FAIRE').toUpperCase()
        };
      }
    } catch (err) {
      console.warn('Direct Gemini API call failed, attempting Eden AI fallback...', err);
    }
  }

  // 3. Fallback to Eden AI API if EDEN_API_KEY is available
  if (finalEdenKey && finalEdenKey !== 'MY_EDEN_API_KEY') {
    try {
      // Eden AI Text Generation with google provider (which maps to Gemini)
      const response = await fetch(`${BASE_URL_EDEN}/text/generation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${finalEdenKey}`
        },
        body: JSON.stringify({
          providers: 'google',
          text: prompt + (imageBase64 ? " (Note: L'utilisateur a aussi téléversé une image pour l'analyse)." : ""),
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (response.ok) {
        const resJson = await response.json();
        const rawText = resJson.google.generated_text;
        const cleanJsonStr = cleanAndExtractJson(rawText);
        const parsed = JSON.parse(cleanJsonStr);
        return {
          top: (parsed.top || 'QUAND TU PASSE PAR EDEN AI').toUpperCase(),
          bottom: (parsed.bottom || 'TOUT FONCTIONNE À LA PERFECTION !').toUpperCase()
        };
      }
    } catch (err) {
      console.error('Eden AI API call failed:', err);
    }
  }

  // 4. Default Offline Mock Fallback if no keys or both failed
  return {
    top: 'QUAND LES DEUX CLÉS API SONT SUR LE CARREAU',
    bottom: 'SOUFFLE UN COUP ET VÉRIFIE TON FICHIER .ENV !'
  };
}
