const { callGemini, buildTextBody } = require('../config/gemini');

// ──────────────────────────────────────────────
// MOCK — fonctionne sans clé API
// ──────────────────────────────────────────────
const mockResponse = (text) => ({
  success: true,
  mock: true,
  tone: 'humorous',
  topText: 'MOI AVANT DE LIRE CE MESSAGE',
  bottomText: 'MOI APRÈS AVOIR LU CE MESSAGE 💀',
  suggestion: 'Drake approving meme',
});

// ──────────────────────────────────────────────
// VRAIE LOGIQUE — Gemini (100% gratuit)
// ──────────────────────────────────────────────
const analyzeWithGemini = async (text) => {
  const prompt = `
    Tu es un générateur de memes expert, fan d'humour d'Afrique francophone
    (Cameroun, Côte d'Ivoire, Sénégal). Tu maîtrises les punchlines locales.
    Analyse cette situation ou discussion :
    "${text}"
    
    Génère un meme ultra drôle adapté.
    Retourne UNIQUEMENT ce JSON brut (pas de Markdown, pas d'explications) :
    {
      "tone": "humorous",
      "topText": "TEXTE DU HAUT EN MAJUSCULES",
      "bottomText": "TEXTE DU BAS EN MAJUSCULES",
      "suggestion": "nom du template recommandé (ex: Drake, Distracted Boyfriend)"
    }
  `.trim();

  const raw  = await callGemini(buildTextBody(prompt));
  const data = JSON.parse(raw);

  return {
    success: true,
    mock: false,
    tone:       data.tone       || 'humorous',
    topText:    data.topText    || '',
    bottomText: data.bottomText || '',
    suggestion: data.suggestion || '',
  };
};

// ──────────────────────────────────────────────
// CONTROLLER
// ──────────────────────────────────────────────
const analyzeText = async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Le champ "text" est requis.',
      });
    }

    if (text.length > 2000) {
      return res.status(400).json({
        success: false,
        error: 'Le texte ne peut pas dépasser 2000 caractères.',
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.startsWith('AIzaxxxx')) {
      console.log('[analyze-text] Mode MOCK — clé Gemini non configurée');
      return res.json(mockResponse(text));
    }

    const result = await analyzeWithGemini(text);
    return res.json(result);

  } catch (error) {
    console.error('[analyze-text] Erreur :', error.message);
    next(error);
  }
};

module.exports = { analyzeText };
