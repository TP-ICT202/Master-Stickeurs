const express = require('express');
const router = express.Router();
const analyzeTextController = require('../controllers/analyzeTextController');

/**
 * POST /api/analyze-text
 * Body : { text: "extrait de discussion..." }
 * Retourne : { success, memeText, tone, suggestion }
 */
router.post('/', analyzeTextController.analyzeText);

module.exports = router;
