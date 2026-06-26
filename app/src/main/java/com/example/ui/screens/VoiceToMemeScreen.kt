package com.example.ui.screens

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.MicOff
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.ui.VoiceToMemeState
import com.example.ui.VoiceToMemeViewModel

// ── Couleurs du thème Voice-to-Meme ─────────────────────────────────────────
private val BackgroundDark = Color(0xFF0D0D1A)
private val PurpleAccent   = Color(0xFF7C3AED)
private val PinkAccent     = Color(0xFFEC4899)
private val SurfaceCard    = Color(0xFF1A1A2E)
private val TextPrimary    = Color(0xFFF1F1F5)
private val TextSecondary  = Color(0xFF9CA3AF)

// ── Écran principal ──────────────────────────────────────────────────────────

@Composable
fun VoiceToMemeScreen(
    viewModel: VoiceToMemeViewModel = viewModel(),
    onMemeReady: (memeText: String) -> Unit = {}
) {
    val state by viewModel.state.collectAsState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(BackgroundDark)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(Modifier.height(32.dp))

            // ── Titre ────────────────────────────────────────────────────────
            Text(
                text = "🎙️ Voice-to-Meme",
                fontSize = 28.sp,
                fontWeight = FontWeight.ExtraBold,
                color = TextPrimary
            )
            Text(
                text = "Parle, on fait le meme.",
                fontSize = 14.sp,
                color = TextSecondary,
                modifier = Modifier.padding(top = 4.dp)
            )

            Spacer(Modifier.height(48.dp))

            // ── Contenu dynamique selon l'état ───────────────────────────────
            AnimatedContent(targetState = state, label = "vtm_state") { currentState ->
                when (currentState) {
                    is VoiceToMemeState.Idle      -> IdleContent(onStart = { viewModel.startRecording() })
                    is VoiceToMemeState.Recording -> RecordingContent(onStop = { viewModel.stopRecordingAndProcess() }, onCancel = { viewModel.cancelRecording() })
                    is VoiceToMemeState.Processing -> ProcessingContent()
                    is VoiceToMemeState.Success   -> SuccessContent(
                        state = currentState,
                        onReset = { viewModel.reset() },
                        onUse = { onMemeReady(currentState.memeText) }
                    )
                    is VoiceToMemeState.Error     -> ErrorContent(
                        message = currentState.message,
                        onRetry = { viewModel.reset() }
                    )
                }
            }
        }
    }
}

// ── État Idle — invitation à enregistrer ─────────────────────────────────────

@Composable
private fun IdleContent(onStart: () -> Unit) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = "Appuie sur le bouton\net parle !",
            fontSize = 18.sp,
            color = TextSecondary,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(bottom = 40.dp)
        )
        MicButton(
            isRecording = false,
            onClick = onStart
        )
        Spacer(Modifier.height(24.dp))
        Text(
            text = "L'IA transcrit ta voix et\ngénère un meme instantanément.",
            fontSize = 13.sp,
            color = TextSecondary.copy(alpha = 0.6f),
            textAlign = TextAlign.Center
        )
    }
}

// ── État Recording — animation pulsante ──────────────────────────────────────

@Composable
private fun RecordingContent(onStop: () -> Unit, onCancel: () -> Unit) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = "🔴  Enregistrement en cours…",
            fontSize = 16.sp,
            fontWeight = FontWeight.SemiBold,
            color = Color(0xFFEF4444),
            modifier = Modifier.padding(bottom = 32.dp)
        )
        MicButton(isRecording = true, onClick = onStop)

        Spacer(Modifier.height(24.dp))

        TextButton(onClick = onCancel) {
            Text("Annuler", color = TextSecondary)
        }
    }
}

// ── Bouton micro avec animation pulse ────────────────────────────────────────

