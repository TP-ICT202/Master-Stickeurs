const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const transcribeAudioController = require('../controllers/transcribeAudioController');

/**
 * POST /api/transcribe-audio
 * Form-data : { audio: <fichier audio> }
 * Retourne : { success, transcription, memeText, emotion }
 */
router.post('/', upload.single('audio'), transcribeAudioController.transcribeAudio);

module.exports = router;
