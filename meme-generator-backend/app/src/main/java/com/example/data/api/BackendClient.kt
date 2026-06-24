package com.example.data.api

import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.File
import java.util.concurrent.TimeUnit

/**
 * Client HTTP pour le backend Node.js / Express.
 *
 * Utilisé principalement pour la transcription audio via Whisper,
 * qui n'est pas disponible directement dans Gemini.
 *
 * URL du serveur : configurer BASE_URL selon l'environnement :
 *   - Émulateur Android Studio  → "http://10.0.2.2:3000"
 *   - Device physique (USB)     → "http://<IP_PC>:3000"
 *   - ngrok (recommandé équipe) → "https://xxxx.ngrok.io"
 */
object BackendClient {

    private const val TAG = "BackendClient"

    // ⚙️  Changer cette URL selon votre environnement
    // Émulateur : "http://10.0.2.2:3000"
    // Device USB : "http://192.168.1.XX:3000"  (remplacer XX par l'IP de votre PC)
    // ngrok      : "https://xxxxxxxx.ngrok.io"
    var BASE_URL = "http://10.0.2.2:3000"

    private val client = OkHttpClient.Builder()
        .connectTimeout(60, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .build()

    // -------------------------------------------------------
    // VOICE-TO-MEME : Envoi du fichier audio → transcription
    // -------------------------------------------------------
    /**
     * Envoie le fichier audio enregistré au backend Express.
     * Le backend utilise Whisper (OpenAI) pour transcrire,
     * puis Gemini/GPT pour générer le texte du meme.
     *
     * @param audioFilePath chemin absolu du fichier .3gp / .m4a
     * @return TranscriptionResult avec la transcription et le texte du meme
     */
    suspend fun transcribeAudio(audioFilePath: String): TranscriptionResult =
        withContext(Dispatchers.IO) {
            val file = File(audioFilePath)

            if (!file.exists()) {
                Log.e(TAG, "Fichier audio introuvable : $audioFilePath")
                return@withContext TranscriptionResult.Error("Fichier audio introuvable")
            }

            try {
                // Déterminer le type MIME selon l'extension
                val mimeType = when {
                    audioFilePath.endsWith(".3gp")  -> "audio/3gpp"
                    audioFilePath.endsWith(".m4a")  -> "audio/mp4"
                    audioFilePath.endsWith(".mp3")  -> "audio/mpeg"
                    audioFilePath.endsWith(".wav")  -> "audio/wav"
                    audioFilePath.endsWith(".webm") -> "audio/webm"
                    else -> "audio/3gpp"
                }

                val requestBody = MultipartBody.Builder()
                    .setType(MultipartBody.FORM)
                    .addFormDataPart(
                        name  = "audio",
                        filename = file.name,
                        body  = file.asRequestBody(mimeType.toMediaType())
                    )
                    .build()

                val request = Request.Builder()
                    .url("$BASE_URL/api/transcribe-audio")
                    .post(requestBody)
                    .build()

                client.newCall(request).execute().use { response ->
                    if (!response.isSuccessful) {
                        Log.e(TAG, "HTTP ${response.code} sur /api/transcribe-audio")
                        return@withContext TranscriptionResult.Error("Erreur HTTP ${response.code}")
                    }

                    val body = response.body?.string()
                        ?: return@withContext TranscriptionResult.Error("Réponse vide")

                    val json = JSONObject(body)
                    TranscriptionResult.Success(
                        transcription = json.optString("transcription", ""),
                        topText       = json.optString("topText", ""),
                        bottomText    = json.optString("bottomText", ""),
                        emotion       = json.optString("emotion", ""),
                        isMock        = json.optBoolean("mock", false)
                    )
                }
            } catch (e: Exception) {
                Log.e(TAG, "transcribeAudio exception", e)
                // Fallback : retourner une erreur propre sans crasher
                TranscriptionResult.Error(e.localizedMessage ?: "Erreur réseau inconnue")
            }
        }

    // -------------------------------------------------------
    // CONTEXT READER — Envoi de texte (optionnel via backend)
    // -------------------------------------------------------
    /**
     * Alternative au client Gemini direct.
     * Utile si vous voulez centraliser la logique côté serveur.
     */
    suspend fun analyzeText(text: String): TextMemeResult =
        withContext(Dispatchers.IO) {
            try {
                val json = JSONObject().apply { put("text", text) }
                val requestBody = json.toString()
                    .toRequestBody("application/json".toMediaType())

                val request = Request.Builder()
                    .url("$BASE_URL/api/analyze-text")
                    .post(requestBody)
                    .build()

                client.newCall(request).execute().use { response ->
                    if (!response.isSuccessful) {
                        return@withContext TextMemeResult.Error("HTTP ${response.code}")
                    }
                    val body = JSONObject(response.body?.string() ?: "{}")
                    TextMemeResult.Success(
                        topText    = body.optString("topText", ""),
                        bottomText = body.optString("bottomText", ""),
                        tone       = body.optString("tone", ""),
                        isMock     = body.optBoolean("mock", false)
                    )
                }
            } catch (e: Exception) {
                Log.e(TAG, "analyzeText exception", e)
                TextMemeResult.Error(e.localizedMessage ?: "Erreur réseau")
            }
        }

    // -------------------------------------------------------
    // Vérification de la disponibilité du backend
    // -------------------------------------------------------
    suspend fun isBackendAvailable(): Boolean = withContext(Dispatchers.IO) {
        try {
            val request = Request.Builder()
                .url("$BASE_URL/health")
                .get()
                .build()
            client.newCall(request).execute().use { it.isSuccessful }
        } catch (e: Exception) {
            false
        }
    }
}

// -------------------------------------------------------
// Modèles de résultat (sealed classes)
// -------------------------------------------------------

sealed class TranscriptionResult {
    data class Success(
        val transcription : String,
        val topText       : String,
        val bottomText    : String,
        val emotion       : String,
        val isMock        : Boolean
    ) : TranscriptionResult()

    data class Error(val message: String) : TranscriptionResult()
}

sealed class TextMemeResult {
    data class Success(
        val topText    : String,
        val bottomText : String,
        val tone       : String,
        val isMock     : Boolean
    ) : TextMemeResult()

    data class Error(val message: String) : TextMemeResult()
}
