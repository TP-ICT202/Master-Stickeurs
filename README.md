# Master-Stickeurs — Meme Generator Multimodal

> **ICT202 G2** — Application mobile Android + API Backend Node.js pour générer des memes, stickers, GIFs et vidéos courtes à partir de texte, audio et images, propulsée par **Google Gemini AI** avec fallback **Grok (xAI)**.

---

## Architecture du projet

```
Stickeurs Master/                  ← Racine du dépôt Git
├── meme-multimodal-V2/            ← Frontend React Native (TypeScript)
│   ├── android/                   ← Build Android APK
│   ├── src/
│   │   ├── components/            ← Composants réutilisables
│   │   ├── screens/               ← Écrans de l'app
│   │   ├── services/              ← API clients (Gemini, Grok, Giphy, Pexels, EdenAI...)
│   │   ├── store/                 ← State management (Zustand)
│   │   └── utils/                 ← Utilitaires (sauvegarde, partage)
│   └── package.json
│
├── meme-generator-backend/        ← Backend Node.js / Express.js
│   ├── src/
│   │   ├── index.js               ← Point d'entrée du serveur
│   │   ├── config/                ← Multer + clients API
│   │   ├── routes/                ← Routes REST
│   │   └── controllers/           ← Logique métier
│   ├── app/                       ← Version Android native (Kotlin + Jetpack Compose)
│   └── package.json
│
├── .gitignore                     ← Règles d'ignorance globales
├── NOTES.txt                      ← Notes de développement
└── README.md                      ← Ce fichier
```

---

## Fonctionnalités

### Core (obligatoire)
| # | Feature | Frontend | Backend |
|---|---------|----------|---------|
| 1 | **Context Reader** — Texte → meme | `TextToMemeScreen.tsx` | `POST /api/analyze-text` |
| 2 | **Voice-to-Meme** — Audio → transcription + meme | `VoiceToMemeScreen.tsx` | `POST /api/transcribe-audio` |
| 3 | **Status Remixer** — Image → analyse + meme | `StatusRemixerScreen.tsx` | `POST /api/remix-image` |

### Bonus
| Feature | Description |
|---------|-------------|
| **Stickers IA** | Emoji + phrase courte en argot africain |
| **GIF Search** | Recherche de GIFs via Giphy avec requête générée par IA |
| **Short Videos** | Recherche de vidéos courtes via Pexels |
| **Galerie locale** | Sauvegarde et historique des memes générés |
| **Multi-langues** | Français, Anglais, Espagnol |
| **Thèmes visuels** | Dark Mode, glassmorphisme |
| **Fallback API** | Grok (xAI) si Gemini est indisponible |

---

## Prérequis

| Outil | Version |
|-------|---------|
| Node.js | 18+ |
| npm / yarn | 9+ |
| JDK | 17 |
| Android Studio | Hedgehog+ |
| Android SDK | API 24+ |

---

## Configuration des clés API

### Clés requises

| Variable | Service | Où l'obtenir |
|----------|---------|-------------|
| `DEFAULT_GEMINI_API_KEY` | Google Gemini AI | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `GROK_API_KEY` | xAI (fallback) | [x.ai](https://x.ai/api) |

### Clés optionnelles (améliorent les fonctionnalités)

| Variable | Service | Fonctionnalité |
|----------|---------|---------------|
| `GIPHY_API_KEY` | Giphy | Recherche de GIFs |
| `PEXELS_API_KEY` | Pexels | Recherche de vidéos |
| `EDEN_API_KEY` | EdenAI | Suppression d'arrière-plan |
| `PICSART_API_KEY` | Picsart | Génération d'images |
| `IMAGE_GPT_API_KEY` | ImageGPT | Génération d'images (fallback) |
| `POLINATION_AI_API_KEY` | Pollinations | Génération d'images (fallback) |

### Procédure

1. Copier le fichier d'exemple :
   ```bash
   # Frontend
   cp meme-multimodal-V2/.env.example meme-multimodal-V2/.env

   # Backend
   cp meme-generator-backend/.env.example meme-generator-backend/.env
   ```

2. Éditer les fichiers `.env` et renseigner les clés.

3. **Alternative** : dans l'application mobile, Settings → saisir la clé Gemini directement (option la plus simple).

---

## Installation et lancement

### Frontend (React Native)

```bash
cd meme-multimodal-V2
npm install

# Android
npx react-native run-android

# iOS
cd ios && pod install && cd ..
npx react-native run-ios
```

### Build APK standalone

```bash
cd meme-multimodal-V2/android
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
./gradlew assembleRelease
# APK → android/app/build/outputs/apk/release/app-release.apk
```

### Backend (Node.js)

```bash
cd meme-generator-backend
npm install
npm run dev    # Développement (redémarrage automatique)
npm start      # Production
```

Le serveur démarre sur `http://localhost:3000`.

### Endpoints de l'API

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/health` | Vérification |
| `POST` | `/api/analyze-text` | Texte → meme |
| `POST` | `/api/transcribe-audio` | Audio → transcription + meme |
| `POST` | `/api/remix-image` | Image → analyse + texte meme |

---

## Stack technique

| Couche | Technologie |
|--------|------------|
| **Frontend mobile** | React Native CLI (TypeScript) |
| **State management** | Zustand |
| **API IA principale** | Google Gemini (`gemini-2.5-flash`, `gemini-2.0-flash`) |
| **API IA fallback** | Grok (xAI) |
| **GIFs** | Giphy API |
| **Vidéos** | Pexels API |
| **Génération d'images** | ImageGPT → Picsart → Puter → Pollinations |
| **Suppression fond** | EdenAI → Puter |
| **Backend** | Node.js + Express.js |
| **Version Android native** | Kotlin + Jetpack Compose |

---

## Équipe — ICT202 (G1) : Groupe 9.x

| Noms/Prenoms | Matricule |
|--------|---------------|
| 1 : **KENGNE TSHIENEGHOM THERESE VIANNEY** |24H2096|
| 2 : **BENZO NGOUH EMMANUELLE** | 24F2625 |
| 3 : **TCHINDA FOGANG PIERRE LEGRAND** | 24H2001 |
| 4 : **KITIO EMMANUEL** | 24H2181|
| 5 : **OMGBA BIDJA ULRICH JORDAN** | 24H2246 |
| 6 : **MANI MBASSI ALEXANDRE JOEL** | 24G2712 |
| 7 : **YANGO MBECHIN ARIANE** | 23U2249 |
| 8 : **SINENG KENGNI JUVENAL** | 24H2194 |

--- 
| Binôme | Responsabilité |
|--------|---------------|
| **Binôme 1** | Backend Node.js + orchestration API IA |
| **Binôme 2** | Feature Context Reader (frontend + intégration) |
| **Binôme 3** | Feature Voice-to-Meme (frontend + intégration) |
| **Binôme 4** | Feature Status Remixer + UI globale + livrables |
