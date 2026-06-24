const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const remixImageController = require('../controllers/remixImageController');

/**
 * POST /api/remix-image
 * Form-data : { image: <fichier image> }
 * Retourne : { success, memeText, topText, bottomText }
 */
router.post('/', upload.single('image'), remixImageController.remixImage);

module.exports = router;
