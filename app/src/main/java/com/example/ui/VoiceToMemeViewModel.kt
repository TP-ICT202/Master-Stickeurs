package com.example.ui

import android.app.Application
import android.content.Context
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.BuildConfig
import com.example.data.api.transcribeAudioAndGenerateMeme
import com.example.util.AudioRecorderUtil
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.io.File

// ── États de la feature ─────────────────────────────────────────────────────

sealed class VoiceToMemeState {
    /** Écran initial, rien n'a encore été fait */
    object Idle : VoiceToMemeState()

    /** Enregistrement en cours */
    object Recording : VoiceToMemeState()

    /** Envoi vers Gemini en cours */
    object Processing : VoiceToMemeState()

    /** Résultat disponible */
    data class Success(
        val transcription: String,
        val memeText: String,
        val audioFile: File
    ) : VoiceToMemeState()

    /** Erreur survenue */
    data class Error(val message: String) : VoiceToMemeState()
}

// ── ViewModel ────────────────────────────────────────────────────────────────

class VoiceToMemeViewModel(application: Application) : AndroidViewModel(application) {

    private val context: Context get() = getApplication<Application>().applicationContext

    private val audioRecorder = AudioRecorderUtil(context)

    private val _state = MutableStateFlow<VoiceToMemeState>(VoiceToMemeState.Idle)
    val state: StateFlow<VoiceToMemeState> = _state.asStateFlow()

    // Chemin du fichier audio en cours d'enregistrement
    private var currentAudioFile: File? = null

    // ── Actions publiques ────────────────────────────────────────────────────

    /** Lance l'enregistrement micro */
    fun startRecording() {
        if (_state.value is VoiceToMemeState.Recording) return
        try {
            val path = audioRecorder.startRecording()
            currentAudioFile = File(path)
            _state.value = VoiceToMemeState.Recording
        } catch (e: Exception) {
            _state.value = VoiceToMemeState.Error(
                "Impossible de démarrer l'enregistrement : ${e.message}"
            )
        }
    }

    /** Arrête l'enregistrement et envoie l'audio à Gemini */
    fun stopRecordingAndProcess() {
        val audioFile = audioRecorder.stopRecording() ?: run {
            _state.value = VoiceToMemeState.Error("Enregistrement introuvable.")
            return
        }
        currentAudioFile = audioFile
        _state.value = VoiceToMemeState.Processing

        viewModelScope.launch {
            try {
                val (transcription, memeText) = transcribeAudioAndGenerateMeme(
                    audioFile = audioFile,
                    apiKey = BuildConfig.GEMINI_API_KEY
                )
                _state.value = VoiceToMemeState.Success(
                    transcription = transcription,
                    memeText = memeText,
                    audioFile = audioFile
                )
            } catch (e: Exception) {
                _state.value = VoiceToMemeState.Error(
                    e.message ?: "Erreur lors de l'analyse par l'IA."
                )
            }
        }
    }

    /** Annule l'enregistrement en cours */
    fun cancelRecording() {
        audioRecorder.cancelRecording()
        currentAudioFile = null
        _state.value = VoiceToMemeState.Idle
    }

    /** Remet à zéro pour générer un nouveau meme */
    fun reset() {
        currentAudioFile?.delete()
        currentAudioFile = null
        _state.value = VoiceToMemeState.Idle
    }

    override fun onCleared() {
        super.onCleared()
        if (audioRecorder.isRecording) audioRecorder.cancelRecording()
    }
}
