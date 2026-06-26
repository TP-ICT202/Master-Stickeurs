// src/controllers/transcribeAudioController.js
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * POST /api/transcribe-audio
 *
 * Body (multipart/form-data) :
 *   - audio : fichier audio (.amr, .m4a, .mp3, .webm, .wav)
 *
 * Réponse JSON :
 *   {
 *     "transcription": "...",
 *     "meme_text": "LIGNE HAUTE\nLIGNE BASSE"
 *   }
 */
async function handleTranscribeAudio(req, res) {
  // 1. Vérifier la présence du fichier
  if (!req.file) {
    return res.status(400).json({
      error: 'Aucun fichier audio fourni.',
      hint: 'Envoie le fichier dans un champ form-data nommé "audio".'
    });
  }

  const audioPath = req.file.path;
  const mimeType  = req.file.mimetype || 'audio/amr';

  try {
    // 2. Lire le fichier audio et l'encoder en base64
    const audioBuffer = fs.readFileSync(audioPath);
    const base64Audio = audioBuffer.toString('base64');

    // 3. Appel Gemini multimodal
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Audio
        }
      },
      {
        text: `Tu es un assistant expert en humour et memes africains / camerounais.

ÉTAPE 1 — Transcris fidèlement ce qui est dit dans l'audio en français.
ÉTAPE 2 — À partir de cette transcription, génère UN texte de meme court,
percutant et hilarant (max 2 lignes, style meme internet).

Réponds UNIQUEMENT en JSON valide, sans backticks ni commentaires, format :
{
  "transcription": "...",
  "meme_text": "HAUT DU MEME\\nBAS DU MEME"
}`
      }
    ]);

    // 4. Parser la réponse du modèle
    let rawText = result.response.text().trim();

    // Nettoyer d'éventuels backticks (sécurité)
    rawText = rawText.replace(/```json|```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // Fallback : renvoyer le texte brut si JSON invalide
      return res.status(200).json({
        transcription: rawText,
        meme_text: rawText,
        warning: 'La réponse n\'était pas du JSON valide — texte brut renvoyé.'
      });
    }

    // 5. Réponse au client
    return res.status(200).json({
      transcription: parsed.transcription ?? '',
      meme_text: parsed.meme_text ?? ''
    });

  } catch (error) {
    console.error('[transcribeAudio] Erreur :', error.message);
    return res.status(500).json({
      error: 'Erreur lors de l\'analyse par Gemini.',
      details: error.message
    });
  } finally {
    // 6. Supprimer le fichier temporaire dans tous les cas
    fs.unlink(audioPath, () => {});
  }
}

module.exports = { handleTranscribeAudio };
