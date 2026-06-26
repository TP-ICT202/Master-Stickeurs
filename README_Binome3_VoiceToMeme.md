# 🎙️ Binôme 3 — Feature Voice-to-Meme

## Vue d'ensemble

La feature **Voice-to-Meme** permet à l'utilisateur d'enregistrer une note vocale,
de la transcrire automatiquement via **Google Gemini AI**, puis de générer un texte
de meme humoristique à partir du contenu parlé.

---

## Fichiers produits

| Fichier | Emplacement dans le projet | Rôle |
|---|---|---|
| `AudioRecorderUtil.kt` | `app/.../util/` | Enregistrement micro (MediaRecorder) |
| `GeminiClient_VoiceToMeme.kt` | `app/.../data/api/` | Appel Gemini multimodal (audio → JSON) |
| `VoiceToMemeViewModel.kt` | `app/.../ui/` | Logique MVVM + gestion des états |
| `VoiceToMemeScreen.kt` | `app/.../ui/screens/` | Interface Compose complète |
| `transcribeAudio.js` | `src/routes/` | Route Express POST /api/transcribe-audio |
| `transcribeAudioController.js` | `src/controllers/` | Logique Gemini côté backend |
| `AndroidManifest_permissions.xml` | snippet à intégrer | Permissions micro Android |

---

## Architecture du flux

```
[Utilisateur parle]
        │
        ▼
AudioRecorderUtil.startRecording()
  └─ MediaRecorder → fichier .amr dans cache
        │
        ▼
AudioRecorderUtil.stopRecording()
        │
        ▼
VoiceToMemeViewModel.stopRecordingAndProcess()
  └─ State → Processing
        │
        ▼
GeminiClient.transcribeAudioAndGenerateMeme(audioFile)
  └─ Encode audio en base64
  └─ POST Gemini API (audio + prompt)
  └─ Parse JSON { transcription, meme_text }
        │
        ▼
VoiceToMemeState.Success(transcription, memeText)
        │
        ▼
VoiceToMemeScreen affiche le résultat
```

---

## Intégration Android

### 1. Ajouter les permissions (AndroidManifest.xml)

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"
    android:maxSdkVersion="32" />
<uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />
```

### 2. Ajouter la dépendance permissions Accompanist (build.gradle)

```kotlin
implementation("com.google.accompanist:accompanist-permissions:0.34.0")
```

### 3. Copier les fichiers Kotlin dans leur dossier respectif

- `AudioRecorderUtil.kt` → `app/src/main/java/com/example/util/`
- `VoiceToMemeViewModel.kt` → `app/src/main/java/com/example/ui/`
- `VoiceToMemeScreen.kt` → `app/src/main/java/com/example/ui/screens/`

### 4. Ajouter les fonctions de `GeminiClient_VoiceToMeme.kt`

Copier les deux fonctions (`transcribeAudioAndGenerateMeme`) dans le fichier
`GeminiClient.kt` existant de l'équipe.

### 5. Intégrer l'écran dans la navigation existante

```kotlin
// Dans MemeAppUi.kt, ajouter l'onglet ou la route :
composable("voice_to_meme") {
    VoiceToMemeScreen(
        onMemeReady = { memeText ->
            // Naviguer vers l'éditeur de meme avec le texte généré
        }
    )
}
```

---

## Intégration Backend

### 1. Copier les fichiers

- `transcribeAudio.js` → `src/routes/`
- `transcribeAudioController.js` → `src/controllers/`

### 2. Enregistrer la route dans `src/index.js`

```javascript
const transcribeAudioRouter = require('./routes/transcribeAudio');
app.use('/api/transcribe-audio', transcribeAudioRouter);
```

### 3. Installer le SDK Gemini si pas encore fait

```bash
npm install @google/generative-ai
```

---

## Test manuel de l'endpoint backend

```bash
# Test avec un fichier audio
curl -X POST http://localhost:3000/api/transcribe-audio \
  -F "audio=@/chemin/vers/test.amr"

# Réponse attendue :
# {
#   "transcription": "Ma chérie dit qu'elle est en route mais on entend la douche",
#   "meme_text": "MA CHÉRIE : J'ARRIVE DANS 5 MIN\nLA DOUCHE EN FOND : 💀"
# }
```

---

## États de l'UI

| État | Description | Affichage |
|---|---|---|
| `Idle` | Aucun enregistrement | Bouton micro + invitation |
| `Recording` | Micro actif | Bouton pulsant rouge + "Arrêter" |
| `Processing` | Envoi à Gemini | Spinner + message |
| `Success` | Résultat prêt | Transcription + texte meme + boutons |
| `Error` | Échec API ou micro | Message d'erreur + "Réessayer" |

---

## Dépendances Gradle nécessaires

```kotlin
// Déjà présentes normalement dans le projet :
implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")
implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
implementation("androidx.compose.material3:material3:1.2.1")

// À ajouter pour les permissions runtime :
implementation("com.google.accompanist:accompanist-permissions:0.34.0")
```
