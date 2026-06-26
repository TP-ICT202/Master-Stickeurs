package com.example.data.api

// ============================================================
// EXTRAIT À AJOUTER DANS VOTRE GeminiClient.kt EXISTANT
// Ajoutez ces deux fonctions dans votre objet/classe GeminiClient
// ============================================================

import android.util.Base64
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

// Modèle Gemini utilisé (selon le README du projet)
private const val GEMINI_MODEL = "gemini-2.0-flash"
private const val GEMINI_BASE_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/$GEMINI_MODEL:generateContent"

/**
 * Transcrit un fichier audio AMR en texte via Gemini,
 * puis génère un texte de meme humoristique à partir de la transcription.
 *
 * @param audioFile  Fichier .amr enregistré par AudioRecorderUtil
 * @param apiKey     BuildConfig.GEMINI_API_KEY
 * @return           Pair<transcription, texteMemé> ou lance une exception
 */
suspend fun transcribeAudioAndGenerateMeme(
    audioFile: File,
    apiKey: String
): Pair<String, String> = withContext(Dispatchers.IO) {

    // 1. Encoder l'audio en base64
    val audioBytes = audioFile.readBytes()
    val base64Audio = Base64.encodeToString(audioBytes, Base64.NO_WRAP)

    // 2. Construire le payload multimodal Gemini
    val requestBody = JSONObject().apply {
        put("contents", JSONArray().apply {
            put(JSONObject().apply {
                put("parts", JSONArray().apply {
                    // Partie audio inline
                    put(JSONObject().apply {
                        put("inline_data", JSONObject().apply {
                            put("mime_type", "audio/amr")
                            put("data", base64Audio)
                        })
                    })
                    // Instruction texte
                    put(JSONObject().apply {
                        put("text", """
                            Tu es un assistant expert en humour et memes africains / camerounais.
                            
                            ÉTAPE 1 — Transcris fidèlement ce qui est dit dans l'audio en français.
                            ÉTAPE 2 — À partir de cette transcription, génère UN texte de meme court,
                            percutant et hilarant (max 2 lignes, style meme internet).
                            
                            Réponds UNIQUEMENT en JSON valide, sans backticks, format :
                            {
                              "transcription": "...",
                              "meme_text": "HAUT DU MEME\nBAS DU MEME"
                            }
                        """.trimIndent())
                    })
                })
            })
        })
    }

    // 3. Appel HTTP à l'API Gemini
    val url = URL("$GEMINI_BASE_URL?key=$apiKey")
    val connection = (url.openConnection() as HttpURLConnection).apply {
        requestMethod = "POST"
        setRequestProperty("Content-Type", "application/json")
        doOutput = true
        connectTimeout = 30_000
        readTimeout = 60_000
    }

    connection.outputStream.use { it.write(requestBody.toString().toByteArray()) }

    val responseCode = connection.responseCode
    val responseText = if (responseCode == 200) {
        connection.inputStream.bufferedReader().readText()
    } else {
        val error = connection.errorStream?.bufferedReader()?.readText() ?: "Erreur inconnue"
        throw Exception("Gemini API erreur $responseCode : $error")
    }

    // 4. Parser la réponse Gemini
    val geminiJson = JSONObject(responseText)
    val rawText = geminiJson
        .getJSONArray("candidates")
        .getJSONObject(0)
        .getJSONObject("content")
        .getJSONArray("parts")
        .getJSONObject(0)
        .getString("text")
        .trim()

    // 5. Parser le JSON retourné par le modèle
    val resultJson = JSONObject(rawText)
    val transcription = resultJson.getString("transcription")
    val memeText = resultJson.getString("meme_text")

    Pair(transcription, memeText)
}
