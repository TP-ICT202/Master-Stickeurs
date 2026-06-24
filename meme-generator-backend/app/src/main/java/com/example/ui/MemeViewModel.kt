package com.example.ui

import android.app.Application
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.media.MediaRecorder
import android.os.Environment
import android.util.Log
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.api.AudioMemeResult
import com.example.data.api.GeminiClient
import com.example.data.database.MemeDatabase
import com.example.data.database.MemeEntity
import com.example.data.database.MemeRepository
import com.example.util.MemeGeneratorUtil
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.io.File
import java.io.FileOutputStream

class MemeViewModel(application: Application) : AndroidViewModel(application) {
    private val TAG = "MemeViewModel"
    private val repository: MemeRepository

    // Splash/Onboarding Screen state
    private val _showSplash = MutableStateFlow(true)
    val showSplash: StateFlow<Boolean> = _showSplash.asStateFlow()

    fun dismissSplash() {
        _showSplash.value = false
    }

    // ==========================================
    // MULTIMEDIA IA: STICKERS, GIFS & VIDEOS ANIMÉES
    // ==========================================
    // Sticker states
    private val _stickerEmoji = MutableStateFlow("😂")
    val stickerEmoji: StateFlow<String> = _stickerEmoji.asStateFlow()

    private val _stickerText = MutableStateFlow("PTDR C'EST CHAUD !")
    val stickerText: StateFlow<String> = _stickerText.asStateFlow()

    private val _isGeneratingSticker = MutableStateFlow(false)
    val isGeneratingSticker: StateFlow<Boolean> = _isGeneratingSticker.asStateFlow()

    // GIF states
    private val _gifQuery = MutableStateFlow("funny cat facepalm")
    val gifQuery: StateFlow<String> = _gifQuery.asStateFlow()

    private val _selectedGifMood = MutableStateFlow("LOL") // LOL, ACCÈS, PANIQUE, COLÈRE, DANSE
    val selectedGifMood: StateFlow<String> = _selectedGifMood.asStateFlow()

    private val _isSearchingGif = MutableStateFlow(false)
    val isSearchingGif: StateFlow<Boolean> = _isSearchingGif.asStateFlow()

    // Short Video states
    private val _videoTitle = MutableStateFlow("ALERTE MAXIMALE")
    val videoTitle: StateFlow<String> = _videoTitle.asStateFlow()

    private val _videoPunchline = MutableStateFlow("QUAND LE CODE S'EFFONDRE À LA DERNIÈRE SECONDE")
    val videoPunchline: StateFlow<String> = _videoPunchline.asStateFlow()

    private val _isGeneratingVideo = MutableStateFlow(false)
    val isGeneratingVideo: StateFlow<Boolean> = _isGeneratingVideo.asStateFlow()

    // Onglet courant: "TEXT", "AUDIO", "IMAGE", "GALLERY" (and "SETTINGS" now)
    private val _currentTab = MutableStateFlow("TEXT")
    val currentTab: StateFlow<String> = _currentTab.asStateFlow()

    // Global Settings state
    private val _currentLanguage = MutableStateFlow("FR")
    val currentLanguage: StateFlow<String> = _currentLanguage.asStateFlow()

    private val _currentEdition = MutableStateFlow("Standard")
    val currentEdition: StateFlow<String> = _currentEdition.asStateFlow()

    private val _currentTheme = MutableStateFlow("Dark Void")
    val currentTheme: StateFlow<String> = _currentTheme.asStateFlow()

    private val _isSafeSearchEnabled = MutableStateFlow(true)
    val isSafeSearchEnabled: StateFlow<Boolean> = _isSafeSearchEnabled.asStateFlow()

    private val _isSoundEnabled = MutableStateFlow(false)
    val isSoundEnabled: StateFlow<Boolean> = _isSoundEnabled.asStateFlow()

    fun setLanguage(lang: String) {
        _currentLanguage.value = lang
    }

    fun setEdition(edition: String) {
        _currentEdition.value = edition
    }

