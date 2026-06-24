const axios = require('axios');

/**
 * Client Gemini pour Node.js — 100% gratuit.
 * Utilise l'API REST directement (pas de SDK officiel requis).
 *
 * Clé API : https://aistudio.google.com/app/apikey
 * Quota gratuit : 1 500 requêtes / jour sur gemini-2.0-flash
 */

const GEMINI_BASE = 'https://generativelanguage.googleapis.com';
const MODEL_TEXT  = 'gemini-2.0-flash';

/**
 * Appel générique à l'API Gemini.
 * @param {object} body - Corps de la requête JSON Gemini
 * @returns {string} - Texte brut retourné par le modèle
 */
const callGemini = async (body, model = MODEL_TEXT) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.startsWith('AIzaxxxx')) {
    throw new Error('GEMINI_API_KEY manquante dans .env');
  }

  const response = await axios.post(
    `${GEMINI_BASE}/v1beta/models/${model}:generateContent?key=${apiKey}`,
    body,
    { headers: { 'Content-Type': 'application/json' }, timeout: 60000 }
  );

  return response.data.candidates[0].content.parts[0].text.trim();
};

/**
 * Construit un corps de requête texte simple pour Gemini.
 */
const buildTextBody = (prompt) => ({
  contents: [{ parts: [{ text: prompt }] }],
  generationConfig: { responseMimeType: 'application/json' },
});

module.exports = { callGemini, buildTextBody, MODEL_TEXT };
