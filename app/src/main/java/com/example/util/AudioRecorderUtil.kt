package com.example.util

import android.content.Context
import android.media.MediaRecorder
import android.os.Build
import java.io.File

/**
 * Utilitaire pour enregistrer l'audio via le microphone Android.
 * Sauvegarde l'audio en format AMR (compatible upload Gemini).
 */
class AudioRecorderUtil(private val context: Context) {

    private var recorder: MediaRecorder? = null
    private var outputFile: File? = null

    /**
     * Démarre l'enregistrement. Retourne le chemin du fichier de sortie.
     */
    fun startRecording(): String {
        val file = File(context.cacheDir, "voice_meme_${System.currentTimeMillis()}.amr")
        outputFile = file

        recorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            MediaRecorder(context)
        } else {
            @Suppress("DEPRECATION")
            MediaRecorder()
        }.apply {
            setAudioSource(MediaRecorder.AudioSource.MIC)
            setOutputFormat(MediaRecorder.OutputFormat.AMR_NB)
            setAudioEncoder(MediaRecorder.AudioEncoder.AMR_NB)
            setOutputFile(file.absolutePath)
            prepare()
            start()
        }

        return file.absolutePath
    }

    /**
     * Arrête l'enregistrement et libère les ressources.
     * Retourne le fichier audio enregistré, ou null en cas d'erreur.
     */
    fun stopRecording(): File? {
        return try {
            recorder?.apply {
                stop()
                release()
            }
            recorder = null
            outputFile
        } catch (e: Exception) {
            recorder?.release()
            recorder = null
            null
        }
    }

    /**
     * Annule l'enregistrement et supprime le fichier temporaire.
     */
    fun cancelRecording() {
        recorder?.apply {
            try { stop() } catch (_: Exception) {}
            release()
        }
        recorder = null
        outputFile?.delete()
        outputFile = null
    }

    /**
     * Indique si un enregistrement est en cours.
     */
    val isRecording: Boolean
        get() = recorder != null
}