    fun setTheme(theme: String) {
        _currentTheme.value = theme
    }

    fun setSafeSearch(enabled: Boolean) {
        _isSafeSearchEnabled.value = enabled
    }

    fun setSoundEnabled(enabled: Boolean) {
        _isSoundEnabled.value = enabled
    }

    init {
        val database = MemeDatabase.getDatabase(application)
        repository = MemeRepository(database.memeDao())
    }

    // Liste des mèmes stockés réactivite
    val savedMemes: StateFlow<List<MemeEntity>> = repository.allMemes
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    // ==========================================
    // 1. CONTEXT READER (Texte)
    // ==========================================
    private val _contextInput = MutableStateFlow("")
    val contextInput: StateFlow<String> = _contextInput.asStateFlow()

    private val _textTopSuggestion = MutableStateFlow("QUAND TU IMPLÉMENTES L'IA")
    val textTopSuggestion: StateFlow<String> = _textTopSuggestion.asStateFlow()

    private val _textBottomSuggestion = MutableStateFlow("SANS COMPILER DU PREMIER COUP !")
    val textBottomSuggestion: StateFlow<String> = _textBottomSuggestion.asStateFlow()

    private val _isLoadingTextMeme = MutableStateFlow(false)
    val isLoadingTextMeme: StateFlow<Boolean> = _isLoadingTextMeme.asStateFlow()

    private val _aiBgBitmap = MutableStateFlow<Bitmap?>(null)
    val aiBgBitmap: StateFlow<Bitmap?> = _aiBgBitmap.asStateFlow()

    private val _imagePrompt = MutableStateFlow("")
    val imagePrompt: StateFlow<String> = _imagePrompt.asStateFlow()

    private val _isGeneratingImage = MutableStateFlow(false)
    val isGeneratingImage: StateFlow<Boolean> = _isGeneratingImage.asStateFlow()

    // Index du fond prédéfini sélectionné (si pas d'image IA)
    private val _selectedPresetBgIndex = MutableStateFlow(0)
    val selectedPresetBgIndex: StateFlow<Int> = _selectedPresetBgIndex.asStateFlow()

    fun setContextInput(text: String) {
        _contextInput.value = text
    }

    fun setImagePrompt(text: String) {
        _imagePrompt.value = text
    }

    private val _audioCustomBg = MutableStateFlow<Bitmap?>(null)
    val audioCustomBg: StateFlow<Bitmap?> = _audioCustomBg.asStateFlow()

    fun updateActiveBg(bitmap: Bitmap) {
        when (_currentTab.value) {
            "TEXT" -> _aiBgBitmap.value = bitmap
            "AUDIO" -> _audioCustomBg.value = bitmap
            "IMAGE" -> _statusImageBitmap.value = bitmap
        }
    }

    fun selectPresetBg(index: Int) {
        _selectedPresetBgIndex.value = index
        _aiBgBitmap.value = null // Réinitialise l'image IA si on choisit un template prédéfini
        _audioCustomBg.value = null
    }

    fun setTab(tab: String) {
        _currentTab.value = tab
    }

    fun generateMemeFromContext() {
        if (_contextInput.value.isBlank()) return
        viewModelScope.launch {
            _isLoadingTextMeme.value = true
            try {
                val suggestions = GeminiClient.generateMemeTextSuggestions(_contextInput.value)
                _textTopSuggestion.value = suggestions.first
                _textBottomSuggestion.value = suggestions.second
            } catch (e: Exception) {
                Log.e(TAG, "Error generating text meme", e)
            } finally {
                _isLoadingTextMeme.value = false
            }
        }
    }

