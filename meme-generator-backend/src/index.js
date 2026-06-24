const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Charger les variables d'environnement
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARES GLOBAUX
// ============================================
app.use(cors()); // Autoriser les appels depuis le frontend React Native
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Créer le dossier uploads s'il n'existe pas
const uploadDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ============================================
// ROUTES
// ============================================
const analyzeTextRouter = require('./routes/analyzeText');
const transcribeAudioRouter = require('./routes/transcribeAudio');
const remixImageRouter = require('./routes/remixImage');

app.use('/api/analyze-text', analyzeTextRouter);
app.use('/api/transcribe-audio', transcribeAudioRouter);
app.use('/api/remix-image', remixImageRouter);

// Route de santé — pour vérifier que le serveur tourne
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Meme Generator API is running 🎉',
    version: '1.0.0',
  });
});

// ============================================
// GESTION DES ERREURS GLOBALES
// ============================================
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Erreur interne du serveur',
  });
});

// Route inconnue
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route non trouvée' });
});

// ============================================
// DÉMARRAGE DU SERVEUR
// ============================================
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📋 Health check : http://localhost:${PORT}/health`);
});