@Composable
private fun MicButton(isRecording: Boolean, onClick: () -> Unit) {
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val scale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = if (isRecording) 1.12f else 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(600, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scale"
    )

    Box(
        contentAlignment = Alignment.Center,
        modifier = Modifier.size(120.dp)
    ) {
        // Halo extérieur (visible en recording)
        if (isRecording) {
            Box(
                modifier = Modifier
                    .size(120.dp)
                    .scale(scale)
                    .clip(CircleShape)
                    .background(PurpleAccent.copy(alpha = 0.2f))
            )
        }
        // Bouton principal
        IconButton(
            onClick = onClick,
            modifier = Modifier
                .size(88.dp)
                .clip(CircleShape)
                .background(
                    Brush.linearGradient(
                        listOf(PurpleAccent, PinkAccent)
                    )
                )
        ) {
            Icon(
                imageVector = if (isRecording) Icons.Filled.MicOff else Icons.Filled.Mic,
                contentDescription = if (isRecording) "Arrêter" else "Enregistrer",
                tint = Color.White,
                modifier = Modifier.size(40.dp)
            )
        }
    }
}

// ── État Processing — spinner ─────────────────────────────────────────────────

@Composable
private fun ProcessingContent() {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
        modifier = Modifier.fillMaxWidth()
    ) {
        CircularProgressIndicator(
            color = PurpleAccent,
            strokeWidth = 3.dp,
            modifier = Modifier.size(64.dp)
        )
        Spacer(Modifier.height(24.dp))
        Text(
            text = "Gemini écoute et réfléchit…",
            fontSize = 16.sp,
            color = TextSecondary,
            textAlign = TextAlign.Center
        )
        Text(
            text = "Transcription + génération du meme",
            fontSize = 13.sp,
            color = TextSecondary.copy(alpha = 0.5f),
            modifier = Modifier.padding(top = 6.dp)
        )
    }
}

// ── État Success — affichage transcription + meme ─────────────────────────────

@Composable
private fun SuccessContent(
    state: VoiceToMemeState.Success,
    onReset: () -> Unit,
    onUse: () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.fillMaxWidth()
    ) {
        // Transcription
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = SurfaceCard)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "📝 Transcription",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = PurpleAccent,
                    letterSpacing = 1.sp
                )
                Spacer(Modifier.height(8.dp))
                Text(
                    text = "\"${state.transcription}\"",
                    fontSize = 15.sp,
                    color = TextPrimary,
                    fontStyle = FontStyle.Italic
                )
            }
        }

        Spacer(Modifier.height(20.dp))

        // Meme généré
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1F0A3D))
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "🎭 Ton meme",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = PinkAccent,
                    letterSpacing = 1.sp
                )
                Spacer(Modifier.height(12.dp))
                // Texte du meme — haut (première ligne) en grand
                val lines = state.memeText.split("\n")
                lines.forEachIndexed { index, line ->
                    Text(
                        text = line.uppercase(),
                        fontSize = if (index == 0) 20.sp else 17.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = Color.White,
                        textAlign = TextAlign.Center,
                        lineHeight = 26.sp,
                        modifier = Modifier.padding(vertical = 2.dp)
                    )
                }
            }
        }

        Spacer(Modifier.height(32.dp))

        // Boutons d'action
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            OutlinedButton(
                onClick = onReset,
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = TextSecondary)
            ) {
                Icon(Icons.Filled.Refresh, null, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(6.dp))
                Text("Recommencer")
            }
            Button(
                onClick = onUse,
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.buttonColors(
                    containerColor = PurpleAccent
                )
            ) {
                Icon(Icons.Filled.Share, null, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(6.dp))
                Text("Utiliser")
            }
        }
    }
}

// ── État Error ────────────────────────────────────────────────────────────────

@Composable
private fun ErrorContent(message: String, onRetry: () -> Unit) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.fillMaxWidth()
    ) {
        Text(text = "😵", fontSize = 48.sp)
        Spacer(Modifier.height(16.dp))
        Text(
            text = "Une erreur est survenue",
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold,
            color = Color(0xFFEF4444)
        )
        Spacer(Modifier.height(8.dp))
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF2A0A0A))
        ) {
            Text(
                text = message,
                fontSize = 13.sp,
                color = TextSecondary,
                modifier = Modifier.padding(16.dp)
            )
        }
        Spacer(Modifier.height(24.dp))
        Button(
            onClick = onRetry,
            colors = ButtonDefaults.buttonColors(containerColor = PurpleAccent)
        ) {
            Text("Réessayer")
        }
    }
}
