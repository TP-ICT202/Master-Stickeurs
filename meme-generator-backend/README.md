# 🎭 Meme Generator Multimodal — ICT202 G2

> Application mobile Android + API Backend Node.js pour générer des memes à partir de texte, audio et images, propulsée par **Google Gemini AI**.

---

## 📋 Table des matières

1. [Architecture du projet](#architecture)
2. [Prérequis](#prérequis)
3. [Configuration de la clé API Gemini](#clé-api)
4. [Lancer l'application Android](#android)
5. [Lancer le backend Node.js](#backend)
6. [Fonctionnalités](#fonctionnalités)
7. [Tests](#tests)
8. [Structure des fichiers](#structure)

---

## Architecture

```
meme-generator-backend/
│
├── app/                          ← Application Android native (Kotlin + Jetpack Compose)
│   └── src/main/java/com/example/
│       ├── data/api/GeminiClient.kt   ← Appels directs à l'API Gemini
│       ├── data/database/             ← Base de données locale Room (SQLite)
│       ├── ui/MemeViewModel.kt        ← Logique métier (MVVM)
│       ├── ui/screens/MemeAppUi.kt    ← Interface utilisateur Compose
│       └── util/                      ← Génération et édition de memes (Canvas)
│
└── src/                          ← Backend Node.js / Express.js
    ├── index.js                       ← Point d'entrée du serveur
    ├── config/                        ← Multer (uploads) + OpenAI client
    ├── routes/                        ← Routes API REST
    └── controllers/                   ← Logique des endpoints
```

---

## Prérequis

### Pour l'application Android
| Outil | Version minimale |
|-------|-----------------|
| Android Studio | Hedgehog (2023.1.1) ou supérieur |
| JDK | 11+ |
| Android SDK | API 24 (Android 7.0) minimum |
| Kotlin | 2.x (inclus dans Android Studio) |

### Pour le backend Node.js
| Outil | Version |
|-------|---------|
| Node.js | 18+ |
| npm | 9+ |

---

## Clé API

### Obtenir une clé Google Gemini (gratuit)

1. Aller sur [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Cliquer sur **"Create API key"**
3. Copier la clé générée (format : `AIza...`)

### Configurer la clé pour l'application Android

Créer (ou modifier) le fichier **`.env`** à la racine du projet :

```env
GEMINI_API_KEY=AIzaVotreCléIciSansGuillemets
```

> ⚠️ Le plugin **Secrets Gradle** lit automatiquement ce fichier et l'injecte dans `BuildConfig.GEMINI_API_KEY`.  
> Ne jamais committer le fichier `.env` dans Git (il est dans `.gitignore`).

### Configurer la clé pour le backend Node.js

Le même fichier `.env` est utilisé. Ajouter également :

```env
PORT=3000
OPENAI_API_KEY=sk-...   # Optionnel, si vous utilisez OpenAI
```

---

## Android

### 1. Ouvrir le projet

```
Android Studio → Open → sélectionner le dossier meme-generator-backend/
```

Android Studio va automatiquement détecter le projet Gradle.

### 2. Synchroniser Gradle

```
File → Sync Project with Gradle Files
```

ou cliquer sur **🔄 Sync Now** dans la barre de notification.

### 3. Lancer sur un émulateur ou device physique

```
Run → Run 'app'   (ou Shift+F10)
```

**Sur device physique :**
- Activer **Débogage USB** dans les options développeur
- Brancher via USB et accepter la demande d'autorisation

### 4. Permissions demandées au premier lancement

L'application demandera automatiquement :
- 🎤 Accès au microphone (Voice-to-Meme)
- 🖼️ Accès à la galerie (Status Remixer)

---

## Backend

### 1. Installer les dépendances

```bash
cd meme-generator-backend
npm install
```

### 2. Configurer l'environnement

```bash
cp .env.example .env
# Éditer .env et renseigner les clés API
```

### 3. Démarrer le serveur

```bash
# Mode développement (redémarrage automatique)
npm run dev

# Mode production
npm start
```

Le serveur démarre sur `http://localhost:3000`

### 4. Vérifier que le serveur tourne

```bash
curl http://localhost:3000/health
# Réponse attendue : {"status":"ok","message":"Meme Generator API is running 🎉"}
```

### 5. Exposer le serveur pour les autres membres de l'équipe

```bash
# Installer ngrok si nécessaire
npm install -g ngrok

# Exposer le port 3000
ngrok http 3000
# Partager l'URL https://xxxxx.ngrok.io à l'équipe
```

### Endpoints disponibles

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/health` | Vérification de l'état du serveur |
| `POST` | `/api/analyze-text` | Context Reader — texte → meme |
| `POST` | `/api/transcribe-audio` | Voice-to-Meme — audio → meme |
| `POST` | `/api/remix-image` | Status Remixer — image → texte meme |

---

## Fonctionnalités

### Core (obligatoire)

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Context Reader** | Coller un extrait de discussion → Gemini génère un meme texte humoristique |
| 2 | **Voice-to-Meme** | Enregistrer une note vocale → transcription + génération meme |
| 3 | **Status Remixer** | Uploader une photo → analyse vision IA → texte de meme superposé |

### Bonus implémentés

| Feature | Description |
|---------|-------------|
| **Génération d'image IA** | Créer un fond de meme via Imagen (gemini-2.5-flash-preview) |
| **Share Intent** | Recevoir une image ou du texte directement depuis WhatsApp / autres apps |
| **Galerie locale** | Sauvegarder et consulter les memes générés (Room DB) |
| **Stickers IA** | Génération d'emoji + texte court contextualisé |
| **GIF Search** | Requête de GIF générée par IA selon le contexte |
| **Thèmes visuels** | Dark Void, Cyberpunk, Cameroun Green-Red, etc. |
| **Filtres image** | Grayscale, Sepia, Invert, Neon Violet, etc. |
| **Dessin tactile** | Dessiner sur le meme avec le doigt |

---

## Tests

### Tests unitaires (JVM — rapide)

```bash
./gradlew testDebugUnitTest
```

Couvre :
- `TemplateGenerator` — génération des 10 fonds prédéfinis
- `MemeGeneratorUtil` — fusion texte/image, filtres, dimensions

### Tests screenshot (Roborazzi)

```bash
# Générer les images de référence
./gradlew recordRoborazziDebug

# Comparer avec les références (CI/CD)
./gradlew verifyRoborazziDebug
```

Les screenshots sont sauvegardés dans `app/src/test/screenshots/` :

| Fichier | Écran |
|---------|-------|
| `01_splash_screen.png` | Écran d'accueil |
| `02_context_reader_empty.png` | Context Reader vide |
| `03_context_reader_with_input.png` | Context Reader avec texte |
| `04_voice_to_meme.png` | Voice-to-Meme |
| `05_status_remixer.png` | Status Remixer |
| `06_gallery_empty.png` | Galerie vide |
| `07_settings.png` | Paramètres |

### Tests backend Node.js

```bash
cd meme-generator-backend
# Test manuel avec curl
curl -X POST http://localhost:3000/api/analyze-text \
  -H "Content-Type: application/json" \
  -d '{"text": "Ma chérie dit quelle est en route mais on entend la douche"}'
```

---

## Structure

```
app/src/main/
├── AndroidManifest.xml              ← Permissions + intents
├── java/com/example/
│   ├── MainActivity.kt              ← Point d'entrée Android
│   ├── data/
│   │   ├── api/GeminiClient.kt      ← Tous les appels Gemini API
│   │   └── database/
│   │       ├── MemeDao.kt           ← Requêtes Room SQL
│   │       ├── MemeDatabase.kt      ← Configuration Room DB
│   │       ├── MemeEntity.kt        ← Modèle de données meme
│   │       └── MemeRepository.kt    ← Abstraction du DAO
│   ├── ui/
│   │   ├── MemeViewModel.kt         ← ViewModel MVVM (logique + états)
│   │   ├── screens/MemeAppUi.kt     ← Tous les écrans Compose
│   │   └── theme/                   ← Couleurs, typographie, thème
│   └── util/
│       ├── MemeGeneratorUtil.kt     ← Canvas : rendu + filtres + scribbles
│       └── TemplateGenerator.kt     ← 10 fonds prédéfinis procéduraux

src/                                 ← Backend Node.js
├── index.js                         ← Serveur Express + middlewares
├── config/
│   ├── multer.js                    ← Config upload fichiers
│   └── openai.js                    ← Client OpenAI
├── routes/
│   ├── analyzeText.js
│   ├── transcribeAudio.js
│   └── remixImage.js
└── controllers/
    ├── analyzeTextController.js
    ├── transcribeAudioController.js
    └── remixImageController.js
```

---

## Équipe — ICT202 G2

| Binôme | Responsabilité |
|--------|---------------|
| **Binôme 1** | Backend Node.js + orchestration API IA |
| **Binôme 2** | Feature Context Reader (frontend + intégration) |
| **Binôme 3** | Feature Voice-to-Meme (frontend + intégration) |
| **Binôme 4** | Feature Status Remixer + UI globale + livrables |

---

## Modèles Gemini utilisés

| Modèle | Usage |
|--------|-------|
| `gemini-2.0-flash` | Texte, vision, stickers, GIFs, vidéo storyboard |
| `gemini-2.5-flash-preview-05-20` | Génération d'image (Imagen) |

> La clé API Gemini est **gratuite** sur [Google AI Studio](https://aistudio.google.com) avec un quota généreux pour les tests.
