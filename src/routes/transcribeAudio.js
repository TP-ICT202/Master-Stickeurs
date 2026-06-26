// src/routes/transcribeAudio.js
const express = require('express');
const router = express.Router();
const { handleTranscribeAudio } = require('../controllers/transcribeAudioController');
const upload = require('../config/multer');

/**
 * POST /api/transcribe-audio
 * Reçoit un fichier audio, transcrit avec Gemini et génère un texte de meme.
 * Champ attendu dans le form-data : "audio" (fichier .amr / .m4a / .mp3 / .webm)
 */
router.post('/', upload.single('audio'), handleTranscribeAudio);

module.exports = router;