    fun generateAiBackground() {
        if (_imagePrompt.value.isBlank()) return
        viewModelScope.launch {
            _isGeneratingImage.value = true
            try {
                val bitmap = GeminiClient.generateImageFromPrompt(_imagePrompt.value)
                if (bitmap != null) {
                    _aiBgBitmap.value = bitmap
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error generating Image backdrop", e)
            } finally {
                _isGeneratingImage.value = false
            }
        }
    }

    // ==========================================
    // 2. VOICE-TO-MEME (Audio)
    // ==========================================
    private val _isRecording = MutableStateFlow(false)
    val isRecording: StateFlow<Boolean> = _isRecording.asStateFlow()

    private val _recordedAudioPath = MutableStateFlow<String?>(null)
    val recordedAudioPath: StateFlow<String?> = _recordedAudioPath.asStateFlow()

    private val _audioTranscript = MutableStateFlow("")
    val audioTranscript: StateFlow<String> = _audioTranscript.asStateFlow()

    private val _audioMemeTop = MutableStateFlow("QUAND TU ENVOIES UNE NOTE VOCALE")
    val audioMemeTop: StateFlow<String> = _audioMemeTop.asStateFlow()

    private val _audioMemeBottom = MutableStateFlow("ET QUE LE DEVOIR EST RENDU DE MAIN PROPRE")
    val audioMemeBottom: StateFlow<String> = _audioMemeBottom.asStateFlow()

    private val _isLoadingAudioMeme = MutableStateFlow(false)
    val isLoadingAudioMeme: StateFlow<Boolean> = _isLoadingAudioMeme.asStateFlow()

    private var mediaRecorder: MediaRecorder? = null
    private var tempAudioFile: File? = null

    fun setAudioTranscript(text: String) {
        _audioTranscript.value = text
    }

    fun startRecording() {
        try {
            val context = getApplication<Application>()
            tempAudioFile = File.createTempFile("voice_note", ".3gp", context.cacheDir)
            _recordedAudioPath.value = tempAudioFile?.absolutePath
            
            mediaRecorder = MediaRecorder().apply {
                setAudioSource(MediaRecorder.AudioSource.MIC)
                setOutputFormat(MediaRecorder.OutputFormat.THREE_GPP)
                setAudioEncoder(MediaRecorder.AudioEncoder.AMR_NB)
                setOutputFile(tempAudioFile?.absolutePath)
                prepare()
                start()
            }
            _isRecording.value = true
        } catch (e: Exception) {
            Log.e(TAG, "MediaRecorder start failed, using mock capability", e)
            _isRecording.value = true // Permet de simuler même si le matériel ou permissions bloquent
        }
    }

    fun stopRecording(simulationText: String? = null) {
        if (!_isRecording.value) return
        try {
            mediaRecorder?.apply { stop(); release() }
        } catch (e: Exception) {
            Log.e(TAG, "MediaRecorder stop failed", e)
        } finally {
            mediaRecorder = null
            _isRecording.value = false
        }

        // Texte de simulation fourni (tests / environnement sans micro)
        if (!simulationText.isNullOrBlank()) {
            _audioTranscript.value = simulationText
            generateMemeFromAudio()
            return
        }

        // Transcription réelle via Gemini (100% gratuit, pas de Whisper)
        val audioPath = _recordedAudioPath.value
        if (!audioPath.isNullOrBlank()) {
            viewModelScope.launch {
                _isLoadingAudioMeme.value = true
                try {
                    val result = GeminiClient.transcribeAndGenerateMeme(audioPath)
                    _audioTranscript.value = result.transcription
                    _audioMemeTop.value    = result.topText
                    _audioMemeBottom.value = result.bottomText
                } catch (e: Exception) {
                    Log.e(TAG, "stopRecording → transcription Gemini error", e)
                    // Fallback texte si tout échoue
                    val fallback = "Hé frère, c'est incroyable ce qui s'est passé !"
                    _audioTranscript.value = fallback
                    val suggestions = GeminiClient.generateVoiceToMemeText(fallback)
                    _audioMemeTop.value    = suggestions.first
                    _audioMemeBottom.value = suggestions.second
                } finally {
                    _isLoadingAudioMeme.value = false
                }
            }
        } else {
            // Aucun fichier — fallback texte
            if (_audioTranscript.value.isBlank()) {
                _audioTranscript.value = "Hé, faut me donner mon argent sinon ça va chauffer !"
            }
            generateMemeFromAudio()
        }
    }

    fun generateMemeFromAudio() {
        if (_audioTranscript.value.isBlank()) return
        viewModelScope.launch {
            _isLoadingAudioMeme.value = true
            try {
                val suggestions = GeminiClient.generateVoiceToMemeText(_audioTranscript.value)
                _audioMemeTop.value = suggestions.first
                _audioMemeBottom.value = suggestions.second
            } catch (e: Exception) {
                Log.e(TAG, "Audio Meme generation error", e)
            } finally {
                _isLoadingAudioMeme.value = false
            }
        }
    }

    // ==========================================
    // 3. STATUS REMIXER (Image Upload + Overlay)
    // ==========================================
    private val _statusImageBitmap = MutableStateFlow<Bitmap?>(null)
    val statusImageBitmap: StateFlow<Bitmap?> = _statusImageBitmap.asStateFlow()

    private val _statusTopText = MutableStateFlow("QUAND TU REGARDES MA PHOTO")
    val statusTopText: StateFlow<String> = _statusTopText.asStateFlow()

    private val _statusBottomText = MutableStateFlow("ET QUE TU TOUMBLES DE JALOUSIE")
    val statusBottomText: StateFlow<String> = _statusBottomText.asStateFlow()

    private val _isAnalyzingStatusImage = MutableStateFlow(false)
    val isAnalyzingStatusImage: StateFlow<Boolean> = _isAnalyzingStatusImage.asStateFlow()

    fun setStatusImage(bitmap: Bitmap?) {
        _statusImageBitmap.value = bitmap
        if (bitmap != null) {
            analyzeStatusImage(bitmap)
        }
    }

    fun setStatusTexts(top: String, bottom: String) {
        _statusTopText.value = top
        _statusBottomText.value = bottom
    }

    private fun analyzeStatusImage(bitmap: Bitmap) {
        viewModelScope.launch {
            _isAnalyzingStatusImage.value = true
            try {
                val suggestions = GeminiClient.analyzeImageForMeme(bitmap)
                _statusTopText.value = suggestions.first
                _statusBottomText.value = suggestions.second
            } catch (e: Exception) {
                Log.e(TAG, "Status image analysis error", e)
            } finally {
                _isAnalyzingStatusImage.value = false
            }
        }
    }

    // ==========================================
    // SOUVEGARDE ET PARTAGE DES MEMES
    // ==========================================
    fun saveGeneratedMeme(type: String, background: Bitmap, top: String, bottom: String, onFinished: (Boolean) -> Unit) {
        viewModelScope.launch {
            try {
                val context = getApplication<Application>()
                val compiledBitmap = MemeGeneratorUtil.createMeme(background, top, bottom)
                val savedPath = MemeGeneratorUtil.saveMemeToFile(context, compiledBitmap)
                
                if (savedPath != null) {
                    val entity = MemeEntity(
                        type = type,
                        contextText = when(type) {
                            "TEXT" -> _contextInput.value
                            "AUDIO" -> _audioTranscript.value
                            else -> "Remix Photo"
                        },
                        topText = top,
                        bottomText = bottom,
                        imagePath = savedPath,
                        audioPath = if (type == "AUDIO") _recordedAudioPath.value else null
                    )
                    repository.insert(entity)
                    onFinished(true)
                } else {
                    onFinished(false)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Saving error", e)
                onFinished(false)
            }
        }
    }

    fun deleteMeme(meme: MemeEntity) {
        viewModelScope.launch {
            try {
                // Supprimer le fichier d'image local s'il existe
                meme.imagePath?.let { path ->
                    val file = File(path)
                    if (file.exists()) {
                        file.delete()
                    }
                }
                repository.delete(meme)
            } catch (e: Exception) {
                Log.e(TAG, "Deletion failed", e)
            }
        }
    }

    // ==========================================
    // MULTIMEDIA IA HANDLERS
    // ==========================================
    fun generateStickerFromContext(contextText: String) {
        if (contextText.isBlank()) return
        viewModelScope.launch {
            _isGeneratingSticker.value = true
            try {
                val result = com.example.data.api.GeminiClient.generateStickerSuggestion(contextText)
                _stickerEmoji.value = result.first
                _stickerText.value = result.second
            } catch (e: Exception) {
                Log.e(TAG, "Sticker generation error", e)
            } finally {
                _isGeneratingSticker.value = false
            }
        }
    }

    fun changeStickerEmoji(emoji: String) {
        _stickerEmoji.value = emoji
    }

    fun changeStickerText(text: String) {
        _stickerText.value = text
    }

    fun generateGifFromContext(contextText: String) {
        if (contextText.isBlank()) return
        viewModelScope.launch {
            _isSearchingGif.value = true
            try {
                val query = com.example.data.api.GeminiClient.generateGifSearchQuery(contextText)
                _gifQuery.value = query
            } catch (e: Exception) {
                Log.e(TAG, "GIF query generation error", e)
            } finally {
                _isSearchingGif.value = false
            }
        }
    }

    fun changeGifMood(mood: String) {
        _selectedGifMood.value = mood
    }

    fun generateVideoFromContext(contextText: String) {
        if (contextText.isBlank()) return
        viewModelScope.launch {
            _isGeneratingVideo.value = true
            try {
                val result = com.example.data.api.GeminiClient.generateVideoStoryboard(contextText)
                _videoTitle.value = result.first
                _videoPunchline.value = result.second
            } catch (e: Exception) {
                Log.e(TAG, "Video storyboard error", e)
            } finally {
                _isGeneratingVideo.value = false
            }
        }
    }

    fun saveMultimediaEntity(type: String, contextText: String, topText: String, bottomText: String, mediaPath: String?, onFinished: (Boolean) -> Unit) {
        viewModelScope.launch {
            try {
                val entity = MemeEntity(
                    type = type, // "STICKER", "GIF", "VIDEO"
                    contextText = contextText,
                    topText = topText,
                    bottomText = bottomText,
                    imagePath = mediaPath,
                    audioPath = null
                )
                repository.insert(entity)
                onFinished(true)
            } catch (e: Exception) {
                Log.e(TAG, "Error saving multimedia entity", e)
                onFinished(false)
            }
        }
    }

    // ==========================================
    // ADVANCED CONFIG & READY-TO-USE ELEMENTS
    // ==========================================
    private val _readyToUseEmojis = MutableStateFlow(listOf("😂", "😱", "😡", "🕺", "💀", "🔥", "🤔", "🤡", "🤖", "🚀", "👀", "🎉", "🤯", "👽", "👾", "💩", "🎯", "🌟"))
    val readyToUseEmojis: StateFlow<List<String>> = _readyToUseEmojis.asStateFlow()

    fun addReadyToUseEmoji(emoji: String) {
        val trimmed = emoji.trim()
        if (trimmed.isNotEmpty() && !_readyToUseEmojis.value.contains(trimmed)) {
            _readyToUseEmojis.value = _readyToUseEmojis.value + trimmed
        }
    }

    fun editReadyToUseEmoji(oldEmoji: String, newEmoji: String) {
        val trimmed = newEmoji.trim()
        if (trimmed.isNotEmpty()) {
            _readyToUseEmojis.value = _readyToUseEmojis.value.map { if (it == oldEmoji) trimmed else it }
        }
    }

    fun deleteReadyToUseEmoji(emoji: String) {
        _readyToUseEmojis.value = _readyToUseEmojis.value.filter { it != emoji }
    }

    // Manual Output Clear Actions (Suppression de la sortie)
    fun clearStickerOutput() {
        _stickerEmoji.value = "❓"
        _stickerText.value = ""
    }

    fun clearGifOutput() {
        _gifQuery.value = ""
        _selectedGifMood.value = "NONE"
    }

    fun clearVideoOutput() {
        _videoTitle.value = ""
        _videoPunchline.value = ""
    }
}
