package com.example.data.api

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import android.util.Log
import com.example.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.io.File
import java.util.concurrent.TimeUnit

/**
 * Client unique pour toutes les interactions avec l'API Google Gemini.
 *
 * 100% GRATUIT — Aucune dépendance OpenAI.
 *
 * Modèles utilisés :
 *   gemini-2.0-flash             → texte, vision, audio  (1 500 req/jour gratuit)
 *   gemini-2.5-flash-preview-05-20 → génération d'image  (quota limité gratuit)
 *
 * Clé API : https://aistudio.google.com/app/apikey
 */
object GeminiClient {

    private const val TAG = "GeminiClient"
    private const val BASE_URL = "https://generativelanguage.googleapis.com"

    private const val MODEL_TEXT      = "gemini-2.0-flash"
    private const val MODEL_IMAGE_GEN = "gemini-2.5-flash-preview-05-20"

    private val client = OkHttpClient.Builder()
        .connectTimeout(60, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .build()

    private fun getApiKey(): String = BuildConfig.GEMINI_API_KEY

    private fun isKeyMissing(key: String) = key.isEmpty() || key == "MY_GEMINI_API_KEY"

    // ─────────────────────────────────────────────────────────
    // HELPERS PRIVÉS
    // ─────────────────────────────────────────────────────────

    /** Corps JSON Gemini pour une requête texte simple. */
    private fun buildTextBody(prompt: String): JSONObject = JSONObject().apply {
        put("contents", JSONArray().apply {
            put(JSONObject().apply {
                put("parts", JSONArray().apply {
                    put(JSONObject().apply { put("text", prompt) })
                })
            })
        })
        put("generationConfig", JSONObject().apply {
            put("responseMimeType", "application/json")
        })
    }

    /**
     * Exécute un POST vers Gemini et retourne le texte brut de la réponse.
     * Retourne null en cas d'erreur HTTP ou de réponse vide.
     */
    private fun callGemini(model: String, body: JSONObject, apiKey: String): String? {
        return try {
            val requestBody = body.toString().toRequestBody("application/json".toMediaType())
            val request = Request.Builder()
                .url("$BASE_URL/v1beta/models/$model:generateContent?key=$apiKey")
                .post(requestBody)
                .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    Log.e(TAG, "HTTP ${response.code} — modèle: $model")
                    return null
                }
                JSONObject(response.body?.string() ?: return null)
                    .getJSONArray("candidates")
                    .getJSONObject(0)
                    .getJSONObject("content")
                    .getJSONArray("parts")
                    .getJSONObject(0)
                    .getString("text")
                    .trim()
            }
        } catch (e: Exception) {
            Log.e(TAG, "callGemini exception (model=$model)", e)
            null
        }
    }

    // ─────────────────────────────────────────────────────────
    // 1. CONTEXT READER — Texte → Meme
    // ─────────────────────────────────────────────────────────
    suspend fun generateMemeTextSuggestions(situation: String): Pair<String, String> =
        withContext(Dispatchers.IO) {
            val apiKey = getApiKey()
            if (isKeyMissing(apiKey)) {
                return@withContext "QUAND TU TRAVAILLES SANS CLÉ API" to
                    "VA SUR aistudio.google.com ET CRÉE UNE CLÉ GRATUITE !"
            }

            val prompt = """
                Tu es un générateur de memes plein d'humour d'Afrique francophone
                (Cameroun, Côte d'Ivoire, Sénégal). Tu maîtrises l'argot local et les punchlines.
                Analyse cette situation :
                "$situation"
                
                Génère un meme ultra drôle. Retourne UNIQUEMENT ce JSON brut (pas de Markdown) :
                {"top": "TEXTE DU HAUT EN MAJUSCULES", "bottom": "TEXTE DU BAS EN MAJUSCULES"}
            """.trimIndent()

            try {
                val text = callGemini(MODEL_TEXT, buildTextBody(prompt), apiKey)
                    ?: return@withContext "QUAND L'IA NE RÉPOND PAS" to "DÉSASTRE COSMIQUE"
                val obj = JSONObject(text)
                obj.optString("top", "QUAND L'IA HÉSITE") to
                obj.optString("bottom", "C'EST COMPLIQUÉ COMME SITUATION")
            } catch (e: Exception) {
                Log.e(TAG, "generateMemeTextSuggestions", e)
                "QUAND LE CODE BUG À LA LIGNE 42" to "L'EXCEPTION : ${e.localizedMessage}"
            }
        }

    // ─────────────────────────────────────────────────────────
    // 2. VOICE-TO-MEME — Audio → Transcription + Meme
    //    Gemini 2.0 Flash accepte l'audio en base64 nativement.
    //    Pas besoin de Whisper ni d'OpenAI.
    // ─────────────────────────────────────────────────────────
    suspend fun transcribeAndGenerateMeme(audioFilePath: String): AudioMemeResult =
        withContext(Dispatchers.IO) {
            val apiKey = getApiKey()
            if (isKeyMissing(apiKey)) {
                return@withContext AudioMemeResult(
                    transcription = "Clé API manquante",
                    topText       = "AUDIO REÇU SANS CLÉ API",
                    bottomText    = "VA SUR aistudio.google.com !",
                    emotion       = "confused"
                )
            }

            val file = File(audioFilePath)
            if (!file.exists() || file.length() == 0L) {
                return@withContext AudioMemeResult(
                    transcription = "",
                    topText       = "FICHIER AUDIO INTROUVABLE",
                    bottomText    = "L'ENREGISTREMENT N'A PAS FONCTIONNÉ",
                    emotion       = "sad"
                )
            }

            // Encoder le fichier audio en base64
            val audioBytes  = file.readBytes()
            val base64Audio = Base64.encodeToString(audioBytes, Base64.NO_WRAP)

            // Déterminer le mimeType
            val mimeType = when {
                audioFilePath.endsWith(".3gp")  -> "audio/3gpp"
                audioFilePath.endsWith(".m4a")  -> "audio/mp4"
                audioFilePath.endsWith(".mp3")  -> "audio/mpeg"
                audioFilePath.endsWith(".wav")  -> "audio/wav"
                audioFilePath.endsWith(".webm") -> "audio/webm"
                audioFilePath.endsWith(".ogg")  -> "audio/ogg"
                else -> "audio/3gpp"
            }

            val prompt = """
                Écoute cet enregistrement audio et :
                1. Transcris exactement ce qui est dit (en français).
                2. Identifie l'émotion principale (happy, surprised, angry, sad, confused, excited).
                3. Génère un texte de meme ultra drôle basé sur ce qui a été dit,
                   avec l'argot d'Afrique francophone si possible.
                
                Retourne UNIQUEMENT ce JSON brut (pas de Markdown, pas d'explications) :
                {
                  "transcription": "texte exact de l'audio",
                  "emotion": "surprised",
                  "top": "TEXTE DU HAUT EN MAJUSCULES",
                  "bottom": "TEXTE DU BAS EN MAJUSCULES"
                }
            """.trimIndent()

            // Corps multimodal : texte + audio inline
            val jsonBody = JSONObject().apply {
                put("contents", JSONArray().apply {
                    put(JSONObject().apply {
                        put("parts", JSONArray().apply {
                            put(JSONObject().apply { put("text", prompt) })
                            put(JSONObject().apply {
                                put("inlineData", JSONObject().apply {
                                    put("mimeType", mimeType)
                                    put("data", base64Audio)
                                })
                            })
                        })
                    })
                })
                put("generationConfig", JSONObject().apply {
                    put("responseMimeType", "application/json")
                })
            }

            try {
                val text = callGemini(MODEL_TEXT, jsonBody, apiKey)
                    ?: return@withContext AudioMemeResult(
                        transcription = "",
                        topText       = "GEMINI N'A PAS RÉPONDU",
                        bottomText    = "VÉRIFIE TA CONNEXION ET TA CLÉ API",
                        emotion       = "confused"
                    )

                val obj = JSONObject(text)
                AudioMemeResult(
                    transcription = obj.optString("transcription", ""),
                    topText       = obj.optString("top", "AUDIO REÇU ET ANALYSÉ"),
                    bottomText    = obj.optString("bottom", "MAIS L'IA N'A RIEN COMPRIS"),
                    emotion       = obj.optString("emotion", "confused")
                )
            } catch (e: Exception) {
                Log.e(TAG, "transcribeAndGenerateMeme", e)
                AudioMemeResult(
                    transcription = "",
                    topText       = "QUAND TU ENREGISTRES TA VOIX",
                    bottomText    = "ET QUE L'IA SURSAUTE EN T'ENTENDANT",
                    emotion       = "surprised"
                )
            }
        }

    /**
     * Fallback : si le fichier audio n'est pas disponible,
     * génère un meme à partir de la transcription textuelle seulement.
     */
    suspend fun generateVoiceToMemeText(audioTranscript: String): Pair<String, String> =
        withContext(Dispatchers.IO) {
            val apiKey = getApiKey()
            if (isKeyMissing(apiKey)) {
                return@withContext "AUDIO SANS CLÉ API" to "LE SILENCE EST ASSOURDISSANT"
            }

            val prompt = """
                Message vocal transcrit : "$audioTranscript"
                
                Génère un meme humoristique d'Afrique francophone.
                Retourne UNIQUEMENT ce JSON brut :
                {"top": "TEXTE DU HAUT EN MAJUSCULES", "bottom": "TEXTE DU BAS EN MAJUSCULES"}
            """.trimIndent()

            try {
                val text = callGemini(MODEL_TEXT, buildTextBody(prompt), apiKey)
                    ?: return@withContext "QUAND LA NOTE VOCALE BUG" to "PROBLÈME RÉSEAU"
                val obj = JSONObject(text)
                obj.optString("top") to obj.optString("bottom")
            } catch (e: Exception) {
                Log.e(TAG, "generateVoiceToMemeText", e)
                "QUAND TU T'ENREGISTRES" to "ET QUE TU SURSAUTES EN T'ENTENDANT"
            }
        }

    // ─────────────────────────────────────────────────────────
    // 3. STATUS REMIXER — Image → Meme (Vision multimodale)
    // ─────────────────────────────────────────────────────────
    suspend fun analyzeImageForMeme(bitmap: Bitmap): Pair<String, String> =
        withContext(Dispatchers.IO) {
            val apiKey = getApiKey()
            if (isKeyMissing(apiKey)) {
                return@withContext "PHOTO SANS CLÉ API" to "CONFIGURATION VIDE"
            }

            val out = ByteArrayOutputStream()
            bitmap.compress(Bitmap.CompressFormat.JPEG, 70, out)
            val base64Image = Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP)

            val prompt = """
                Analyse cette image avec humour.
                Génère un texte de meme drôle en français argotique d'Afrique francophone.
                Retourne UNIQUEMENT ce JSON brut :
                {"top": "TEXTE DU HAUT EN MAJUSCULES", "bottom": "TEXTE DU BAS EN MAJUSCULES"}
            """.trimIndent()

            val jsonBody = JSONObject().apply {
                put("contents", JSONArray().apply {
                    put(JSONObject().apply {
                        put("parts", JSONArray().apply {
                            put(JSONObject().apply { put("text", prompt) })
                            put(JSONObject().apply {
                                put("inlineData", JSONObject().apply {
                                    put("mimeType", "image/jpeg")
                                    put("data", base64Image)
                                })
                            })
                        })
                    })
                })
                put("generationConfig", JSONObject().apply {
                    put("responseMimeType", "application/json")
                })
            }

            try {
                val text = callGemini(MODEL_TEXT, jsonBody, apiKey)
                    ?: return@withContext "QUAND LE MULTIMODAL CAPOTE" to "PAS DE PIXELS"
                val obj = JSONObject(text)
                obj.optString("top") to obj.optString("bottom")
            } catch (e: Exception) {
                Log.e(TAG, "analyzeImageForMeme", e)
                "L'IA QUI VOIT MA PHOTO" to "ET QUI SECOUE LA TÊTE"
            }
        }

    // ─────────────────────────────────────────────────────────
    // 4. GÉNÉRATION IMAGE — Prompt → Bitmap (Bonus)
    // ─────────────────────────────────────────────────────────
    suspend fun generateImageFromPrompt(prompt: String): Bitmap? =
        withContext(Dispatchers.IO) {
            val apiKey = getApiKey()
            if (isKeyMissing(apiKey)) return@withContext null

            val formatted = "Meme template image, funny, no text overlay, concept: $prompt. " +
                "3D cartoon style or funny vector illustration."

            val jsonBody = JSONObject().apply {
                put("contents", JSONArray().apply {
                    put(JSONObject().apply {
                        put("parts", JSONArray().apply {
                            put(JSONObject().apply { put("text", formatted) })
                        })
                    })
                })
                put("generationConfig", JSONObject().apply {
                    put("responseModalities", JSONArray().apply {
                        put("TEXT"); put("IMAGE")
                    })
                })
            }

            try {
                val requestBody = jsonBody.toString().toRequestBody("application/json".toMediaType())
                val request = Request.Builder()
                    .url("$BASE_URL/v1beta/models/$MODEL_IMAGE_GEN:generateContent?key=$apiKey")
                    .post(requestBody)
                    .build()

                client.newCall(request).execute().use { response ->
                    if (!response.isSuccessful) {
                        Log.e(TAG, "Imagen HTTP ${response.code}")
                        return@withContext null
                    }
                    val root  = JSONObject(response.body?.string() ?: return@withContext null)
                    val parts = root.getJSONArray("candidates")
                        .getJSONObject(0).getJSONObject("content").getJSONArray("parts")

                    for (i in 0 until parts.length()) {
                        val part = parts.getJSONObject(i)
                        if (part.has("inlineData")) {
                            val bytes = Base64.decode(
                                part.getJSONObject("inlineData").getString("data"),
                                Base64.DEFAULT
                            )
                            return@withContext BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                        }
                    }
                    null
                }
            } catch (e: Exception) {
                Log.e(TAG, "generateImageFromPrompt", e)
                null
            }
        }

    // ─────────────────────────────────────────────────────────
    // 5. STICKER — Contexte → Emoji + Texte court
    // ─────────────────────────────────────────────────────────
    suspend fun generateStickerSuggestion(contextText: String): Pair<String, String> =
        withContext(Dispatchers.IO) {
            val apiKey = getApiKey()
            if (isKeyMissing(apiKey)) return@withContext "🔥" to "C'EST TRÈS CHAUD !"

            val prompt = """
                Situation : "$contextText"
                Suggère un emoji expressif et une phrase max 4 mots en argot africain francophone.
                JSON brut : {"emoji": "🔥", "text": "C'EST GÂTÉ !"}
            """.trimIndent()

            try {
                val text = callGemini(MODEL_TEXT, buildTextBody(prompt), apiKey)
                    ?: return@withContext "😂" to "SAUVE QUI PEUT !"
                val obj = JSONObject(text)
                obj.optString("emoji", "😂") to obj.optString("text", "ON EST ENSEMBLE !")
            } catch (e: Exception) {
                Log.e(TAG, "generateStickerSuggestion", e)
                "💀" to "FIN DU GAMING !"
            }
        }

    // ─────────────────────────────────────────────────────────
    // 6. GIF SEARCH — Contexte → Requête de recherche
    // ─────────────────────────────────────────────────────────
    suspend fun generateGifSearchQuery(contextText: String): String =
        withContext(Dispatchers.IO) {
            val apiKey = getApiKey()
            if (isKeyMissing(apiKey)) return@withContext "funny cat screaming"

            val prompt = """
                Contexte : "$contextText"
                Requête GIF en anglais, courte et drôle.
                JSON brut : {"query": "excited minion jumping"}
            """.trimIndent()

            try {
                val text = callGemini(MODEL_TEXT, buildTextBody(prompt), apiKey)
                    ?: return@withContext "funny face"
                JSONObject(text).optString("query", "funny face")
            } catch (e: Exception) {
                Log.e(TAG, "generateGifSearchQuery", e)
                "funny facepalm reaction"
            }
        }

    // ─────────────────────────────────────────────────────────
    // 7. VIDEO STORYBOARD — Contexte → Titre + Punchline
    // ─────────────────────────────────────────────────────────
    suspend fun generateVideoStoryboard(contextText: String): Pair<String, String> =
        withContext(Dispatchers.IO) {
            val apiKey = getApiKey()
            if (isKeyMissing(apiKey)) return@withContext "PROJET EN FEU" to "C'EST GÂTÉ !"

            val prompt = """
                Contexte : "$contextText"
                Titre 2-3 mots + punchline rythmée pour une vidéo TikTok/Reels.
                JSON brut : {"title": "ALERTE CODEUR", "punchline": "QUAND LE CLIENT VEUT DU 3D DEMAIN"}
            """.trimIndent()

            try {
                val text = callGemini(MODEL_TEXT, buildTextBody(prompt), apiKey)
                    ?: return@withContext "STORY" to "C'EST CHAUD !"
                val obj = JSONObject(text)
                obj.optString("title", "ALERTE") to obj.optString("punchline", "DÉSASTRE")
            } catch (e: Exception) {
                Log.e(TAG, "generateVideoStoryboard", e)
                "BUG REPORT" to "L'EXCEPTION A ENCORE FRAPPÉ !"
            }
        }
}

// ─────────────────────────────────────────────────────────────
// Modèle de données pour le résultat audio
// ─────────────────────────────────────────────────────────────
data class AudioMemeResult(
    val transcription : String,
    val topText       : String,
    val bottomText    : String,
    val emotion       : String
)
