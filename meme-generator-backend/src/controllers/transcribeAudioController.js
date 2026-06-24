const fs   = require('fs');
const path = require('path');
const { callGemini, MODEL_TEXT } = require('../config/gemini');

// ──────────────────────────────────────────────
// MOCK
// ──────────────────────────────────────────────
const mockResponse = () => ({
  success: true,
  mock: true,
  transcription: "Eh frère tu as vu ce qui s'est passé ? C'est incroyable !",
  emotion: 'surprised',
  topText: 'MOI EN TRAIN D\'ÉCOUTER',
  bottomText: 'MON CERVEAU QUI TRAITE L\'INFO 💀',
});

// ──────────────────────────────────────────────
// VRAIE LOGIQUE — Gemini Audio (100% gratuit)
// Gemini 2.0 Flash accepte l'audio directement
// en base64 — pas besoin de Whisper ni d'OpenAI.
// ──────────────────────────────────────────────
const transcribeWithGemini = async (filePath) => {
  // Lire et encoder l'audio en base64
  const audioBuffer  = fs.readFileSync(filePath);
  const base64Audio  = audioBuffer.toString('base64');

  // Détecter le mimeType
  const ext      = path.extname(filePath).toLowerCase();
  const mimeType = {
    '.3gp':  'audio/3gpp',
    '.m4a':  'audio/mp4',
    '.mp3':  'audio/mpeg',
    '.wav':  'audio/wav',
    '.webm': 'audio/webm',
    '.ogg':  'audio/ogg',
  }[ext] || 'audio/3gpp';

  const prompt = `
    Écoute cet enregistrement audio et :
    1. Transcris exactement ce qui est dit (en français).
    2. Identifie l'émotion principale.
    3. Génère un texte de meme drôle en argot d'Afrique francophone.
    
    Retourne UNIQUEMENT ce JSON brut :
    {
      "transcription": "texte exact de l'audio",
      "emotion": "surprised",
      "topText": "TEXTE DU HAUT EN MAJUSCULES",
      "bottomText": "TEXTE DU BAS EN MAJUSCULES"
    }
  `.trim();

  // Corps multimodal : texte + audio inline
  const body = {
    contents: [{
      parts: [
        { text: prompt },
        { inlineData: { mimeType, data: base64Audio } },
      ],
    }],
    generationConfig: { responseMimeType: 'application/json' },
  };

  const raw  = await callGemini(body, MODEL_TEXT);
  const data = JSON.parse(raw);

  return {
    success: true,
    mock: false,
    transcription: data.transcription || '',
    emotion:       data.emotion       || 'neutral',
    topText:       data.topText       || '',
    bottomText:    data.bottomText    || '',
  };
};

// ──────────────────────────────────────────────
// CONTROLLER
// ──────────────────────────────────────────────
const transcribeAudio = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier audio fourni. Champ attendu : "audio".',
      });
    }

    const filePath = req.file.path;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.startsWith('AIzaxxxx')) {
      console.log('[transcribe-audio] Mode MOCK — clé Gemini non configurée');
      fs.unlink(filePath, () => {});
      return res.json(mockResponse());
    }

    const result = await transcribeWithGemini(filePath);

    // Supprimer le fichier temporaire après traitement
    fs.unlink(filePath, (err) => {
      if (err) console.warn('[transcribe-audio] Suppression échouée :', err.message);
    });

    return res.json(result);

  } catch (error) {
    if (req.file?.path) fs.unlink(req.file.path, () => {});
    console.error('[transcribe-audio] Erreur :', error.message);
    next(error);
  }
};

module.exports = { transcribeAudio };
