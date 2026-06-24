const fs   = require('fs');
const path = require('path');
const { callGemini, MODEL_TEXT } = require('../config/gemini');

// ──────────────────────────────────────────────
// MOCK
// ──────────────────────────────────────────────
const mockResponse = () => ({
  success: true,
  mock: true,
  topText:    'ATTENDS...',
  bottomText: 'C\'EST MOI SUR CETTE PHOTO ?? 💀',
  suggestion: 'Surprised Pikachu',
});

// ──────────────────────────────────────────────
// VRAIE LOGIQUE — Gemini Vision (100% gratuit)
// ──────────────────────────────────────────────
const remixWithGemini = async (filePath) => {
  const imageBuffer = fs.readFileSync(filePath);
  const base64Image = imageBuffer.toString('base64');
  const ext         = path.extname(filePath).toLowerCase();
  const mimeType    = ext === '.png' ? 'image/png' : 'image/jpeg';

  const prompt = `
    Analyse cette image avec humour.
    Génère un texte de meme drôle en français argotique d'Afrique francophone.
    Retourne UNIQUEMENT ce JSON brut :
    {
      "topText": "TEXTE DU HAUT EN MAJUSCULES",
      "bottomText": "TEXTE DU BAS EN MAJUSCULES",
      "suggestion": "nom du template recommandé"
    }
  `.trim();

  const body = {
    contents: [{
      parts: [
        { text: prompt },
        { inlineData: { mimeType, data: base64Image } },
      ],
    }],
    generationConfig: { responseMimeType: 'application/json' },
  };

  const raw  = await callGemini(body, MODEL_TEXT);
  const data = JSON.parse(raw);

  return {
    success: true,
    mock: false,
    topText:    data.topText    || '',
    bottomText: data.bottomText || '',
    suggestion: data.suggestion || '',
  };
};

// ──────────────────────────────────────────────
// CONTROLLER
// ──────────────────────────────────────────────
const remixImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier image fourni. Champ attendu : "image".',
      });
    }

    const filePath = req.file.path;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.startsWith('AIzaxxxx')) {
      console.log('[remix-image] Mode MOCK — clé Gemini non configurée');
      fs.unlink(filePath, () => {});
      return res.json(mockResponse());
    }

    const result = await remixWithGemini(filePath);

    fs.unlink(filePath, (err) => {
      if (err) console.warn('[remix-image] Suppression échouée :', err.message);
    });

    return res.json(result);

  } catch (error) {
    if (req.file?.path) fs.unlink(req.file.path, () => {});
    console.error('[remix-image] Erreur :', error.message);
    next(error);
  }
};

module.exports = { remixImage };
