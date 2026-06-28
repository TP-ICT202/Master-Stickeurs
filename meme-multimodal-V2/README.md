# MemeGen AI — React Native (TypeScript)

Frontend mobile de l'application **Master-Stickeurs**. Génération de memes, stickers, GIFs et vidéos courtes à partir de texte, audio et image.

## Services

| Service | Rôle | Fallback |
|---------|------|----------|
| `gemini.ts` | API Gemini (`callGemini`) + Grok xAI (`callGrokFallback`) | callWithFallback() |
| `grok.ts` | Client xAI (compatible OpenAI) | — |
| `giphy.ts` | Recherche GIFs via Giphy | FALLBACK_GIFS intégrés |
| `pexels.ts` | Recherche vidéos courtes | — |
| `eden.ts` | Suppression fond d'image | puterRemoveBg |
| `puter.ts` | Génération image / remove bg (gratuit) | — |
| `imagegpt.ts` | Génération image IA | — |

## Configuration des clés API

Créer un fichier `.env` à la racine :

```env
DEFAULT_GEMINI_API_KEY=AIzaSy...
GROK_API_KEY=xai-...
GIPHY_API_KEY=...
PEXELS_API_KEY=...
EDEN_API_KEY=...
PICSART_API_KEY=...
IMAGE_GPT_API_KEY=...
POLINATION_AI_API_KEY=...
```

**Ou** dans l'app : Menu → Settings → saisir la clé Gemini.

## Installation

```bash
npm install
npx react-native run-android
```

## Build APK

```bash
cd android
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
./gradlew assembleRelease
```
