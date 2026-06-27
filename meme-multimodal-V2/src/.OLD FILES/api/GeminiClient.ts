import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL_GEMINI = 'https://generativelanguage.googleapis.com';
const BASE_URL_EDEN = 'https://api.edenai.run/v2';

/**
 * Clean up text response and extract valid JSON block.
 * This is 100% robust against markdown backticks (```json ... ```) or extra prose.
 */
function cleanAndExtractJson(input: string): string {
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

export const GeminiClient = {
  /**
   * Retrieves keys from local AsyncStorage storage or fallback environment variables.
   */
  getApiKeys: async (): Promise<{ gemini: string; eden: string }> => {
    try {
      const gemini = await AsyncStorage.getItem('GEMINI_API_KEY');
      const eden = await AsyncStorage.getItem('EDEN_API_KEY');
      return {
        gemini: gemini || '',
        eden: eden || ''
      };
    } catch {
      return { gemini: '', eden: '' };
    }
  },

  /**
   * 1. Generates a pair of texts (top + bottom) for a situation context
   */
  generateMemeTextSuggestions: async (situation: string): Promise<{ top: string; bottom: string }> => {
    const keys = await GeminiClient.getApiKeys();
    
    const prompt = `
      Tu es un générateur de memes plein d'humour et d'ironie d'Afrique de l'Ouest (Cameroun, Côte d'Ivoire, Sénégal...), fan de blagues courtes et de punchlines locales.
      Analyse la situation ou discussion suivante :
      "${situation}"
      
      Suggère un texte de meme ultra drôle adapté à cette situation. 
      Retourne STRICTEMENT un objet JSON avec deux propriétés 'top' et 'bottom' (toutes deux en lettres MAJUSCULES).
      IMPORTANT: Ne mets aucun bloc de code Markdown, juste le JSON brut valide. Pas d'explications superflues.
      Format attendu :
      {"top": "TEXTE DU HAUT EN MAJUSCULES", "bottom": "TEXTE DU BAS EN MAJUSCULES"}
    `.trim();

    // Use direct Gemini if available
    if (keys.gemini && keys.gemini !== 'MY_GEMINI_API_KEY') {
      try {
        const response = await fetch(`${BASE_URL_GEMINI}/v1beta/models/gemini-3.5-flash:generateContent?key=${keys.gemini}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
          })
        });

        if (response.ok) {
          const resJson = await response.json();
          const rawText = resJson.candidates[0].content.parts[0].text;
          const cleanJsonStr = cleanAndExtractJson(rawText);
          const parsed = JSON.parse(cleanJsonStr);
          return {
            top: (parsed.top || "QUAND L'IA ESSAYE DE FAIRE TOUT SEULE").toUpperCase(),
            bottom: (parsed.bottom || "C'EST DRÔLE MAIS PEUT MIEUX FAIRE").toUpperCase()
          };
        }
      } catch (e) {
        console.warn('Direct Gemini call failed in generateMemeTextSuggestions, using fallback...', e);
      }
    }

    // Fallback to Eden AI
    if (keys.eden && keys.eden !== 'MY_EDEN_API_KEY') {
      try {
        const response = await fetch(`${BASE_URL_EDEN}/text/generation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${keys.eden}`
          },
          body: JSON.stringify({
            providers: 'google',
            text: prompt,
            temperature: 0.7,
            max_tokens: 300
          })
        });

        if (response.ok) {
          const resJson = await response.json();
          const rawText = resJson.google.generated_text;
          const cleanJsonStr = cleanAndExtractJson(rawText);
          const parsed = JSON.parse(cleanJsonStr);
          return {
            top: (parsed.top || "QUAND EDEN AI VIENT À LA RESCOUSSE").toUpperCase(),
            bottom: (parsed.bottom || "TOUT REPART SANS ENCOMBRES !").toUpperCase()
          };
        }
      } catch (e) {
        console.error('Eden AI generateMemeTextSuggestions failed:', e);
      }
    }

    // Default simulation fallback
    return {
      top: "QUAND LA CLÉ API MANQUE À L'APPEL",
      bottom: "SOUFFLE UN COUP ET METS À JOUR TES CLÉS DANS LES RÉGLAGES !"
    };
  },

  /**
   * 2. Voice-to-Meme suggestions based on audio transcript
   */
  generateVoiceToMemeText: async (audioTranscript: string): Promise<{ top: string; bottom: string }> => {
    const keys = await GeminiClient.getApiKeys();
    const prompt = `
      Analyse la transcription de note vocale suivante : "${audioTranscript}"
      Génère un meme textuel hilarant. Détecte le sentiment ou la blague.
      Retourne STRICTEMENT un objet JSON avec 'top' et 'bottom' en lettres MAJUSCULES.
      Format attendu :
      {"top": "TEXTE DU HAUT", "bottom": "TEXTE DU BAS"}
    `.trim();

    if (keys.gemini && keys.gemini !== 'MY_GEMINI_API_KEY') {
      try {
        const response = await fetch(`${BASE_URL_GEMINI}/v1beta/models/gemini-3.5-flash:generateContent?key=${keys.gemini}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
          })
        });

        if (response.ok) {
          const resJson = await response.json();
          const rawText = resJson.candidates[0].content.parts[0].text;
          const cleanJsonStr = cleanAndExtractJson(rawText);
          const parsed = JSON.parse(cleanJsonStr);
          return {
            top: (parsed.top || "QUAND TU ENVOIES UN VOCAL SANS PRESSION").toUpperCase(),
            bottom: (parsed.bottom || "ET QUE L'IA DÉBALLE TOUT TON SECRET !").toUpperCase()
          };
        }
      } catch {}
    }

    // Default simulation fallback
    return {
      top: "QUAND LA TRANSCRIPTION SE TERMINE EN BEAUTÉ",
      bottom: "ET QUE LE GROUPE DE DISCUSSION RESTE SANS VOIX !"
    };
  },

  /**
   * 3. Analyze image in base64 (multimodal) to generate meme overlays
   */
  analyzeImageForMeme: async (imageBase64: string, mimeType: string = 'image/jpeg'): Promise<{ top: string; bottom: string }> => {
    const keys = await GeminiClient.getApiKeys();
    const prompt = `
      Analyse cette image. Décris brièvement la situation avec humour et suggère un texte pour en faire un meme.
      Retourne STRICTEMENT un objet JSON brut valide avec deux clés 'top' et 'bottom', rédigés en français / argot jeune percutant.
      Format attendu :
      {"top": "TEXTE DU HAUT EN MAJUSCULES", "bottom": "TEXTE DU BAS EN MAJUSCULES"}
    `.trim();

    if (keys.gemini && keys.gemini !== 'MY_GEMINI_API_KEY') {
      try {
        const pureBase64 = imageBase64.includes('base64,') ? imageBase64.split('base64,')[1] : imageBase64;
        const response = await fetch(`${BASE_URL_GEMINI}/v1beta/models/gemini-3.5-flash:generateContent?key=${keys.gemini}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: prompt },
                { inlineData: { mimeType, data: pureBase64 } }
              ]
            }],
            generationConfig: { responseMimeType: 'application/json' }
          })
        });

        if (response.ok) {
          const resJson = await response.json();
          const rawText = resJson.candidates[0].content.parts[0].text;
          const cleanJsonStr = cleanAndExtractJson(rawText);
          const parsed = JSON.parse(cleanJsonStr);
          return {
            top: (parsed.top || "L'IA DÉCOUVRE TON ÉCRAN").toUpperCase(),
            bottom: (parsed.bottom || "ET COMPREND DIRECTEMENT TON CODE DE L'ENFER").toUpperCase()
          };
        }
      } catch (e) {
        console.warn('Multimodal Direct Gemini failed:', e);
      }
    }

    return {
      top: "QUAND L'IMAGE EST TROP PUISSANTE",
      bottom: "SANS CONFIGURATION DE CLÉ MULTIMODALE"
    };
  },

  /**
   * 4. Generates a custom background using Imagen model (gemini-2.5-flash-image)
   */
  generateImageFromPrompt: async (prompt: string): Promise<string | null> => {
    const keys = await GeminiClient.getApiKeys();
    if (!keys.gemini || keys.gemini === 'MY_GEMINI_API_KEY') return null;

    const formattedPrompt = `Meme template raw image, highly expressive, concept: ${prompt}. Funny background without any text. 3D cartoon style or funny vector design.`;

    try {
      const response = await fetch(`${BASE_URL_GEMINI}/v1beta/models/gemini-2.5-flash-image:generateContent?key=${keys.gemini}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: formattedPrompt }] }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
            imageConfig: {
              aspectRatio: "1:1",
              imageSize: "512"
            }
          }
        })
      });

      if (response.ok) {
        const resJson = await response.json();
        const parts = resJson.candidates[0].content.parts;
        for (let i = 0; i < parts.length; i++) {
          if (parts[i].inlineData) {
            const base64Data = parts[i].inlineData.data;
            const mimeType = parts[i].inlineData.mimeType || 'image/png';
            return `data:${mimeType};base64,${base64Data}`;
          }
        }
      }
    } catch (e) {
      console.error('Error generating image via Imagen:', e);
    }
    return null;
  },

  /**
   * 5. Suggère un emoji et un texte court de sticker adaptés au contexte donné.
   */
  generateStickerSuggestion: async (contextText: string): Promise<{ emoji: string; text: string }> => {
    const keys = await GeminiClient.getApiKeys();
    const prompt = `
      On a cette situation ou contexte : "${contextText}"
      Suggère un emoji unique très expressif (comme 😂, 💀, 🤡, 🚀, 🤦‍♂️, 🤯) et une phrase ultra-courte (max 3-4 mots, en français argotique jeune et marrant d'Afrique francophone de préférence) pour en faire un sticker humoristique.
      Retourne STRICTEMENT un objet JSON brut avec les clés 'emoji' et 'text'.
      Format attendu :
      {"emoji": "🔥", "text": "C'EST GÂTÉ !"}
    `.trim();

    if (keys.gemini && keys.gemini !== 'MY_GEMINI_API_KEY') {
      try {
        const response = await fetch(`${BASE_URL_GEMINI}/v1beta/models/gemini-3.5-flash:generateContent?key=${keys.gemini}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
          })
        });

        if (response.ok) {
          const resJson = await response.json();
          const rawText = resJson.candidates[0].content.parts[0].text;
          const cleanJsonStr = cleanAndExtractJson(rawText);
          const parsed = JSON.parse(cleanJsonStr);
          return {
            emoji: parsed.emoji || '😂',
            text: (parsed.text || 'ON EST ENSEMBLE !').toUpperCase()
          };
        }
      } catch {}
    }

    return { emoji: '🔥', text: "C'EST TRÈS CHAUD !" };
  },

  /**
   * 6. Generates a GIF search query
   */
  generateGifSearchQuery: async (contextText: string): Promise<string> => {
    const keys = await GeminiClient.getApiKeys();
    const prompt = `
      On a ce contexte : "${contextText}"
      Suggère une requête de recherche de GIF en anglais très précise et drôle décrivant cette situation exacte (par exemple "confused programmer crying", "excited baby dancing", "awkward stare facepalm").
      Retourne STRICTEMENT un objet JSON brut avec une clé 'query' sans balises Markdown.
      Format attendu :
      {"query": "excited minion jumping"}
    `.trim();

    if (keys.gemini && keys.gemini !== 'MY_GEMINI_API_KEY') {
      try {
        const response = await fetch(`${BASE_URL_GEMINI}/v1beta/models/gemini-3.5-flash:generateContent?key=${keys.gemini}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
          })
        });

        if (response.ok) {
          const resJson = await response.json();
          const rawText = resJson.candidates[0].content.parts[0].text;
          const cleanJsonStr = cleanAndExtractJson(rawText);
          const parsed = JSON.parse(cleanJsonStr);
          return parsed.query || 'funny cat screaming';
        }
      } catch {}
    }

    return 'funny cat screaming';
  },

  /**
   * 7. Generates animated Short Video storyboard title and punchline
   */
  generateVideoStoryboard: async (contextText: string): Promise<{ title: string; punchline: string }> => {
    const keys = await GeminiClient.getApiKeys();
    const prompt = `
      On a cette situation : "${contextText}"
      Imagine un storyboard court pour une vidéo TikTok/Reel humoristique de 5 secondes.
      Suggère un titre d'introduction dramatique ('title') et une punchline finale fracassante ('punchline').
      Retourne STRICTEMENT un objet JSON brut avec ces clés sans fioritures.
      Format attendu :
      {"title": "ALERTE MAXIMALE", "punchline": "DÉSASTRE GÉNÉRALISÉ"}
    `.trim();

    if (keys.gemini && keys.gemini !== 'MY_GEMINI_API_KEY') {
      try {
        const response = await fetch(`${BASE_URL_GEMINI}/v1beta/models/gemini-3.5-flash:generateContent?key=${keys.gemini}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
          })
        });

        if (response.ok) {
          const resJson = await response.json();
          const rawText = resJson.candidates[0].content.parts[0].text;
          const cleanJsonStr = cleanAndExtractJson(rawText);
          const parsed = JSON.parse(cleanJsonStr);
          return {
            title: (parsed.title || 'ALERTE DRAME').toUpperCase(),
            punchline: (parsed.punchline || 'VRAIMENT UNE HISTOIRE DE FOU').toUpperCase()
          };
        }
      } catch {}
    }

    return {
      title: 'ALERTE MAXIMALE ⚠️',
      punchline: 'DÉSASTRE GÉNÉRALISÉ ET IRRÉVERSIBLE !'
    };
  }
};
