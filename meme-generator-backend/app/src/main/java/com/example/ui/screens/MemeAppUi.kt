package com.example.ui.screens

import android.app.Application
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.Crossfade
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.animation.core.EaseInOutQuad
import androidx.compose.animation.core.EaseInOutSine
import androidx.compose.animation.core.EaseInOutBack
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.Spring
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.expandVertically
import androidx.compose.animation.shrinkVertically
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.drawscope.clipPath
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.FileProvider
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import kotlinx.coroutines.launch
import com.example.data.database.MemeEntity
import com.example.ui.MemeViewModel
import com.example.util.MemeGeneratorUtil
import com.example.util.TemplateGenerator
import java.io.File
import java.io.InputStream

@Composable
fun DimensionBackground(
    themeProperties: ThemeProperties,
    modifier: Modifier = Modifier,
    content: @Composable BoxScope.() -> Unit
) {
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(themeProperties.baseColor) // Void base
    ) {
        // 1. Dawn Wash linear gradient
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        colors = themeProperties.washColors
                    )
                )
        )
        
        // 2. Indigo Haze radial spotlight in the center/upper-center
        Box(
            modifier = Modifier
                .align(Alignment.TopCenter)
                .fillMaxWidth()
                .height(450.dp)
                .background(
                    Brush.radialGradient(
                        colors = listOf(
                            themeProperties.spotlightColor.copy(alpha = 0.25f), // Spotlight
                            Color.Transparent
                        )
                    )
                )
        )
        
        // Content on top
        Box(modifier = Modifier.fillMaxSize()) {
            content()
        }
    }
}

@Composable
fun MemeAppUi(viewModel: MemeViewModel, modifier: Modifier = Modifier) {
    val context = LocalContext.current
    val currentTab by viewModel.currentTab.collectAsStateWithLifecycle()
    val showSplash by viewModel.showSplash.collectAsStateWithLifecycle()
    val currentLanguage by viewModel.currentLanguage.collectAsStateWithLifecycle()
    var isEnteringWithLoading by remember { mutableStateOf(false) }

    if (showSplash) {
        if (!isEnteringWithLoading) {
            MemeSplashScreen(onEnter = { isEnteringWithLoading = true })
        } else {
            MemeWelcomeLoadingScreen(onComplete = { viewModel.dismissSplash() })
        }
    } else {
        val currentTheme by viewModel.currentTheme.collectAsStateWithLifecycle()
        val edition by viewModel.currentEdition.collectAsStateWithLifecycle()
        val themeProps = getThemeProperties(currentTheme)
        val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
        val scope = rememberCoroutineScope()

        DimensionBackground(themeProperties = themeProps) {
            ModalNavigationDrawer(
                drawerState = drawerState,
                drawerContent = {
                    ModalDrawerSheet(
                        drawerContainerColor = themeProps.baseColor.copy(alpha = 0.98f),
                        drawerShape = RoundedCornerShape(topEnd = 24.dp, bottomEnd = 24.dp),
                        modifier = Modifier
                            .width(280.dp)
                            .fillMaxHeight()
                            .border(1.dp, themeProps.borderColor, RoundedCornerShape(topEnd = 24.dp, bottomEnd = 24.dp))
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(24.dp),
                            verticalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            // Header of Drawer
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp),
                                modifier = Modifier.padding(bottom = 16.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(40.dp)
                                        .background(themeProps.accentColor.copy(alpha = 0.15f), CircleShape)
                                        .border(1.dp, themeProps.accentColor.copy(alpha = 0.3f), CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text("💡", fontSize = 20.sp)
                                }
                                Column {
                                    Text(
                                        text = "MemeGen AI",
                                        color = themeProps.textColor,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 18.sp
                                    )
                                    Text(
                                        text = "Edition " + edition,
                                        color = themeProps.secondaryTextColor,
                                        fontSize = 12.sp
                                    )
                                }
                            }
                            
                            HorizontalDivider(color = themeProps.borderColor)
                            
                            // Navigation Items
                            val navItems = listOf(
                                Triple("TEXT", translate("tab_text", currentLanguage), Icons.Default.Edit),
                                Triple("AUDIO", translate("tab_audio", currentLanguage), Icons.Default.PlayArrow),
                                Triple("IMAGE", translate("tab_photo", currentLanguage), Icons.Default.Share),
                                Triple("GALLERY", translate("tab_archive", currentLanguage), Icons.Default.Menu),
                                Triple("SETTINGS", translate("tab_settings", currentLanguage), Icons.Default.Settings)
                            )
                            
                            navItems.forEach { (tabId, label, icon) ->
                                val isSelected = currentTab == tabId
                                val bgSelectedColor = themeProps.accentColor.copy(alpha = 0.15f)
                                val contentColor = if (isSelected) themeProps.accentColor else themeProps.secondaryTextColor
                                
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(if (isSelected) bgSelectedColor else Color.Transparent)
                                        .border(
                                            width = if (isSelected) 0.5.dp else 0.dp,
                                            color = if (isSelected) themeProps.accentColor.copy(alpha = 0.3f) else Color.Transparent,
                                            shape = RoundedCornerShape(12.dp)
                                        )
                                        .clickable {
                                            viewModel.setTab(tabId)
                                            scope.launch { drawerState.close() }
                                        }
                                        .padding(horizontal = 16.dp, vertical = 12.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                                ) {
                                    Icon(
                                        imageVector = icon,
                                        contentDescription = label,
                                        tint = contentColor,
                                        modifier = Modifier.size(20.dp)
                                    )
                                    Text(
                                        text = label,
                                        color = contentColor,
                                        fontSize = 14.sp,
                                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                                    )
                                }
                            }
                            
                            Spacer(modifier = Modifier.weight(1f))
                            
                            // Footer
                            Text(
                                text = "ICT202 G2 • Project v2.5",
                                color = themeProps.secondaryTextColor.copy(alpha = 0.5f),
                                fontSize = 11.sp,
                                modifier = Modifier.align(Alignment.CenterHorizontally)
                            )
                        }
                    }
                }
            ) {
                Scaffold(
                    modifier = modifier.fillMaxSize(),
                    containerColor = Color.Transparent // Let Dawn Wash gradient shine through!
                ) { innerPadding ->
                    Column(
                        modifier = Modifier
                            .padding(innerPadding)
                            .fillMaxSize()
                        ) {
                        // Elegant top branding header
                        MemeHeader(viewModel = viewModel, onMenuClick = {
                            scope.launch {
                                if (drawerState.isClosed) drawerState.open() else drawerState.close()
                            }
                        })

                        Box(modifier = Modifier.weight(1f)) {
                        Crossfade(
                            targetState = currentTab,
                            animationSpec = tween(durationMillis = 400, easing = EaseInOutQuad),
                            label = "TabTransition"
                        ) { tab ->
                            when (tab) {
                                "TEXT" -> ContextReaderScreen(viewModel = viewModel)
                                "AUDIO" -> VoiceToMemeScreen(viewModel = viewModel)
                                "IMAGE" -> StatusRemixerScreen(viewModel = viewModel)
                                "GALLERY" -> MemeLibraryScreen(viewModel = viewModel)
                                "SETTINGS" -> SettingsScreen(viewModel = viewModel)
                            }
                        }
                    }
                }
            }
        }
    }
}
}

@Composable
fun MemeHeader(viewModel: MemeViewModel, onMenuClick: () -> Unit) {
    val edition by viewModel.currentEdition.collectAsStateWithLifecycle()
    val themeName by viewModel.currentTheme.collectAsStateWithLifecycle()
    val themeProps = getThemeProperties(themeName)

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color.Transparent) // Transparent to show the gradient background
            .padding(top = 16.dp, start = 16.dp, end = 24.dp, bottom = 12.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(start = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "ICT202 G2 • PROJECT",
                color = themeProps.textColor.copy(alpha = 0.5f),
                fontSize = 11.sp,
                fontWeight = FontWeight.Medium,
                letterSpacing = 1.sp
            )
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .background(Color(0xFF4ADE80), CircleShape)
                )
                Text(
                    text = "AI Online",
                    color = themeProps.textColor.copy(alpha = 0.5f),
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Normal
                )
            }
        }
        Spacer(modifier = Modifier.height(6.dp))
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth()
        ) {
            IconButton(
                onClick = onMenuClick,
                modifier = Modifier.size(40.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Menu,
                    contentDescription = "Open Navigation Menu",
                    tint = themeProps.textColor,
                    modifier = Modifier.size(24.dp)
                )
            }
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                text = "MemeGen ",
                color = themeProps.textColor,
                fontSize = 28.sp,
                fontWeight = FontWeight.Light,
                letterSpacing = (-0.5).sp
            )
            Text(
                text = "AI",
                color = themeProps.textColor,
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = (-0.5).sp
            )
            Spacer(modifier = Modifier.width(8.dp))
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(6.dp))
                    .background(themeProps.accentColor.copy(alpha = 0.15f))
                    .border(0.5.dp, themeProps.accentColor.copy(alpha = 0.3f), RoundedCornerShape(6.dp))
                    .padding(horizontal = 6.dp, vertical = 2.dp)
            ) {
                Text(
                    text = edition.uppercase(),
                    color = themeProps.accentColor,
                    fontSize = 8.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }
        Spacer(modifier = Modifier.height(8.dp))
        // Subtle divider hairline from Dimension spec: 1px #e5e5e5 at 8% opacity
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(1.dp)
                .background(themeProps.borderColor)
        )
    }
}

@Composable
fun DynamicAIVisualizationCard(modeName: String, subtitle: String) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(130.dp)
            .clip(RoundedCornerShape(24.dp)) // 24dp curves for cards
            .background(Color(0xFF1D1D1D).copy(alpha = 0.85f)) // Translucent Char surface
            .border(1.dp, Color(0xFFE5E5E5).copy(alpha = 0.08f), RoundedCornerShape(24.dp))
    ) {
        // Overlay subtle radial spotlight behind hero content (Indigo Haze - #6b62f2)
        Box(
            modifier = Modifier
                .align(Alignment.Center)
                .size(180.dp)
                .background(
                    Brush.radialGradient(
                        colors = listOf(Color(0xFF6B62F2).copy(alpha = 0.2f), Color.Transparent)
                    )
                )
        )

        // Content
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Box(
                modifier = Modifier
                    .background(Color(0xFF3D3D3D), CircleShape) // Iron active state
                    .padding(10.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Face,
                    contentDescription = null,
                    tint = Color(0xFFE5E5E5),
                    modifier = Modifier.size(24.dp)
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = modeName,
                color = Color(0xFFE5E5E5), // Bone primary
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = subtitle,
                color = Color(0xFFC2C2C2), // Mist secondary
                fontSize = 11.sp,
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
fun MemeBottomNavigation(currentTab: String, currentLanguage: String, onSelected: (String) -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color.Transparent) // Transparent to show background gradient
            .padding(bottom = 16.dp, start = 8.dp, end = 8.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
                .clip(RoundedCornerShape(9999.dp)) // 9999px radius (pill-shaped default)
                .background(Color(0xFF1D1D1D).copy(alpha = 0.85f)) // Translucent Char surface
                .border(1.dp, Color.White.copy(alpha = 0.08f), RoundedCornerShape(9999.dp))
                .padding(horizontal = 4.dp),
            horizontalArrangement = Arrangement.SpaceAround,
            verticalAlignment = Alignment.CenterVertically
        ) {
            listOf(
                Triple("TEXT", translate("tab_text", currentLanguage), Icons.Default.Edit),
                Triple("AUDIO", translate("tab_audio", currentLanguage), Icons.Default.PlayArrow),
                Triple("IMAGE", translate("tab_photo", currentLanguage), Icons.Default.Share),
                Triple("GALLERY", translate("tab_archive", currentLanguage), Icons.Default.Menu),
                Triple("SETTINGS", translate("tab_settings", currentLanguage), Icons.Default.Settings)
            ).forEach { (tabId, label, icon) ->
                val isSelected = currentTab == tabId
                val contentColor = if (isSelected) Color(0xFFFFFFFF) else Color(0xFF797979)
                val bgModifier = if (isSelected) {
                    Modifier
                        .clip(RoundedCornerShape(9999.dp))
                        .background(Color(0xFF3D3D3D)) // Active Iron background
                        .padding(horizontal = 8.dp, vertical = 6.dp)
                } else {
                    Modifier
                        .clickable { onSelected(tabId) }
                        .padding(horizontal = 8.dp, vertical = 6.dp)
                }

                Row(
                    modifier = bgModifier,
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = label,
                        tint = contentColor,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(3.dp))
                    Text(
                        text = label,
                        color = contentColor,
                        fontSize = 11.sp,
                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                    )
                }
            }
        }
    }
}

// ==========================================
// 1. CONTEXT READER SCREEN (Texte)
// ==========================================
@Composable
fun ContextReaderScreen(viewModel: MemeViewModel) {
    val context = LocalContext.current
    val kbController = LocalSoftwareKeyboardController.current

    val contextInput by viewModel.contextInput.collectAsStateWithLifecycle()
    val topText by viewModel.textTopSuggestion.collectAsStateWithLifecycle()
    val bottomText by viewModel.textBottomSuggestion.collectAsStateWithLifecycle()
    val isLoading by viewModel.isLoadingTextMeme.collectAsStateWithLifecycle()

    val aiBgBitmap by viewModel.aiBgBitmap.collectAsStateWithLifecycle()
    val imagePrompt by viewModel.imagePrompt.collectAsStateWithLifecycle()
    val isGeneratingImage by viewModel.isGeneratingImage.collectAsStateWithLifecycle()
    val selectedPresetIdx by viewModel.selectedPresetBgIndex.collectAsStateWithLifecycle()

    // Générer le bitmap effectif de l'arrière plan
    val activeBgBitmap = remember(aiBgBitmap, selectedPresetIdx) {
        aiBgBitmap ?: TemplateGenerator.generatePresetBitmap(selectedPresetIdx)
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            DynamicAIVisualizationCard(
                modeName = "Ready to transform your vibe.",
                subtitle = "Context Reader mode is active"
            )
        }

        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1D1D1D).copy(alpha = 0.85f)), // Translucent Char card background
                shape = RoundedCornerShape(24.dp), // Card 24dp curve
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, Color(0xFFE5E5E5).copy(alpha = 0.08f), RoundedCornerShape(24.dp))
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "🧠 Context Reader (Discussion)",
                        color = Color(0xFFE5E5E5), // Bone primary text
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Colle des extraits ou exprime une situation du quotidien. L'IA Gemini 3.5 va en extraire l'essence pour imaginer un mème drôle à mourir.",
                        color = Color(0xFFC2C2C2), // Mist secondary text
                        fontSize = 12.sp,
                        lineHeight = 16.sp
                    )
                }
            }
        }

        // Zone Saisie de discussion
        item {
            OutlinedTextField(
                value = contextInput,
                onValueChange = { viewModel.setContextInput(it) },
                label = { Text("Situation / Extrait de chat...") },
                placeholder = { Text("Ex: Ma chérie me dit qu'elle est en route alors qu'on entend le bruit de la douche derrière...") },
                modifier = Modifier
                    .fillMaxWidth()
                    .testTag("context_input"),
                minLines = 3,
                maxLines = 5,
                shape = RoundedCornerShape(10.dp), // Inputs 10dp radius
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Color(0xFFE5E5E5), // Bone focused border
                    unfocusedBorderColor = Color(0xFFE5E5E5).copy(alpha = 0.08f), // Hairline unfocused border
                    focusedLabelColor = Color(0xFFE5E5E5),
                    unfocusedLabelColor = Color(0xFF686868),
                    focusedTextColor = Color(0xFFE5E5E5),
                    unfocusedTextColor = Color(0xFFE5E5E5)
                )
            )
        }

        // Bouton de génération de texte de mème
        item {
            Button(
                onClick = {
                    kbController?.hide()
                    viewModel.generateMemeFromContext()
                },
                enabled = contextInput.isNotBlank() && !isLoading,
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color.White, // Paper action fill
                    contentColor = Color(0xFF0A0A0A) // Void text color
                ),
                shape = RoundedCornerShape(9999.dp), // 9999px radius (pill CTA)
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
                    .testTag("generate_text_button")
            ) {
                if (isLoading) {
                    CircularProgressIndicator(color = Color.Black, modifier = Modifier.size(24.dp))
                } else {
                    Row(
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("GÉNÉRER MÈME TEXTE IA", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    }
                }
            }
        }

        // Choix du fond (Presets vs IA Prompt Generation)
        item {
            Column(modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = "🎨 Image d'arrière-plan du Mème :",
                    color = Color.White,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(10.dp))

                // Liste de presets horizontaux
                ScrollablePresetsWidget(
                    selectedIdx = selectedPresetIdx,
                    onSelect = { viewModel.selectPresetBg(it) }
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Option bonus: générer son propre fond par IA
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    OutlinedTextField(
                        value = imagePrompt,
                        onValueChange = { viewModel.setImagePrompt(it) },
                        label = { Text("Bonus : Générer un fond IA (Imagen)") },
                        placeholder = { Text("Ex: A funny dynamic orange cat") },
                        modifier = Modifier.weight(1f),
                        singleLine = true,
                        shape = RoundedCornerShape(10.dp), // Inputs 10dp radius
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = Color(0xFFE5E5E5), // Bone
                            unfocusedBorderColor = Color(0xFFE5E5E5).copy(alpha = 0.08f), // Ink hairline
                            focusedLabelColor = Color(0xFFE5E5E5),
                            unfocusedLabelColor = Color(0xFF686868),
                            focusedTextColor = Color(0xFFE5E5E5),
                            unfocusedTextColor = Color(0xFFE5E5E5)
                        )
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    IconButton(
                        onClick = {
                            kbController?.hide()
                            viewModel.generateAiBackground()
                        },
                        enabled = imagePrompt.isNotBlank() && !isGeneratingImage,
                        colors = IconButtonDefaults.iconButtonColors(
                            containerColor = Color(0xFF1D1D1D), // Char background
                            contentColor = Color(0xFFE5E5E5) // Bone icon color
                        ),
                        modifier = Modifier
                            .size(56.dp)
                            .clip(RoundedCornerShape(10.dp)) // Inputs 10dp radius
                            .border(1.dp, Color(0xFFE5E5E5).copy(alpha = 0.08f), RoundedCornerShape(10.dp))
                    ) {
                        if (isGeneratingImage) {
                            CircularProgressIndicator(color = Color(0xFFE5E5E5), modifier = Modifier.size(20.dp))
                        } else {
                            Icon(Icons.Default.Add, contentDescription = "Générer son fond")
                        }
                    }
                }
            }
        }

        // Live preview du mème
        item {
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "Aperçu en Direct :",
                    color = Color(0xFFC2C2C2), // Mist secondary
                    fontSize = 13.sp,
                    modifier = Modifier.align(Alignment.Start)
                )
                Spacer(modifier = Modifier.height(8.dp))

                MemeCardPreview(
                    bgBitmap = activeBgBitmap,
                    topText = topText,
                    bottomText = bottomText
                )
            }
        }

        // Actions (Enregistrer et Partager)
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Button(
                    onClick = {
                        viewModel.saveGeneratedMeme(
                            type = "TEXT",
                            background = activeBgBitmap,
                            top = topText,
                            bottom = bottomText
                        ) { success ->
                            if (success) {
                                Toast.makeText(context, "Mème sauvegardé !", Toast.LENGTH_SHORT).show()
                            } else {
                                Toast.makeText(context, "Échec de la sauvegarde", Toast.LENGTH_SHORT).show()
                            }
                        }
                    },
                    shape = RoundedCornerShape(9999.dp), // 9999px radius (pill shape)
                    modifier = Modifier
                        .weight(1f)
                        .height(48.dp)
                        .testTag("save_button"),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color.White, // Paper action fill
                        contentColor = Color(0xFF0A0A0A) // Void text color
                    )
                ) {
                    Icon(Icons.Default.Check, contentDescription = null)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("SAUVEGARDER", fontWeight = FontWeight.Bold)
                }

                Button(
                    onClick = {
                        shareMemeAction(context, activeBgBitmap, topText, bottomText)
                    },
                    shape = RoundedCornerShape(9999.dp), // 9999px radius (pill shape)
                    modifier = Modifier
                        .weight(1f)
                        .height(48.dp)
                        .testTag("share_button")
                        .border(1.dp, Color(0xFFE5E5E5).copy(alpha = 0.08f), RoundedCornerShape(9999.dp)),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color(0xFF1D1D1D), // Char background
                        contentColor = Color(0xFFE5E5E5) // Bone text color
                    )
                ) {
                    Icon(Icons.Default.Share, contentDescription = null)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("PARTAGER", fontWeight = FontWeight.Bold)
                }
            }
        }

        if (contextInput.isNotBlank()) {
            item {
                MultimediaStudioSection(viewModel = viewModel, contextText = contextInput)
            }
        }
    }
}

// Helper pour faire défiler les presets de fond
@Composable
fun ScrollablePresetsWidget(selectedIdx: Int, onSelect: (Int) -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(54.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        TemplateGenerator.PRESETS.forEachIndexed { idx, preset ->
            Box(
                modifier = Modifier
                    .size(width = 110.dp, height = 48.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .border(
                        width = if (selectedIdx == idx) 2.dp else 1.dp,
                        color = if (selectedIdx == idx) Color.White else Color.White.copy(alpha = 0.15f),
                        shape = RoundedCornerShape(8.dp)
                    )
                    .background(
                        Brush.linearGradient(
                            colors = listOf(Color(preset.startColor), Color(preset.endColor))
                        )
                    )
                    .clickable { onSelect(idx) },
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = preset.name,
                    color = Color.White,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center,
                    style = MaterialTheme.typography.labelSmall
                )
            }
        }
    }
}

// Widget de preview dynamique de mème
@Composable
fun MemeCardPreview(bgBitmap: Bitmap, topText: String, bottomText: String) {
    Box(
        modifier = Modifier
            .size(310.dp)
            .clip(RoundedCornerShape(12.dp))
            .border(2.dp, Color.White, RoundedCornerShape(12.dp))
            .background(Color.Black),
        contentAlignment = Alignment.Center
    ) {
        val mergedBitmap = remember(bgBitmap, topText, bottomText) {
            MemeGeneratorUtil.createMeme(bgBitmap, topText, bottomText)
        }
        Image(
            bitmap = mergedBitmap.asImageBitmap(),
            contentDescription = "Meme Preview",
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop
        )
    }
}

// ==========================================
// 2. VOICE-TO-MEME SCREEN (Audio)
// ==========================================
@Composable
fun VoiceToMemeScreen(viewModel: MemeViewModel) {
    val context = LocalContext.current
    val isRecording by viewModel.isRecording.collectAsStateWithLifecycle()
    val transcript by viewModel.audioTranscript.collectAsStateWithLifecycle()
    val topText by viewModel.audioMemeTop.collectAsStateWithLifecycle()
    val bottomText by viewModel.audioMemeBottom.collectAsStateWithLifecycle()
    val isLoading by viewModel.isLoadingAudioMeme.collectAsStateWithLifecycle()
    val selectedPresetIdx by viewModel.selectedPresetBgIndex.collectAsStateWithLifecycle()

    val activeBg = remember(selectedPresetIdx) {
        TemplateGenerator.generatePresetBitmap(selectedPresetIdx)
    }

    // Preset audio transcript expressions for quick simulators on emulator:
    val mockExpressions = listOf(
        "Qui t’a dit ça ? Faut quitter là-bas !",
        "C'est gâté ! Mon argent se mange pas en vain.",
        "Il n'y a pas ton deux dans ce monde de menteurs.",
        "Tu parles trop mais ton portefeuille est en panne sèche.",
        "Le secret c'est le travail, mais moi j'aime dormir !"
    )

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            DynamicAIVisualizationCard(
                modeName = "Voice-to-Meme Audio AI",
                subtitle = "Speak or trigger a simulator option below"
            )
        }

        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1D1D1D).copy(alpha = 0.85f)),
                shape = RoundedCornerShape(24.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, Color(0xFFE5E5E5).copy(alpha = 0.08f), RoundedCornerShape(24.dp))
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "🎙️ Voice-To-Meme",
                        color = Color(0xFFE5E5E5),
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Enregistre une note vocale. L'IA va la transcrire, analyser l'émotion ou le ton, et générer un mème textuel avec la transcription en sous-titre.",
                        color = Color(0xFFC2C2C2),
                        fontSize = 12.sp,
                        lineHeight = 16.sp
                    )
                }
            }
        }

        // Contrôle d'enregistrement
        item {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF1D1D1D).copy(alpha = 0.85f), RoundedCornerShape(24.dp))
                    .border(1.dp, Color(0xFFE5E5E5).copy(alpha = 0.08f), RoundedCornerShape(24.dp))
                    .padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                // Animation de micro glowing
                val infiniteTransition = rememberInfiniteTransition(label = "pulse")
                val scaleFactor by infiniteTransition.animateFloat(
                    initialValue = 1f,
                    targetValue = if (isRecording) 1.25f else 1f,
                    animationSpec = infiniteRepeatable(
                        animation = tween(800),
                        repeatMode = RepeatMode.Reverse
                    ),
                    label = "pulse"
                )

                Box(
                    modifier = Modifier
                        .size(68.dp)
                        .scale(scaleFactor)
                        .clip(CircleShape)
                        .background(if (isRecording) Color(0xFFEF4444) else Color.White)
                        .clickable {
                            if (isRecording) {
                                viewModel.stopRecording()
                            } else {
                                viewModel.startRecording()
                            }
                        }
                        .testTag("voice_record_button"),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = if (isRecording) Icons.Default.Close else Icons.Default.PlayArrow,
                        contentDescription = "Record microphone Button",
                        tint = if (isRecording) Color.White else Color.Black,
                        modifier = Modifier.size(32.dp)
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                Text(
                    text = if (isRecording) "🔴 Enregistrement en cours (Appuie pour arrêter)" else "Toucher pour enregistrer de l'audio",
                    color = Color.White,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold
                )

                // Simulateur alternatif pour tester sans micro/émulateur
                Spacer(modifier = Modifier.height(20.dp))
                Text(
                    text = "📢 Simuler une note vocale (Pratique pour émulateur) :",
                    color = Color(0xFFC2C2C2),
                    fontSize = 11.sp,
                    modifier = Modifier.align(Alignment.Start)
                )
                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    mockExpressions.take(3).forEach { text ->
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .background(Color(0xFF1D1D1D), RoundedCornerShape(8.dp))
                                .border(1.dp, Color(0xFFE5E5E5).copy(alpha = 0.08f), RoundedCornerShape(8.dp))
                                .clickable {
                                    viewModel.stopRecording(simulationText = text)
                                }
                                .padding(8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = text,
                                color = Color(0xFFC2C2C2),
                                fontSize = 10.sp,
                                maxLines = 2,
                                textAlign = TextAlign.Center
                            )
                        }
                    }
                }
            }
        }

        // Zone transcription
        item {
            OutlinedTextField(
                value = transcript,
                onValueChange = { viewModel.setAudioTranscript(it) },
                label = { Text("Transcription de la Note Vocale") },
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Color(0xFFE5E5E5),
                    unfocusedBorderColor = Color(0xFFE5E5E5).copy(alpha = 0.08f),
                    focusedLabelColor = Color(0xFFE5E5E5),
                    unfocusedLabelColor = Color(0xFF686868),
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White
                )
            )
        }

        // Live preview du mème
        item {
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "Aperçu :",
                    color = Color.LightGray,
                    fontSize = 13.sp,
                    modifier = Modifier.align(Alignment.Start)
                )
                Spacer(modifier = Modifier.height(8.dp))

                MemeCardPreview(
                    bgBitmap = activeBg,
                    topText = topText,
                    bottomText = bottomText
                )
            }
        }

        // Actions
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Button(
                    onClick = {
                        viewModel.saveGeneratedMeme(
                            type = "AUDIO",
                            background = activeBg,
                            top = topText,
                            bottom = bottomText
                        ) { success ->
                            if (success) {
                                Toast.makeText(context, "Mème Audio sauvegardé !", Toast.LENGTH_SHORT).show()
                            } else {
                                Toast.makeText(context, "Échec de sauvegarde", Toast.LENGTH_SHORT).show()
                            }
                        }
                    },
                    modifier = Modifier
                        .weight(1f)
                        .height(48.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = Color(0xFF0A0A0A)),
                    shape = RoundedCornerShape(9999.dp)
                ) {
                    Icon(Icons.Default.Check, contentDescription = null)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("SAUVEGARDER", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }

                Button(
                    onClick = {
                        shareMemeAction(context, activeBg, topText, bottomText)
                    },
                    modifier = Modifier
                        .weight(1f)
                        .height(48.dp)
                        .border(1.dp, Color(0xFFE5E5E5).copy(alpha = 0.08f), RoundedCornerShape(9999.dp)),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1D1D1D), contentColor = Color(0xFFE5E5E5)),
                    shape = RoundedCornerShape(9999.dp)
                ) {
                    Icon(Icons.Default.Share, contentDescription = null)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("PARTAGER", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
            }
        }

        if (transcript.isNotBlank()) {
            item {
                MultimediaStudioSection(viewModel = viewModel, contextText = transcript)
            }
        }
    }
}

// ==========================================
// 3. STATUS REMIXER SCREEN (Image + Custom Texts + Direct Editing & Studio)
// ==========================================
@Composable
fun StatusRemixerScreen(viewModel: MemeViewModel) {
    val context = LocalContext.current
    val language by viewModel.currentLanguage.collectAsStateWithLifecycle()
    val themeName by viewModel.currentTheme.collectAsStateWithLifecycle()
    val themeProps = getThemeProperties(themeName)

    // Primary State variables
    val selectedBitmap by viewModel.statusImageBitmap.collectAsStateWithLifecycle()
    val topText by viewModel.statusTopText.collectAsStateWithLifecycle()
    val bottomText by viewModel.statusBottomText.collectAsStateWithLifecycle()
    val isAnalyzing by viewModel.isAnalyzingStatusImage.collectAsStateWithLifecycle()

    // Sub-mode State variables collected at Composable top-level
    val stickerText by viewModel.stickerText.collectAsStateWithLifecycle()
    val activeEmoji by viewModel.stickerEmoji.collectAsStateWithLifecycle()
    val gifQuery by viewModel.gifQuery.collectAsStateWithLifecycle()
    val activeMood by viewModel.selectedGifMood.collectAsStateWithLifecycle()
    val videoTitle by viewModel.videoTitle.collectAsStateWithLifecycle()
    val videoPunchline by viewModel.videoPunchline.collectAsStateWithLifecycle()

    // Sub-mode selector inside Photo screen
    var activeSubMode by remember { mutableStateOf("PHOTO_REMIXER") } // "PHOTO_REMIXER", "STICKER", "GIF", "VIDEO"

    // Image Editor Parameters
    var brightness by remember { mutableFloatStateOf(1.0f) }
    var contrast by remember { mutableFloatStateOf(1.0f) }
    var selectedFilter by remember { mutableStateOf("Original") }
    var showEditorPanel by remember { mutableStateOf(false) }
    var isDrawingMode by remember { mutableStateOf(false) }
    val scribbles = remember { mutableStateListOf<Pair<Float, Float>>() }
    var scribbleColor by remember { mutableStateOf(android.graphics.Color.RED) }

    // Custom Submode settings
    var stickerShape by remember { mutableStateOf("Circle") } // "Circle", "Rounded", "Star"
    var stickerShakeSpeed by remember { mutableFloatStateOf(1.0f) }
    var gifMood by remember { mutableStateOf("🤣 LOL") }
    var gifPlaybackSpeed by remember { mutableFloatStateOf(1.0f) }
    var videoEffect by remember { mutableStateOf("Cyber Glow") }
    var isVideoPlaying by remember { mutableStateOf(true) }

    // Configuration of Picker d'images
    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            try {
                val inputStream: InputStream? = context.contentResolver.openInputStream(uri)
                val bitmap = BitmapFactory.decodeStream(inputStream)
                viewModel.setStatusImage(bitmap)
                // Reset editor parameters on new image upload
                brightness = 1.0f
                contrast = 1.0f
                selectedFilter = "Original"
                scribbles.clear()
            } catch (e: Exception) {
                Toast.makeText(context, "Erreur de chargement d'image", Toast.LENGTH_SHORT).show()
            }
        }
    }

    // Default template image in case user hasn't uploaded anything yet
    val displayBitmap = remember(selectedBitmap) {
        selectedBitmap ?: TemplateGenerator.generatePresetBitmap(4)
    }

    // Compute modified background bitmap with real-time editing values applied
    val editedBitmap = remember(displayBitmap, brightness, contrast, selectedFilter, scribbles.size, scribbleColor) {
        MemeGeneratorUtil.applyBitmapEdits(
            base = displayBitmap,
            brightness = brightness,
            contrast = contrast,
            filter = selectedFilter,
            scribbles = scribbles.toList(),
            scribbleColor = scribbleColor
        )
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp),
        contentPadding = PaddingValues(top = 8.dp, bottom = 32.dp)
    ) {
        // Mode Selector Chips
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState())
                    .padding(vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                listOf(
                    "PHOTO_REMIXER" to "📸 Photo",
                    "STICKER" to "🎨 Sticker AI",
                    "GIF" to "🎬 GIF Situation",
                    "VIDEO" to "📺 Short Vidéo"
                ).forEach { (modeKey, modeLabel) ->
                    val isSelected = activeSubMode == modeKey
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(9999.dp))
                            .background(if (isSelected) themeProps.accentColor else themeProps.cardBackground)
                            .border(1.dp, if (isSelected) themeProps.accentColor else themeProps.borderColor, RoundedCornerShape(9999.dp))
                            .clickable { activeSubMode = modeKey }
                            .padding(horizontal = 16.dp, vertical = 8.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = modeLabel,
                            color = if (isSelected) Color.White else themeProps.textColor,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }

        // CONDITIONAL RENDERING BASED ON THE SELECTED MODE
        when (activeSubMode) {
            "PHOTO_REMIXER" -> {
                // PHOTO REMIXER VIEW
                item {
                    DynamicAIVisualizationCard(
                        modeName = "Status Remixer Photo AI",
                        subtitle = "Upload or select a photo to begin"
                    )
                }

                item {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = themeProps.cardBackground),
                        shape = RoundedCornerShape(24.dp),
                        border = BorderStroke(1.dp, themeProps.borderColor),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(
                                text = "📸 Status Remixer (Uploader Photo)",
                                color = themeProps.textColor,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = "Télécharge une image de ton téléphone. Notre IA analysera instantanément ton image afin de suggérer des punchlines drôles à superposer dessus.",
                                color = themeProps.secondaryTextColor,
                                fontSize = 12.sp,
                                lineHeight = 16.sp
                            )
                        }
                    }
                }

                // Zone Sélecteur d'image & Editor Toggle
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Button(
                            onClick = { imagePickerLauncher.launch("image/*") },
                            colors = ButtonDefaults.buttonColors(containerColor = themeProps.accentColor, contentColor = Color.White),
                            shape = RoundedCornerShape(9999.dp),
                            modifier = Modifier
                                .weight(1.3f)
                                .height(48.dp)
                                .testTag("status_image")
                        ) {
                            Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("GALERIE", fontWeight = FontWeight.Bold, fontSize = 11.sp)
                        }

                        Button(
                            onClick = { showEditorPanel = !showEditorPanel },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (showEditorPanel) themeProps.textColor else themeProps.cardBackground,
                                contentColor = if (showEditorPanel) themeProps.baseColor else themeProps.textColor
                            ),
                            border = BorderStroke(1.dp, themeProps.borderColor),
                            shape = RoundedCornerShape(9999.dp),
                            modifier = Modifier
                                .weight(1f)
                                .height(48.dp)
                        ) {
                            Icon(Icons.Default.Edit, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("EDITER", fontWeight = FontWeight.Bold, fontSize = 11.sp)
                        }
                    }
                }

                // Direct Editing Tools Panel
                if (showEditorPanel) {
                    item {
                        DirectImageEditor(
                            baseBitmap = displayBitmap,
                            brightness = brightness,
                            onBrightnessChange = { brightness = it },
                            contrast = contrast,
                            onContrastChange = { contrast = it },
                            selectedFilter = selectedFilter,
                            onFilterChange = { selectedFilter = it },
                            scribbles = scribbles,
                            onScribbleAdded = { scribbles.add(it) },
                            onClearScribbles = { scribbles.clear() },
                            scribbleColor = scribbleColor,
                            onScribbleColorChange = { scribbleColor = it },
                            isDrawingMode = isDrawingMode,
                            onToggleDrawingMode = { isDrawingMode = it },
                            themeProps = themeProps
                        )
                    }
                }

                // Inputs manuels
                item {
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        OutlinedTextField(
                            value = topText,
                            onValueChange = { viewModel.setStatusTexts(it, bottomText) },
                            label = { Text("Légende supérieure (Haut)") },
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = themeProps.accentColor,
                                unfocusedBorderColor = themeProps.borderColor,
                                focusedLabelColor = themeProps.accentColor,
                                unfocusedLabelColor = themeProps.secondaryTextColor,
                                focusedTextColor = themeProps.textColor,
                                unfocusedTextColor = themeProps.textColor
                            )
                        )

                        OutlinedTextField(
                            value = bottomText,
                            onValueChange = { viewModel.setStatusTexts(topText, it) },
                            label = { Text("Légende inférieure (Bas)") },
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = themeProps.accentColor,
                                unfocusedBorderColor = themeProps.borderColor,
                                focusedLabelColor = themeProps.accentColor,
                                unfocusedLabelColor = themeProps.secondaryTextColor,
                                focusedTextColor = themeProps.textColor,
                                unfocusedTextColor = themeProps.textColor
                            )
                        )
                    }
                }

                // Indicateur d'analyse IA
                if (isAnalyzing) {
                    item {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center
                        ) {
                            CircularProgressIndicator(color = themeProps.accentColor, modifier = Modifier.size(24.dp))
                            Spacer(modifier = Modifier.width(10.dp))
                            Text("Analyse de l'image par Gemini IA...", color = themeProps.secondaryTextColor, fontSize = 13.sp)
                        }
                    }
                }

                // Live preview card using editedBitmap
                item {
                    MemeCardPreview(
                        bgBitmap = editedBitmap,
                        topText = topText,
                        bottomText = bottomText
                    )
                }

                // Actions de sauvegarde et partage
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Button(
                            onClick = {
                                viewModel.saveGeneratedMeme(
                                    type = "IMAGE",
                                    background = editedBitmap,
                                    top = topText,
                                    bottom = bottomText
                                ) { success ->
                                    if (success) {
                                        Toast.makeText(context, "Mème personnalisé sauvegardé !", Toast.LENGTH_SHORT).show()
                                    } else {
                                        Toast.makeText(context, "Erreur d'enregistrement", Toast.LENGTH_SHORT).show()
                                    }
                                }
                            },
                            modifier = Modifier
                                .weight(1f)
                                .height(48.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = themeProps.accentColor, contentColor = Color.White),
                            shape = RoundedCornerShape(9999.dp)
                        ) {
                            Icon(Icons.Default.Check, contentDescription = null)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("ENREGISTRER", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        }

                        Button(
                            onClick = {
                                shareMemeAction(context, editedBitmap, topText, bottomText)
                            },
                            modifier = Modifier
                                .weight(1f)
                                .height(48.dp)
                                .border(1.dp, themeProps.borderColor, RoundedCornerShape(9999.dp)),
                            colors = ButtonDefaults.buttonColors(containerColor = themeProps.cardBackground, contentColor = themeProps.textColor),
                            shape = RoundedCornerShape(9999.dp)
                        ) {
                            Icon(Icons.Default.Share, contentDescription = null)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("PARTAGER", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        }
                    }
                }

                item {
                    val contextCombined = remember(topText, bottomText) {
                        "${topText} ${bottomText}".trim()
                    }
                    if (contextCombined.isNotBlank()) {
                        MultimediaStudioSection(viewModel = viewModel, contextText = contextCombined)
                    }
                }
            }

            "STICKER" -> {
                // STICKERS AI MODE (With Custom Layout & Parameters)

                item {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = themeProps.cardBackground),
                        shape = RoundedCornerShape(24.dp),
                        border = BorderStroke(1.dp, themeProps.borderColor),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            Text("🎨 Studio Autocollants AI", color = themeProps.textColor, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                            Text("Créez des stickers personnalisés avec des emojis et des slogans dynamiques de votre choix.", color = themeProps.secondaryTextColor, fontSize = 12.sp)

                            HorizontalDivider(color = themeProps.borderColor)

                            // Parameters Panel
                            Text("Paramètres d'édition du Sticker :", color = themeProps.textColor, fontWeight = FontWeight.Bold, fontSize = 12.sp)

                            // Sticker Shape selector
                            Column {
                                Text("Forme de l'arrière-plan :", color = themeProps.secondaryTextColor, fontSize = 11.sp)
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(vertical = 4.dp)) {
                                    listOf("Circle", "Rounded", "Star").forEach { shape ->
                                        val isSel = stickerShape == shape
                                        Box(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(8.dp))
                                                .background(if (isSel) themeProps.accentColor else themeProps.borderColor)
                                                .clickable { stickerShape = shape }
                                                .padding(horizontal = 12.dp, vertical = 6.dp)
                                        ) {
                                            Text(shape, color = if (isSel) Color.White else themeProps.textColor, fontSize = 11.sp)
                                        }
                                    }
                                }
                            }

                            // Shake Speed slider
                            Column {
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text("Intensité de l'animation :", color = themeProps.secondaryTextColor, fontSize = 11.sp)
                                    Text("${(stickerShakeSpeed * 100).toInt()}%", color = themeProps.accentColor, fontSize = 11.sp)
                                }
                                Slider(
                                    value = stickerShakeSpeed,
                                    onValueChange = { stickerShakeSpeed = it },
                                    valueRange = 0.5f..2.0f,
                                    colors = SliderDefaults.colors(
                                        thumbColor = themeProps.accentColor,
                                        activeTrackColor = themeProps.accentColor
                                    )
                                )
                            }
                        }
                    }
                }

                // Dynamic Sticker visual preview
                item {
                    val infiniteTransition = rememberInfiniteTransition(label = "sticker_shake")
                    val shakeOffset by infiniteTransition.animateFloat(
                        initialValue = -5f * stickerShakeSpeed,
                        targetValue = 5f * stickerShakeSpeed,
                        animationSpec = infiniteRepeatable(
                            animation = tween(durationMillis = 150, easing = LinearEasing),
                            repeatMode = RepeatMode.Reverse
                        ),
                        label = "sticker_shake_val"
                    )

                    Box(
                        modifier = Modifier
                            .size(240.dp)
                            .graphicsLayer {
                                translationX = shakeOffset
                                translationY = shakeOffset / 2f
                            }
                            .clip(
                                when (stickerShape) {
                                    "Rounded" -> RoundedCornerShape(24.dp)
                                    "Star" -> RoundedCornerShape(48.dp) // Simulated star or oval
                                    else -> CircleShape
                                }
                            )
                            .background(
                                Brush.radialGradient(
                                    colors = listOf(
                                        themeProps.accentColor.copy(alpha = 0.8f),
                                        themeProps.accentColor.copy(alpha = 0.1f)
                                    )
                                )
                            )
                            .border(
                                3.dp,
                                Brush.linearGradient(listOf(themeProps.accentColor, Color.White)),
                                when (stickerShape) {
                                    "Rounded" -> RoundedCornerShape(24.dp)
                                    "Star" -> RoundedCornerShape(48.dp)
                                    else -> CircleShape
                                }
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                            Text(activeEmoji, fontSize = 84.sp)
                            Spacer(modifier = Modifier.height(12.dp))
                            Box(
                                modifier = Modifier
                                    .background(Color.Black.copy(alpha = 0.6f), RoundedCornerShape(8.dp))
                                    .padding(horizontal = 8.dp, vertical = 4.dp)
                            ) {
                                Text(
                                    text = stickerText.uppercase(),
                                    color = Color.White,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    textAlign = TextAlign.Center
                                )
                            }
                        }
                    }
                }

                // Advanced Manual Config Panel (Manual editing, additions and deletions of outputs)
                item {
                    AdvancedOutputConfigPanel(viewModel = viewModel, mode = "STICKER")
                }

                // Action to save sticker
                item {
                    Button(
                        onClick = {
                            viewModel.saveGeneratedMeme(
                                type = "STICKER",
                                background = displayBitmap,
                                top = activeEmoji,
                                bottom = stickerText
                            ) { success ->
                                if (success) {
                                    Toast.makeText(context, "Sticker sauvegardé avec succès !", Toast.LENGTH_SHORT).show()
                                }
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = themeProps.accentColor, contentColor = Color.White),
                        shape = RoundedCornerShape(9999.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp)
                    ) {
                        Icon(Icons.Default.Check, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("ENREGISTRER CE STICKER", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                }
            }

            "GIF" -> {
                // GIF SITUATION MODE (With Custom Layout & Parameters)

                item {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = themeProps.cardBackground),
                        shape = RoundedCornerShape(24.dp),
                        border = BorderStroke(1.dp, themeProps.borderColor),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            Text("🎬 Situation GIF Animé", color = themeProps.textColor, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                            Text("Générez et configurez des GIFs de réaction animés basés sur vos humeurs.", color = themeProps.secondaryTextColor, fontSize = 12.sp)

                            HorizontalDivider(color = themeProps.borderColor)

                            // Parameters Panel
                            Text("Paramètres d'édition du GIF :", color = themeProps.textColor, fontWeight = FontWeight.Bold, fontSize = 12.sp)

                            // Active Mood quick-selection
                            Column {
                                Text("Humeur / Catégorie :", color = themeProps.secondaryTextColor, fontSize = 11.sp)
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .horizontalScroll(rememberScrollState())
                                        .padding(vertical = 4.dp),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    listOf("🤣 LOL", "😭 PANIQUE", "😡 COLÈRE", "🕺 DANSE", "😴 SOMMEIL").forEach { mood ->
                                        val isSel = gifMood == mood
                                        Box(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(8.dp))
                                                .background(if (isSel) themeProps.accentColor else themeProps.borderColor)
                                                .clickable {
                                                    gifMood = mood
                                                    val emojiOnly = mood.split(" ").firstOrNull() ?: "🤣"
                                                    viewModel.changeGifMood(emojiOnly)
                                                }
                                                .padding(horizontal = 12.dp, vertical = 6.dp)
                                        ) {
                                            Text(mood, color = if (isSel) Color.White else themeProps.textColor, fontSize = 11.sp)
                                        }
                                    }
                                }
                            }

                            // Playback speed
                            Column {
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text("Vitesse de lecture (FPS) :", color = themeProps.secondaryTextColor, fontSize = 11.sp)
                                    Text("${gifPlaybackSpeed}x", color = themeProps.accentColor, fontSize = 11.sp)
                                }
                                Slider(
                                    value = gifPlaybackSpeed,
                                    onValueChange = { gifPlaybackSpeed = it },
                                    valueRange = 0.5f..3.0f,
                                    colors = SliderDefaults.colors(
                                        thumbColor = themeProps.accentColor,
                                        activeTrackColor = themeProps.accentColor
                                    )
                                )
                            }
                        }
                    }
                }

                // Interactive bouncing GIF visualization preview
                item {
                    val infiniteTransition = rememberInfiniteTransition(label = "gif_bounce")
                    val bounceY by infiniteTransition.animateFloat(
                        initialValue = 0f,
                        targetValue = -30f,
                        animationSpec = infiniteRepeatable(
                            animation = tween(durationMillis = (400 / gifPlaybackSpeed).toInt(), easing = EaseInOutSine),
                            repeatMode = RepeatMode.Reverse
                        ),
                        label = "gif_bounce_val"
                    )

                    Box(
                        modifier = Modifier
                            .size(240.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color.Black)
                            .border(2.dp, themeProps.accentColor, RoundedCornerShape(16.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = activeMood,
                                fontSize = 96.sp,
                                modifier = Modifier.graphicsLayer {
                                    translationY = bounceY
                                }
                            )
                            Spacer(modifier = Modifier.height(10.dp))
                            Text(
                                text = gifQuery.uppercase(),
                                color = themeProps.accentColor,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                textAlign = TextAlign.Center
                            )
                        }
                    }
                }

                // Manual config output panel
                item {
                    AdvancedOutputConfigPanel(viewModel = viewModel, mode = "GIF")
                }

                // Save button
                item {
                    Button(
                        onClick = {
                            viewModel.saveGeneratedMeme(
                                type = "GIF",
                                background = displayBitmap,
                                top = activeMood,
                                bottom = gifQuery
                            ) { success ->
                                if (success) {
                                    Toast.makeText(context, "GIF de situation sauvegardé !", Toast.LENGTH_SHORT).show()
                                }
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = themeProps.accentColor, contentColor = Color.White),
                        shape = RoundedCornerShape(9999.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp)
                    ) {
                        Icon(Icons.Default.Check, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("ENREGISTRER CE GIF", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                }
            }

            "VIDEO" -> {
                // SHORT VIDEO MODE (With Custom Layout & Parameters)

                item {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = themeProps.cardBackground),
                        shape = RoundedCornerShape(24.dp),
                        border = BorderStroke(1.dp, themeProps.borderColor),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            Text("📺 Short Vidéo Animée AI", color = themeProps.textColor, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                            Text("Configurez et prévisualisez des mèmes vidéo au format vertical TikTok avec filtres dynamiques.", color = themeProps.secondaryTextColor, fontSize = 12.sp)

                            HorizontalDivider(color = themeProps.borderColor)

                            // Parameters Panel
                            Text("Paramètres d'édition Vidéo :", color = themeProps.textColor, fontWeight = FontWeight.Bold, fontSize = 12.sp)

                            // Video filter selector
                            Column {
                                Text("Filtre d'effet vidéo actif :", color = themeProps.secondaryTextColor, fontSize = 11.sp)
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .horizontalScroll(rememberScrollState())
                                        .padding(vertical = 4.dp),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    listOf("Cyber Glow", "Retro Wave", "VHS Grain", "Neon Pulse", "Vaporwave").forEach { effect ->
                                        val isSel = videoEffect == effect
                                        Box(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(8.dp))
                                                .background(if (isSel) themeProps.accentColor else themeProps.borderColor)
                                                .clickable { videoEffect = effect }
                                                .padding(horizontal = 12.dp, vertical = 6.dp)
                                        ) {
                                            Text(effect, color = if (isSel) Color.White else themeProps.textColor, fontSize = 11.sp)
                                        }
                                    }
                                }
                            }

                            // Playback / Pause Toggle
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("État du lecteur :", color = themeProps.secondaryTextColor, fontSize = 11.sp)
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Button(
                                        onClick = { isVideoPlaying = !isVideoPlaying },
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = if (isVideoPlaying) themeProps.accentColor else themeProps.borderColor,
                                            contentColor = if (isVideoPlaying) Color.White else themeProps.textColor
                                        ),
                                        shape = RoundedCornerShape(8.dp),
                                        contentPadding = PaddingValues(horizontal = 8.dp),
                                        modifier = Modifier.height(32.dp)
                                    ) {
                                        Text(if (isVideoPlaying) "⏸ PAUSE" else "▶ PLAY", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }
                    }
                }

                // Simulated dynamic video player with glowing filters and bouncing spectrum visualizer
                item {
                    val infiniteTransition = rememberInfiniteTransition(label = "video_spectrum")
                    val waveHeight1 by infiniteTransition.animateFloat(
                        initialValue = 10f,
                        targetValue = 60f,
                        animationSpec = infiniteRepeatable(
                            animation = tween(durationMillis = 300, easing = EaseInOutSine),
                            repeatMode = RepeatMode.Reverse
                        ),
                        label = "wave1"
                    )
                    val waveHeight2 by infiniteTransition.animateFloat(
                        initialValue = 50f,
                        targetValue = 15f,
                        animationSpec = infiniteRepeatable(
                            animation = tween(durationMillis = 200, easing = EaseInOutSine),
                            repeatMode = RepeatMode.Reverse
                        ),
                        label = "wave2"
                    )
                    val waveHeight3 by infiniteTransition.animateFloat(
                        initialValue = 15f,
                        targetValue = 75f,
                        animationSpec = infiniteRepeatable(
                            animation = tween(durationMillis = 250, easing = EaseInOutSine),
                            repeatMode = RepeatMode.Reverse
                        ),
                        label = "wave3"
                    )

                    Box(
                        modifier = Modifier
                            .size(width = 180.dp, height = 320.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color.Black)
                            .border(3.dp, themeProps.accentColor, RoundedCornerShape(16.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        // Simulated glowing video effect overlay
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(
                                    Brush.verticalGradient(
                                        colors = when (videoEffect) {
                                            "Retro Wave" -> listOf(Color(0xFFFF007F).copy(alpha = 0.2f), Color.Transparent)
                                            "VHS Grain" -> listOf(Color.White.copy(alpha = 0.1f), Color.Black.copy(alpha = 0.2f))
                                            "Neon Pulse" -> listOf(Color(0xFF00FFCC).copy(alpha = 0.2f), Color.Transparent)
                                            else -> listOf(themeProps.accentColor.copy(alpha = 0.3f), Color.Transparent)
                                        }
                                    )
                                )
                        )

                        // Title & Subtitle text overlay
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(16.dp),
                            verticalArrangement = Arrangement.SpaceBetween,
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            // Title Top
                            Text(
                                text = videoTitle.uppercase(),
                                color = Color.White,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                textAlign = TextAlign.Center,
                                modifier = Modifier
                                    .background(Color.Black.copy(alpha = 0.5f), RoundedCornerShape(4.dp))
                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                            )

                            // Animated vinyl rotating if playing
                            val rotateTransition = rememberInfiniteTransition(label = "disc_rotate")
                            val rotationAngle by rotateTransition.animateFloat(
                                initialValue = 0f,
                                targetValue = 360f,
                                animationSpec = infiniteRepeatable(
                                    animation = tween(durationMillis = 3000, easing = LinearEasing),
                                    repeatMode = RepeatMode.Restart
                                ),
                                label = "rotate"
                            )

                            Box(
                                modifier = Modifier
                                    .size(80.dp)
                                    .graphicsLayer {
                                        if (isVideoPlaying) {
                                            rotationZ = rotationAngle
                                        }
                                    }
                                    .clip(CircleShape)
                                    .background(Color(0xFF1D1D1D))
                                    .border(2.dp, themeProps.accentColor, CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(24.dp)
                                        .background(Color.Black, CircleShape)
                                )
                                Text("🎵", fontSize = 18.sp)
                            }

                            // Bottom Punchline & Bouncing Spectrum
                            Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text(
                                    text = videoPunchline,
                                    color = Color.Yellow,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    textAlign = TextAlign.Center
                                )

                                // Simulated audio wave lines
                                Row(
                                    modifier = Modifier.height(80.dp),
                                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                                    verticalAlignment = Alignment.Bottom
                                ) {
                                    listOf(waveHeight1, waveHeight2, waveHeight3, waveHeight2, waveHeight1).forEach { heightVal ->
                                        Box(
                                            modifier = Modifier
                                                .width(6.dp)
                                                .height(if (isVideoPlaying) heightVal.dp else 12.dp)
                                                .clip(RoundedCornerShape(9999.dp))
                                                .background(themeProps.accentColor)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                // Advanced output config panel for Video
                item {
                    AdvancedOutputConfigPanel(viewModel = viewModel, mode = "VIDEO")
                }

                // Save button
                item {
                    Button(
                        onClick = {
                            viewModel.saveGeneratedMeme(
                                type = "VIDEO",
                                background = displayBitmap,
                                top = videoTitle,
                                bottom = videoPunchline
                            ) { success ->
                                if (success) {
                                    Toast.makeText(context, "Mème Vidéo court sauvegardé !", Toast.LENGTH_SHORT).show()
                                }
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = themeProps.accentColor, contentColor = Color.White),
                        shape = RoundedCornerShape(9999.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp)
                    ) {
                        Icon(Icons.Default.Check, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("ENREGISTRER CETTE VIDÉO", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                }
            }
        }
    }
}

// ==========================================
// DIRECT IMAGE EDITOR WIDGET
// ==========================================
@Composable
fun DirectImageEditor(
    baseBitmap: Bitmap,
    brightness: Float,
    onBrightnessChange: (Float) -> Unit,
    contrast: Float,
    onContrastChange: (Float) -> Unit,
    selectedFilter: String,
    onFilterChange: (String) -> Unit,
    scribbles: List<Pair<Float, Float>>,
    onScribbleAdded: (Pair<Float, Float>) -> Unit,
    onClearScribbles: () -> Unit,
    scribbleColor: Int,
    onScribbleColorChange: (Int) -> Unit,
    isDrawingMode: Boolean,
    onToggleDrawingMode: (Boolean) -> Unit,
    themeProps: ThemeProperties
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = themeProps.cardBackground),
        shape = RoundedCornerShape(24.dp),
        border = BorderStroke(1.dp, themeProps.borderColor),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "🛠️ Éditeur d'Image en Direct",
                    color = themeProps.textColor,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp
                )
                
                // Clear drawings button
                if (scribbles.isNotEmpty()) {
                    TextButton(onClick = onClearScribbles) {
                        Text("Effacer Dessin", color = Color.Red, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            // Interactive Canvas for Drawing if enabled
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color.Black)
                    .border(1.dp, themeProps.borderColor, RoundedCornerShape(12.dp))
                    .pointerInput(isDrawingMode) {
                        if (isDrawingMode) {
                            detectDragGestures { change, _ ->
                                change.consume()
                                // Convert offset to normalized coordinates (0f to 1f)
                                val x = (change.position.x / size.width).coerceIn(0f, 1f)
                                val y = (change.position.y / size.height).coerceIn(0f, 1f)
                                onScribbleAdded(Pair(x, y))
                            }
                        }
                    },
                contentAlignment = Alignment.Center
            ) {
                // Live Render of the modified image (with filters/brightness/contrast applied but before saving)
                val previewBitmap = remember(baseBitmap, brightness, contrast, selectedFilter, scribbles.size, scribbleColor) {
                    MemeGeneratorUtil.applyBitmapEdits(
                        base = baseBitmap,
                        brightness = brightness,
                        contrast = contrast,
                        filter = selectedFilter,
                        scribbles = scribbles,
                        scribbleColor = scribbleColor
                    )
                }

                Image(
                    bitmap = previewBitmap.asImageBitmap(),
                    contentDescription = "Editing Preview",
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop
                )

                // If drawing mode is disabled, show overlay hint
                if (!isDrawingMode) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(Color.Black.copy(alpha = 0.5f))
                            .clickable { onToggleDrawingMode(true) },
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("✍️ Activer le mode Dessin", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            Text("Dessine avec ton doigt directement sur l'image !", color = Color.LightGray, fontSize = 10.sp)
                        }
                    }
                } else {
                    // indicator that drawing is active
                    Box(
                        modifier = Modifier
                            .align(Alignment.TopStart)
                            .padding(8.dp)
                            .background(Color.Red, RoundedCornerShape(4.dp))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text("MODE DESSIN ACTIF", color = Color.White, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            if (isDrawingMode) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Palette :", color = themeProps.textColor, fontSize = 11.sp)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf(Color.Red, Color.Green, Color.Blue, Color.Yellow, Color.White, Color.Cyan).forEach { c ->
                            val isSelected = scribbleColor == c.toArgb()
                            Box(
                                modifier = Modifier
                                    .size(24.dp)
                                    .clip(CircleShape)
                                    .background(c)
                                    .border(
                                        width = if (isSelected) 2.dp else 0.dp,
                                        color = if (isSelected) Color.White else Color.Transparent,
                                        shape = CircleShape
                                    )
                                    .clickable { onScribbleColorChange(c.toArgb()) }
                            )
                        }
                    }
                    
                    TextButton(onClick = { onToggleDrawingMode(false) }) {
                        Text("Quitter Dessin", color = themeProps.accentColor, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            HorizontalDivider(color = themeProps.borderColor)

            // Brightness slider
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Luminosité", color = themeProps.textColor, fontSize = 12.sp)
                    Text("${(brightness * 100).toInt()}%", color = themeProps.secondaryTextColor, fontSize = 12.sp)
                }
                Slider(
                    value = brightness,
                    onValueChange = onBrightnessChange,
                    valueRange = 0.5f..1.5f,
                    colors = SliderDefaults.colors(
                        thumbColor = themeProps.accentColor,
                        activeTrackColor = themeProps.accentColor
                    )
                )
            }

            // Contrast slider
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Contraste", color = themeProps.textColor, fontSize = 12.sp)
                    Text("${(contrast * 100).toInt()}%", color = themeProps.secondaryTextColor, fontSize = 12.sp)
                }
                Slider(
                    value = contrast,
                    onValueChange = onContrastChange,
                    valueRange = 0.5f..1.5f,
                    colors = SliderDefaults.colors(
                        thumbColor = themeProps.accentColor,
                        activeTrackColor = themeProps.accentColor
                    )
                )
            }

            // Color Filter Row
            Column {
                Text("Filtres d'effets visuels", color = themeProps.textColor, fontSize = 12.sp)
                Spacer(modifier = Modifier.height(6.dp))
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    contentPadding = PaddingValues(vertical = 4.dp)
                ) {
                    val filters = listOf("Original", "Grayscale", "Sepia", "Invert", "Teal Glow", "Amber Glow", "Neon Violet")
                    items(filters) { f ->
                        val isSel = selectedFilter == f
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(12.dp))
                                .background(if (isSel) themeProps.accentColor else themeProps.borderColor)
                                .clickable { onFilterChange(f) }
                                .padding(horizontal = 12.dp, vertical = 6.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = f,
                                color = if (isSel) Color.White else themeProps.textColor,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }
    }
}

// ==========================================
// 4. MEME LIBRARY SCREEN (Saved Shelf)
// ==========================================
@Composable
fun MemeLibraryScreen(viewModel: MemeViewModel) {
    val context = LocalContext.current
    val savedMemes by viewModel.savedMemes.collectAsStateWithLifecycle()
    var selectedMemeForDialog by remember { mutableStateOf<MemeEntity?>(null) }
    var activeFilter by remember { mutableStateOf("TOUT") }

    val filteredMemes = remember(savedMemes, activeFilter) {
        when (activeFilter) {
            "MEME" -> savedMemes.filter { it.type == "TEXT" || it.type == "AUDIO" || it.type == "IMAGE" }
            "STICKER" -> savedMemes.filter { it.type == "STICKER" }
            "GIF" -> savedMemes.filter { it.type == "GIF" }
            "VIDEO" -> savedMemes.filter { it.type == "VIDEO" }
            else -> savedMemes
        }
    }

    if (savedMemes.isEmpty()) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(32.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(
                    imageVector = Icons.Default.Info,
                    contentDescription = null,
                    tint = Color.LightGray,
                    modifier = Modifier.size(64.dp)
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "Aucun mème sauvegardé !",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Laisse libre cours à ton génie comique sous l'un des trois autres onglets !",
                    color = Color.LightGray,
                    fontSize = 13.sp,
                    textAlign = TextAlign.Center
                )
            }
        }
    } else {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            DynamicAIVisualizationCard(
                modeName = "Meme Library Archive",
                subtitle = "Review and share your generated masterpieces"
            )

            // Dynamic filter chips row
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                listOf(
                    "TOUT" to "📁 Tout",
                    "MEME" to "🧠 Mèmes",
                    "STICKER" to "🎨 Stickers",
                    "GIF" to "🎬 GIFs",
                    "VIDEO" to "📺 Vidéos"
                ).forEach { (id, label) ->
                    CustomFilterChip(
                        selected = activeFilter == id,
                        label = label,
                        onClick = { activeFilter = id }
                    )
                }
            }

            Text(
                text = "📁 Tes Mèmes Créés :",
                color = Color.White,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold
            )

            if (filteredMemes.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxWidth().weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Aucun élément de ce type dans ton archive !",
                        color = Color.LightGray,
                        fontSize = 13.sp
                    )
                }
            } else {
                LazyVerticalGrid(
                    columns = GridCells.Fixed(2),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.fillMaxWidth().weight(1f)
                ) {
                    items(filteredMemes) { meme ->
                        MemeLibraryItem(
                            meme = meme,
                            onClick = {
                                selectedMemeForDialog = meme
                            }
                        )
                    }
                }
            }
        }
    }

    // Modal Actions Dialog
    selectedMemeForDialog?.let { meme ->
        AlertDialog(
            onDismissRequest = { selectedMemeForDialog = null },
            title = {
                Text(
                    text = "Menu Actions Mème",
                    color = Color.White,
                    fontWeight = FontWeight.Bold
                )
            },
            text = {
                Column {
                    Text(
                        text = "Type : ${meme.type} | Date de création : ${java.text.DateFormat.getDateTimeInstance().format(meme.timestamp)}",
                        color = Color.LightGray,
                        fontSize = 12.sp
                    )
                    Spacer(modifier = Modifier.height(10.dp))

                    // Tailored Multimedia Rich Preview Inside Dialog
                    when (meme.type) {
                        "STICKER" -> {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 12.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(
                                    modifier = Modifier
                                        .width(130.dp)
                                        .clip(RoundedCornerShape(24.dp))
                                        .background(Color.White)
                                        .border(4.dp, Color(0xFF1D1D1D), RoundedCornerShape(24.dp))
                                        .padding(8.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Text(text = meme.topText ?: "😜", fontSize = 54.sp)
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = (meme.bottomText ?: "STICKER").uppercase(),
                                        color = Color(0xFF1D1D1D),
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.ExtraBold,
                                        textAlign = TextAlign.Center,
                                        lineHeight = 12.sp
                                    )
                                }
                            }
                        }
                        "GIF" -> {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 12.dp)
                                    .background(Color(0xFF1D1D1D), RoundedCornerShape(12.dp))
                                    .border(1.dp, Color(0xFFE5E5E5).copy(alpha = 0.08f), RoundedCornerShape(12.dp))
                                    .padding(8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(
                                        text = "GIF LOOP : \"${meme.topText ?: ""}\"",
                                        color = Color.LightGray,
                                        fontSize = 10.sp,
                                        textAlign = TextAlign.Center
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                    
                                    val infiniteTransition = rememberInfiniteTransition(label = "lib_gif")
                                    val floatOffset by infiniteTransition.animateFloat(
                                        initialValue = -10f,
                                        targetValue = 10f,
                                        animationSpec = infiniteRepeatable(
                                            animation = tween(400, easing = EaseInOutSine),
                                            repeatMode = RepeatMode.Reverse
                                        ),
                                        label = "float"
                                    )
                                    val scale by infiniteTransition.animateFloat(
                                        initialValue = 0.9f,
                                        targetValue = 1.1f,
                                        animationSpec = infiniteRepeatable(
                                            animation = tween(300, easing = EaseInOutBack),
                                            repeatMode = RepeatMode.Reverse
                                        ),
                                        label = "scale"
                                    )
                                    val selectedMood = meme.bottomText ?: "LOL"
                                    Box(
                                        modifier = Modifier
                                            .size(80.dp)
                                            .graphicsLayer(
                                                translationY = if (selectedMood == "LOL" || selectedMood == "DANSE") floatOffset else 0f,
                                                scaleX = if (selectedMood == "PANIQUE" || selectedMood == "COLÈRE") scale else 1f,
                                                scaleY = if (selectedMood == "PANIQUE" || selectedMood == "COLÈRE") scale else 1f
                                            ),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        when (selectedMood) {
                                            "LOL" -> Text("😂", fontSize = 50.sp)
                                            "PANIQUE" -> Text("😱", fontSize = 50.sp)
                                            "COLÈRE" -> Text("😡", fontSize = 50.sp)
                                            "DANSE" -> Text("🕺", fontSize = 50.sp)
                                            else -> Text("😜", fontSize = 50.sp)
                                        }
                                    }
                                }
                            }
                        }
                        "VIDEO" -> {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(180.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(Color(0xFF1D1D1D))
                                    .border(1.dp, Color(0xFFE5E5E5).copy(alpha = 0.08f), RoundedCornerShape(12.dp))
                                    .padding(12.dp)
                            ) {
                                val infiniteTransition = rememberInfiniteTransition(label = "lib_video")
                                val scaleAnim by infiniteTransition.animateFloat(
                                    initialValue = 1.0f,
                                    targetValue = 1.12f,
                                    animationSpec = infiniteRepeatable(
                                        animation = tween(450, easing = EaseInOutSine),
                                        repeatMode = RepeatMode.Reverse
                                    ),
                                    label = "caption"
                                )
                                Column(
                                    modifier = Modifier.fillMaxSize(),
                                    verticalArrangement = Arrangement.Center,
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .background(Color(0xFF1D1D1D), RoundedCornerShape(6.dp))
                                            .border(1.dp, Color(0xFFE5E5E5).copy(alpha = 0.3f), RoundedCornerShape(6.dp))
                                            .padding(horizontal = 6.dp, vertical = 2.dp)
                                    ) {
                                        Text(
                                            text = (meme.topText ?: "SHORT VIDEO").uppercase(),
                                            color = Color(0xFFE5E5E5),
                                            fontSize = 10.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                    Spacer(modifier = Modifier.height(12.dp))
                                    Text(
                                        text = meme.bottomText ?: "",
                                        color = Color.White,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        textAlign = TextAlign.Center,
                                        modifier = Modifier
                                            .graphicsLayer(scaleX = scaleAnim, scaleY = scaleAnim)
                                            .padding(horizontal = 8.dp)
                                    )
                                }
                            }
                        }
                        else -> {
                            // Standard Meme preview
                            if (meme.imagePath != null) {
                                AsyncImage(
                                    model = File(meme.imagePath),
                                    contentDescription = "Meme Preview",
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(150.dp)
                                        .clip(RoundedCornerShape(8.dp))
                                        .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(8.dp)),
                                    contentScale = ContentScale.Fit
                                )
                                Spacer(modifier = Modifier.height(10.dp))
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = "Qu'aimerais-tu faire de ton chef-d'œuvre ?",
                        color = Color.White,
                        fontSize = 14.sp
                    )
                }
            },
            confirmButton = {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    // Bouton Partager
                    Button(
                        onClick = {
                            selectedMemeForDialog = null
                            shareSavedMemeFile(context, meme.imagePath)
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = Color(0xFF0A0A0A)),
                        shape = RoundedCornerShape(9999.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Share, contentDescription = null, modifier = Modifier.size(16.dp), tint = Color(0xFF0A0A0A))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Partager", color = Color(0xFF0A0A0A), fontWeight = FontWeight.Bold)
                        }
                    }

                    // Bouton Supprimer
                    Button(
                        onClick = {
                            selectedMemeForDialog = null
                            viewModel.deleteMeme(meme)
                            Toast.makeText(context, "Mème effacé de l'archive.", Toast.LENGTH_SHORT).show()
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444), contentColor = Color.White),
                        shape = RoundedCornerShape(9999.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Delete, contentDescription = null, modifier = Modifier.size(16.dp), tint = Color.White)
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Supprimer", color = Color.White, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            },
            dismissButton = {
                TextButton(onClick = { selectedMemeForDialog = null }) {
                    Text("FERMER", color = Color.LightGray)
                }
            },
            containerColor = Color(0xFF1D1D1D)
        )
    }
}

// ==========================================
// GLOBAL CONFIGURATION SYSTEM & LOCALIZATION
// ==========================================
data class ThemeProperties(
    val baseColor: Color,
    val washColors: List<Color>,
    val spotlightColor: Color,
    val accentColor: Color,
    val isDark: Boolean = true
) {
    val textColor = if (isDark) Color.White else Color(0xFF0F172A)
    val secondaryTextColor = if (isDark) Color(0xFFC2C2C2) else Color(0xFF475569)
    val cardBackground = if (isDark) Color(0xFF1D1D1D).copy(alpha = 0.85f) else Color.White.copy(alpha = 0.95f)
    val borderColor = if (isDark) Color.White.copy(alpha = 0.08f) else Color.Black.copy(alpha = 0.12f)
}

fun getThemeProperties(themeName: String): ThemeProperties {
    return when (themeName) {
        "Cosmic Slate" -> ThemeProperties(
            baseColor = Color(0xFF0E1214),
            washColors = listOf(
                Color(0xFF1E293B).copy(alpha = 0.3f),
                Color(0xFF0F172A).copy(alpha = 0.2f),
                Color(0xFF10B981).copy(alpha = 0.1f)
            ),
            spotlightColor = Color(0xFF10B981),
            accentColor = Color(0xFF10B981)
        )
        "Cyber Neon" -> ThemeProperties(
            baseColor = Color(0xFF000000),
            washColors = listOf(
                Color(0xFF1E102F).copy(alpha = 0.35f),
                Color(0xFF0A1520).copy(alpha = 0.25f),
                Color(0xFF000000)
            ),
            spotlightColor = Color(0xFF00FFCC),
            accentColor = Color(0xFF00FFCC)
        )
        "Rose Gold" -> ThemeProperties(
            baseColor = Color(0xFF120E11),
            washColors = listOf(
                Color(0xFF2E1B24).copy(alpha = 0.3f),
                Color(0xFF22151B).copy(alpha = 0.2f),
                Color(0xFFFDA4AF).copy(alpha = 0.1f)
            ),
            spotlightColor = Color(0xFFFDA4AF),
            accentColor = Color(0xFFFDA4AF)
        )
        "Solar Eclipse" -> ThemeProperties(
            baseColor = Color(0xFF140F08),
            washColors = listOf(
                Color(0xFF2A1905).copy(alpha = 0.35f),
                Color(0xFF1E1102).copy(alpha = 0.25f),
                Color(0xFFFBBF24).copy(alpha = 0.1f)
            ),
            spotlightColor = Color(0xFFFBBF24),
            accentColor = Color(0xFFFBBF24)
        )
        "Pure Light" -> ThemeProperties(
            baseColor = Color(0xFFF1F5F9),
            washColors = listOf(
                Color(0xFFE2E8F0).copy(alpha = 0.6f),
                Color(0xFFCBD5E1).copy(alpha = 0.5f),
                Color(0xFF3B82F6).copy(alpha = 0.08f)
            ),
            spotlightColor = Color(0xFF3B82F6),
            accentColor = Color(0xFF3B82F6),
            isDark = false
        )
        else -> ThemeProperties( // "Dark Void" default
            baseColor = Color(0xFF0A0A0A),
            washColors = listOf(
                Color(0xFF4867AF).copy(alpha = 0.25f),
                Color(0xFF9CAFB8).copy(alpha = 0.15f),
                Color(0xFFC49577).copy(alpha = 0.15f)
            ),
            spotlightColor = Color(0xFF6B62F2),
            accentColor = Color(0xFF6B62F2)
        )
    }
}

@Composable
fun translate(key: String, language: String): String {
    val dictionary = mapOf(
        "FR" to mapOf(
            "settings_title" to "Configuration Globale",
            "settings_subtitle" to "Personnalise ton expérience MemeGen AI",
            "lang_label" to "Langue de l'application",
            "edition_label" to "Mode d'Édition Actif",
            "theme_label" to "Thème Visuel",
            "others_label" to "Autres Préférences",
            "safe_search" to "Filtre Contenu Gemini (IA)",
            "sound_fx" to "Sons & Retours Tactiles",
            "autoplay" to "Lecture Auto (TikTok GIFs)",
            "active_badge" to "Licence Active",
            "desc_title" to "Mème Studio",
            "save_success" to "Enregistré avec succès !",
            "tab_text" to "Texte",
            "tab_audio" to "Vocal",
            "tab_photo" to "Photo",
            "tab_archive" to "Archive",
            "tab_settings" to "Réglages",
            "current_badge" to "Édition active"
        ),
        "EN" to mapOf(
            "settings_title" to "Global Settings",
            "settings_subtitle" to "Customize your MemeGen AI experience",
            "lang_label" to "App Language",
            "edition_label" to "Active App Edition",
            "theme_label" to "Visual Theme",
            "others_label" to "Other Preferences",
            "safe_search" to "Gemini Content Safe Search (AI)",
            "sound_fx" to "Sound FX & Haptic Feedback",
            "autoplay" to "Autoplay (TikTok GIFs)",
            "active_badge" to "Active License",
            "desc_title" to "Meme Studio",
            "save_success" to "Saved successfully!",
            "tab_text" to "Text",
            "tab_audio" to "Voice",
            "tab_photo" to "Photo",
            "tab_archive" to "Archive",
            "tab_settings" to "Settings",
            "current_badge" to "Active Edition"
        ),
        "ES" to mapOf(
            "settings_title" to "Configuración Global",
            "settings_subtitle" to "Personaliza tu experiencia de MemeGen AI",
            "lang_label" to "Idioma de la aplicación",
            "edition_label" to "Edición de aplicación activa",
            "theme_label" to "Tema Visual",
            "others_label" to "Otras Preferencias",
            "safe_search" to "Búsqueda segura de Gemini (IA)",
            "sound_fx" to "Efectos de sonido y vibración",
            "autoplay" to "Reproducción automática (GIFs TikTok)",
            "active_badge" to "Licencia Activa",
            "desc_title" to "Estudio de Memes",
            "save_success" to "Guardado exitosamente!",
            "tab_text" to "Texto",
            "tab_audio" to "Voz",
            "tab_photo" to "Foto",
            "tab_archive" to "Archivo",
            "tab_settings" to "Ajustes",
            "current_badge" to "Edición activa"
        )
    )
    return dictionary[language]?.get(key) ?: key
}

@Composable
fun SettingsScreen(viewModel: MemeViewModel) {
    val language by viewModel.currentLanguage.collectAsStateWithLifecycle()
    val edition by viewModel.currentEdition.collectAsStateWithLifecycle()
    val themeName by viewModel.currentTheme.collectAsStateWithLifecycle()
    val safeSearch by viewModel.isSafeSearchEnabled.collectAsStateWithLifecycle()
    val soundEnabled by viewModel.isSoundEnabled.collectAsStateWithLifecycle()
    val themeProps = getThemeProperties(themeName)

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        contentPadding = PaddingValues(bottom = 32.dp)
    ) {
        // Welcome and intro
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = themeProps.cardBackground),
                shape = RoundedCornerShape(24.dp),
                border = BorderStroke(1.dp, themeProps.borderColor),
                modifier = Modifier.fillMaxWidth().padding(top = 8.dp)
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(56.dp)
                            .background(themeProps.accentColor.copy(alpha = 0.15f), CircleShape)
                            .border(1.dp, themeProps.accentColor.copy(alpha = 0.3f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("⚙️", fontSize = 28.sp)
                    }
                    Column {
                        Text(
                            text = translate("settings_title", language),
                            color = themeProps.textColor,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = translate("settings_subtitle", language),
                            color = themeProps.secondaryTextColor,
                            fontSize = 12.sp
                        )
                    }
                }
            }
        }

        // 1. App Language Section
        item {
            Text(
                text = "🌐  " + translate("lang_label", language).uppercase(),
                color = themeProps.textColor.copy(alpha = 0.6f),
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp,
                modifier = Modifier.padding(start = 8.dp, top = 8.dp)
            )
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(9999.dp))
                    .background(themeProps.cardBackground)
                    .border(1.dp, themeProps.borderColor, RoundedCornerShape(9999.dp))
                    .padding(4.dp),
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                listOf(
                    "FR" to "FR",
                    "EN" to "EN",
                    "ES" to "ES"
                ).forEach { (langCode, labelStr) ->
                    val isSelected = language == langCode
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(9999.dp))
                            .background(if (isSelected) themeProps.accentColor else Color.Transparent)
                            .clickable { viewModel.setLanguage(langCode) }
                            .padding(vertical = 10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = labelStr,
                            color = if (isSelected) Color.White else themeProps.secondaryTextColor,
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp
                        )
                    }
                }
            }
        }

        // 2. Active Edition Section
        item {
            Text(
                text = "🎖️  " + translate("edition_label", language).uppercase(),
                color = themeProps.textColor.copy(alpha = 0.6f),
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp,
                modifier = Modifier.padding(start = 8.dp, top = 8.dp)
            )
            Spacer(modifier = Modifier.height(8.dp))
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(24.dp))
                    .background(themeProps.cardBackground)
                    .border(1.dp, themeProps.borderColor, RoundedCornerShape(24.dp))
                    .padding(12.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                val editionsList = listOf("Standard", "Pro", "Enterprise", "Developer")
                editionsList.forEach { edName ->
                    val isSelected = edition == edName
                    val badgeColor = when (edName) {
                        "Pro" -> Color(0xFF38BDF8)       // Cyan-Sky Blue
                        "Enterprise" -> Color(0xFFFBBF24) // Gold
                        "Developer" -> Color(0xFFA855F7)  // Purple/Neon
                        else -> Color(0xFF94A3B8)         // Slate/Standard
                    }
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .background(if (isSelected) themeProps.accentColor.copy(alpha = 0.12f) else Color.Transparent)
                            .clickable { viewModel.setEdition(edName) }
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            RadioButton(
                                selected = isSelected,
                                onClick = { viewModel.setEdition(edName) },
                                colors = RadioButtonDefaults.colors(
                                    selectedColor = badgeColor,
                                    unselectedColor = themeProps.textColor.copy(alpha = 0.3f)
                                )
                            )
                            Column {
                                Text(
                                    text = edName,
                                    color = themeProps.textColor,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp
                                )
                                Text(
                                    text = when (edName) {
                                        "Pro" -> "Génération illimitée, formats HD"
                                        "Enterprise" -> "Partages collaboratifs & exports"
                                        "Developer" -> "Console debug & logs IA Gemini"
                                        else -> "Outils standards et mèmes"
                                    },
                                    color = themeProps.secondaryTextColor,
                                    fontSize = 11.sp
                                )
                            }
                        }
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(badgeColor.copy(alpha = 0.15f))
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = if (isSelected) "ACTIVE" else "SELECT",
                                color = badgeColor,
                                fontWeight = FontWeight.Bold,
                                fontSize = 9.sp
                            )
                        }
                    }
                }
            }
        }

        // 3. Visual Themes Section
        item {
            Text(
                text = "🎨  " + translate("theme_label", language).uppercase(),
                color = themeProps.textColor.copy(alpha = 0.6f),
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp,
                modifier = Modifier.padding(start = 8.dp, top = 8.dp)
            )
            Spacer(modifier = Modifier.height(8.dp))
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(24.dp))
                    .background(themeProps.cardBackground)
                    .border(1.dp, themeProps.borderColor, RoundedCornerShape(24.dp))
                    .padding(12.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                val themesList = listOf("Dark Void", "Cosmic Slate", "Cyber Neon", "Rose Gold", "Solar Eclipse", "Pure Light")
                themesList.forEach { thName ->
                    val isSelected = themeName == thName
                    val otherThemeProps = getThemeProperties(thName)
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .background(if (isSelected) themeProps.accentColor.copy(alpha = 0.12f) else Color.Transparent)
                            .clickable { viewModel.setTheme(thName) }
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            // Spotlight preview dot
                            Box(
                                modifier = Modifier
                                    .size(16.dp)
                                    .background(otherThemeProps.spotlightColor, CircleShape)
                                    .border(1.dp, themeProps.textColor.copy(alpha = 0.3f), CircleShape)
                            )
                            Text(
                                text = thName,
                                color = themeProps.textColor,
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp
                            )
                        }
                        if (isSelected) {
                            Icon(
                                imageVector = Icons.Default.Check,
                                contentDescription = "Active",
                                tint = otherThemeProps.accentColor,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }
                }
            }
        }

        // 4. Other Preferences Card
        item {
            Text(
                text = "⚙️  " + translate("others_label", language).uppercase(),
                color = themeProps.textColor.copy(alpha = 0.6f),
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp,
                modifier = Modifier.padding(start = 8.dp, top = 8.dp)
            )
            Spacer(modifier = Modifier.height(8.dp))
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(24.dp))
                    .background(themeProps.cardBackground)
                    .border(1.dp, themeProps.borderColor, RoundedCornerShape(24.dp))
                    .padding(12.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Safe Search Switch Row
                Row(
                    modifier = Modifier.fillMaxWidth().padding(8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = translate("safe_search", language),
                            color = themeProps.textColor,
                            fontWeight = FontWeight.Medium,
                            fontSize = 13.sp
                        )
                        Text(
                            text = "Filtre proactif des contenus offensants",
                            color = themeProps.secondaryTextColor,
                            fontSize = 11.sp
                        )
                    }
                    Switch(
                        checked = safeSearch,
                        onCheckedChange = { viewModel.setSafeSearch(it) },
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = Color.White,
                            checkedTrackColor = themeProps.accentColor
                        )
                    )
                }

                Box(modifier = Modifier.fillMaxWidth().height(1.dp).background(themeProps.borderColor))

                // Sound effects
                Row(
                    modifier = Modifier.fillMaxWidth().padding(8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = translate("sound_fx", language),
                            color = themeProps.textColor,
                            fontWeight = FontWeight.Medium,
                            fontSize = 13.sp
                        )
                        Text(
                            text = "Retour haptic et alertes audio",
                            color = themeProps.secondaryTextColor,
                            fontSize = 11.sp
                        )
                    }
                    Switch(
                        checked = soundEnabled,
                        onCheckedChange = { viewModel.setSoundEnabled(it) },
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = Color.White,
                            checkedTrackColor = themeProps.accentColor
                        )
                    )
                }
            }
        }
    }
}

@Composable
fun AdvancedOutputConfigPanel(viewModel: MemeViewModel, mode: String) {
    val emojis by viewModel.readyToUseEmojis.collectAsStateWithLifecycle()
    
    var newEmojiInput by remember { mutableStateOf("") }
    var selectedEmojiToEdit by remember { mutableStateOf<String?>(null) }
    var editEmojiInput by remember { mutableStateOf("") }
    
    val stickerText by viewModel.stickerText.collectAsStateWithLifecycle()
    val gifQuery by viewModel.gifQuery.collectAsStateWithLifecycle()
    val videoTitle by viewModel.videoTitle.collectAsStateWithLifecycle()
    val videoPunchline by viewModel.videoPunchline.collectAsStateWithLifecycle()

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(Color.White.copy(alpha = 0.04f))
            .border(1.dp, Color.White.copy(alpha = 0.08f), RoundedCornerShape(16.dp))
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "⚙️ Configuration Manuelle & Éléments",
                color = Color.White,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold
            )
            TextButton(
                onClick = {
                    when (mode) {
                        "STICKER" -> viewModel.clearStickerOutput()
                        "GIF" -> viewModel.clearGifOutput()
                        "VIDEO" -> viewModel.clearVideoOutput()
                    }
                },
                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp),
                modifier = Modifier.height(28.dp)
            ) {
                Icon(Icons.Default.Delete, contentDescription = null, modifier = Modifier.size(12.dp), tint = Color(0xFFEF4444))
                Spacer(modifier = Modifier.width(4.dp))
                Text("Vider Sortie", color = Color(0xFFEF4444), fontSize = 10.sp, fontWeight = FontWeight.Bold)
            }
        }

        Text("✨ Éléments prêts à être utilisés (Tap pour insérer) :", color = Color.Gray, fontSize = 10.sp, fontWeight = FontWeight.Bold)
        
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(vertical = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            emojis.forEach { emo ->
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.08f))
                        .border(1.dp, Color.White.copy(alpha = 0.15f), CircleShape)
                        .clickable {
                            when (mode) {
                                "STICKER" -> viewModel.changeStickerEmoji(emo)
                                "GIF" -> viewModel.changeGifMood(emo)
                                "VIDEO" -> viewModel.generateVideoFromContext(emo)
                            }
                        },
                    contentAlignment = Alignment.Center
                ) {
                    Text(emo, fontSize = 18.sp)
                }
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedTextField(
                value = newEmojiInput,
                onValueChange = { newEmojiInput = it },
                placeholder = { Text("Nouveau...", fontSize = 11.sp, color = Color.Gray) },
                singleLine = true,
                modifier = Modifier
                    .weight(1f)
                    .height(44.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Color.White.copy(alpha = 0.3f),
                    unfocusedBorderColor = Color.White.copy(alpha = 0.1f),
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White
                )
            )

            Button(
                onClick = {
                    if (newEmojiInput.isNotBlank()) {
                        viewModel.addReadyToUseEmoji(newEmojiInput)
                        newEmojiInput = ""
                    }
                },
                shape = RoundedCornerShape(8.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = Color.Black),
                contentPadding = PaddingValues(horizontal = 8.dp),
                modifier = Modifier.height(36.dp)
            ) {
                Text("+ Ajouter", fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Éditer :", color = Color.Gray, fontSize = 10.sp)
            
            Row(
                modifier = Modifier
                    .weight(1f)
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                emojis.forEach { emo ->
                    val isSelectedToEdit = selectedEmojiToEdit == emo
                    Box(
                        modifier = Modifier
                            .size(28.dp)
                            .clip(RoundedCornerShape(6.dp))
                            .background(if (isSelectedToEdit) Color.White.copy(alpha = 0.2f) else Color.Transparent)
                            .clickable {
                                selectedEmojiToEdit = emo
                                editEmojiInput = emo
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Text(emo, fontSize = 14.sp)
                    }
                }
            }
        }

        selectedEmojiToEdit?.let { emoToManage ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedTextField(
                    value = editEmojiInput,
                    onValueChange = { editEmojiInput = it },
                    singleLine = true,
                    modifier = Modifier
                        .weight(1f)
                        .height(44.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Color.White.copy(alpha = 0.3f),
                        unfocusedBorderColor = Color.White.copy(alpha = 0.1f),
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    )
                )

                Button(
                    onClick = {
                        if (editEmojiInput.isNotBlank()) {
                            viewModel.editReadyToUseEmoji(emoToManage, editEmojiInput)
                            selectedEmojiToEdit = null
                        }
                    },
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(alpha = 0.1f), contentColor = Color.White),
                    contentPadding = PaddingValues(horizontal = 8.dp),
                    modifier = Modifier.height(36.dp)
                ) {
                    Text("Modifier", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                }

                Button(
                    onClick = {
                        viewModel.deleteReadyToUseEmoji(emoToManage)
                        selectedEmojiToEdit = null
                    },
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444).copy(alpha = 0.15f), contentColor = Color(0xFFEF4444)),
                    contentPadding = PaddingValues(horizontal = 8.dp),
                    modifier = Modifier.height(36.dp)
                ) {
                    Text("Effacer", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        Text("✏️ Édition directe de la sortie :", color = Color.Gray, fontSize = 10.sp, fontWeight = FontWeight.Bold)
        when (mode) {
            "STICKER" -> {
                OutlinedTextField(
                    value = stickerText,
                    onValueChange = { viewModel.changeStickerText(it) },
                    label = { Text("Modifier le slogan du Sticker", fontSize = 10.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Color.White.copy(alpha = 0.3f),
                        unfocusedBorderColor = Color.White.copy(alpha = 0.1f),
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    )
                )
            }
            "GIF" -> {
                OutlinedTextField(
                    value = gifQuery,
                    onValueChange = { viewModel.generateGifFromContext(it) },
                    label = { Text("Recherche de situation", fontSize = 10.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Color.White.copy(alpha = 0.3f),
                        unfocusedBorderColor = Color.White.copy(alpha = 0.1f),
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    )
                )
            }
            "VIDEO" -> {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = videoTitle,
                        onValueChange = { viewModel.generateVideoFromContext(it) },
                        label = { Text("Modifier le titre", fontSize = 10.sp) },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = Color.White.copy(alpha = 0.3f),
                            unfocusedBorderColor = Color.White.copy(alpha = 0.1f),
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White
                        )
                    )
                    OutlinedTextField(
                        value = videoPunchline,
                        onValueChange = { viewModel.generateVideoFromContext(it) },
                        label = { Text("Modifier la punchline", fontSize = 10.sp) },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = Color.White.copy(alpha = 0.3f),
                            unfocusedBorderColor = Color.White.copy(alpha = 0.1f),
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White
                        )
                    )
                }
            }
        }
    }
}

@Composable
fun MemeLibraryItem(meme: MemeEntity, onClick: () -> Unit) {
    Card(
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1D1D1D).copy(alpha = 0.85f)),
        shape = RoundedCornerShape(24.dp),
        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.08f)),
        modifier = Modifier
            .fillMaxWidth()
            .aspectRatio(0.9f)
            .clickable { onClick() }
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
            // Affichage de l'image locale enregistrée
            if (meme.imagePath != null) {
                AsyncImage(
                    model = File(meme.imagePath),
                    contentDescription = "Meme Image",
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop
                )
            } else {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color(0xFF1D1D1D)),
                    contentAlignment = Alignment.Center
                ) {
                    Text("Pas d'image", color = Color(0xFFC2C2C2))
                }
            }

            // Badge du type
            Box(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(8.dp)
                    .background(
                        color = Color.White.copy(alpha = 0.85f),
                        shape = RoundedCornerShape(9999.dp)
                    )
                    .padding(horizontal = 8.dp, vertical = 4.dp)
            ) {
                Text(
                    text = meme.type,
                    color = Color(0xFF0A0A0A),
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

// Global share launcher action (renders and shares directly)
fun shareMemeAction(context: Context, bgBitmap: Bitmap, topText: String, bottomText: String) {
    try {
        val compiled = MemeGeneratorUtil.createMeme(bgBitmap, topText, bottomText)
        val path = MemeGeneratorUtil.saveMemeToFile(context, compiled)
        if (path != null) {
            shareSavedMemeFile(context, path)
        } else {
            Toast.makeText(context, "Échec du rendu pour partage", Toast.LENGTH_SHORT).show()
        }
    } catch (e: Exception) {
        Toast.makeText(context, "Erreur durant le partage", Toast.LENGTH_SHORT).show()
        e.printStackTrace()
    }
}

// Share file from local physical storage
fun shareSavedMemeFile(context: Context, filePath: String?) {
    if (filePath == null) return
    try {
        val file = File(filePath)
        val uri: Uri = FileProvider.getUriForFile(
            context,
            "${context.packageName}.fileprovider",
            file
        )
        val shareIntent = Intent(Intent.ACTION_SEND).apply {
            type = "image/png"
            putExtra(Intent.EXTRA_STREAM, uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        context.startActivity(Intent.createChooser(shareIntent, "Partager le Meme"))
    } catch (e: Exception) {
        Toast.makeText(context, "Erreur de partage du mème", Toast.LENGTH_SHORT).show()
        e.printStackTrace()
    }
}

// ============================================================================
// 5. ONBOARDING SPLASH SCREEN, LOADING SCREEN & LAUNCH ANIMATIONS
// ============================================================================
data class FloatingEmoji(
    val emoji: String,
    val xOffset: androidx.compose.ui.unit.Dp,
    val yOffset: androidx.compose.ui.unit.Dp,
    val size: androidx.compose.ui.unit.TextUnit,
    val initialRotation: Float,
    val rotationSpeed: Int,
    val scaleMultiplier: Float = 1.0f
)

@Composable
fun FloatingEmojiItem(item: FloatingEmoji) {
    val infiniteTransition = rememberInfiniteTransition(label = item.emoji)
    
    val rotation by infiniteTransition.animateFloat(
        initialValue = item.initialRotation - 12f,
        targetValue = item.initialRotation + 12f,
        animationSpec = infiniteRepeatable(
            animation = tween(item.rotationSpeed, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse
        ),
        label = "rotation"
    )

    val translationY by infiniteTransition.animateFloat(
        initialValue = -12f,
        targetValue = 12f,
        animationSpec = infiniteRepeatable(
            animation = tween(item.rotationSpeed + 200, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse
        ),
        label = "translationY"
    )

    val scale by infiniteTransition.animateFloat(
        initialValue = 0.92f,
        targetValue = 1.08f,
        animationSpec = infiniteRepeatable(
            animation = tween(item.rotationSpeed - 150, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scale"
    )

    Box(
        modifier = Modifier
            .offset(x = item.xOffset, y = item.yOffset + translationY.dp)
            .graphicsLayer(
                rotationZ = rotation,
                scaleX = scale * item.scaleMultiplier,
                scaleY = scale * item.scaleMultiplier
            )
            .clip(RoundedCornerShape(9999.dp)) // Glassmorphic pill shape
            .background(Color(0xFF1D1D1D).copy(alpha = 0.35f)) // Translucent Char surface
            .border(1.dp, Color(0xFFE5E5E5).copy(alpha = 0.08f), RoundedCornerShape(9999.dp))
            .padding(horizontal = 8.dp, vertical = 6.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(text = item.emoji, fontSize = item.size)
    }
}

@Composable
fun MemeSplashScreen(onEnter: () -> Unit) {
    val infiniteTransition = rememberInfiniteTransition(label = "SplashAnim")
    
    val scale by infiniteTransition.animateFloat(
        initialValue = 0.95f,
        targetValue = 1.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse
        ),
        label = "LogoScale"
    )

    val offsetY by infiniteTransition.animateFloat(
        initialValue = -10f,
        targetValue = 10f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse
        ),
        label = "FloatY"
    )

    val animatedButtonScale by infiniteTransition.animateFloat(
        initialValue = 1.0f,
        targetValue = 1.04f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse
        ),
        label = "ButtonScale"
    )

    // Pre-dawn wash background (Dimension palette: navy blue -> slate -> earth tone)
    val dawnWashBrush = Brush.verticalGradient(
        colors = listOf(
            Color(0xFF4867AF), // rgb(72,103,175)
            Color(0xFF9CAFB8), // rgb(156,175,184)
            Color(0xFFC49577)  // rgb(196,149,119)
        )
    )

    val radialSpotlightBrush = Brush.radialGradient(
        colors = listOf(
            Color(0xFF6B62F2).copy(alpha = 0.5f), // Indigo Haze
            Color.Transparent
        )
    )

    // Rich cloud of background stickers/emojis (much bigger!)
    val backgroundEmojis = remember {
        listOf(
            FloatingEmoji("😂", (-130).dp, (-280).dp, 56.sp, 15f, 1800),
            FloatingEmoji("😱", 130.dp, (-260).dp, 64.sp, -20f, 2200),
            FloatingEmoji("😡", (-140).dp, (-160).dp, 48.sp, 10f, 2000),
            FloatingEmoji("🕺", 140.dp, (-140).dp, 68.sp, -15f, 2500),
            FloatingEmoji("💀", (-150).dp, 100.dp, 60.sp, 25f, 1900),
            FloatingEmoji("🔥", 150.dp, 110.dp, 56.sp, -30f, 1700),
            FloatingEmoji("🤔", (-120).dp, 250.dp, 52.sp, -12f, 2400),
            FloatingEmoji("🤡", 120.dp, 240.dp, 60.sp, 18f, 2100),
            FloatingEmoji("🤖", (-140).dp, (-50).dp, 50.sp, -5f, 2300),
            FloatingEmoji("🚀", 140.dp, (-20).dp, 64.sp, 45f, 1600),
            FloatingEmoji("👀", (-70).dp, (-320).dp, 48.sp, -18f, 2000),
            FloatingEmoji("🎉", 70.dp, (-310).dp, 52.sp, 25f, 2100),
            FloatingEmoji("🤦", (-80).dp, 310.dp, 56.sp, 30f, 2300),
            FloatingEmoji("🤫", 80.dp, 310.dp, 50.sp, -15f, 2200),
            FloatingEmoji("🤯", (-50).dp, 190.dp, 64.sp, 10f, 1800),
            FloatingEmoji("👾", 50.dp, (-200).dp, 52.sp, -8f, 1900),
            FloatingEmoji("💩", (-150).dp, 180.dp, 50.sp, -25f, 2000),
            FloatingEmoji("🍕", 150.dp, 180.dp, 52.sp, 12f, 2400),
            FloatingEmoji("😜", (-60).dp, (-110).dp, 48.sp, 35f, 2200),
            FloatingEmoji("😎", 60.dp, (-90).dp, 52.sp, -45f, 2100),
            FloatingEmoji("✨", (-90).dp, 30.dp, 44.sp, 15f, 1700),
            FloatingEmoji("🎨", 90.dp, 40.dp, 48.sp, -25f, 2000),
            FloatingEmoji("📺", (-30).dp, (-240).dp, 44.sp, 5f, 2300),
            FloatingEmoji("🎬", 40.dp, 130.dp, 50.sp, -10f, 2200)
        )
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(dawnWashBrush),
        contentAlignment = Alignment.Center
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(radialSpotlightBrush)
        )

        backgroundEmojis.forEach { emojiInfo ->
            FloatingEmojiItem(item = emojiInfo)
        }

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(200.dp)
                    .graphicsLayer(
                        scaleX = scale,
                        scaleY = scale,
                        translationY = offsetY
                    ),
                contentAlignment = Alignment.Center
            ) {
                Box(
                    modifier = Modifier
                        .size(150.dp)
                        .background(
                            Brush.linearGradient(
                                colors = listOf(Color(0xFFE5E5E5).copy(alpha = 0.2f), Color(0xFF6B62F2).copy(alpha = 0.2f))
                            ),
                            CircleShape
                        )
                )

                Box(
                    modifier = Modifier
                        .size(130.dp)
                        .clip(CircleShape)
                        .background(Color(0xFF1D1D1D).copy(alpha = 0.85f)) // Char glass mockup surface
                        .border(1.dp, Color(0xFFE5E5E5).copy(alpha = 0.15f), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Text("😜", fontSize = 72.sp)
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Glassmorphic text legibility container with excellent contrast
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0F0F11).copy(alpha = 0.85f)),
                shape = RoundedCornerShape(24.dp),
                border = BorderStroke(1.dp, Color.White.copy(alpha = 0.12f)),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 4.dp)
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text(
                        text = "MemeGen AI",
                        color = Color.White,
                        fontSize = 38.sp,
                        fontWeight = FontWeight.ExtraBold,
                        letterSpacing = (-1.5).sp,
                        textAlign = TextAlign.Center
                    )

                    Text(
                        text = "Crée des Mèmes, Stickers, GIFs de situation & courtes Vidéos Animées instantanément avec l'intelligence de Gemini 3.5 !",
                        color = Color(0xFFE5E5E5), // Perfect legibility contrast
                        fontSize = 14.sp,
                        textAlign = TextAlign.Center,
                        lineHeight = 22.sp,
                        modifier = Modifier.padding(horizontal = 4.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            Button(
                onClick = onEnter,
                shape = RoundedCornerShape(9999.dp), // 9999px radius
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color.White, // Paper action fill
                    contentColor = Color(0xFF0A0A0A) // Void text color
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
                    .graphicsLayer(scaleX = animatedButtonScale, scaleY = animatedButtonScale)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    Text(
                        text = "DÉBUTER L'EXPÉRIENCE",
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "→",
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                }
            }
        }
    }
}

@Composable
fun MemeWelcomeLoadingScreen(onComplete: () -> Unit) {
    var progress by remember { mutableStateOf(0f) }
    
    LaunchedEffect(Unit) {
        val duration = 3000f // 3 seconds
        val stepTime = 30L
        val steps = (duration / stepTime).toInt()
        for (i in 0..steps) {
            progress = i.toFloat() / steps
            kotlinx.coroutines.delay(stepTime)
        }
        onComplete()
    }

    val themeProps = getThemeProperties("Dark Void")
    DimensionBackground(themeProperties = themeProps) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Transparent),
            contentAlignment = Alignment.Center
        ) {
        Box(
            modifier = Modifier
                .align(Alignment.Center)
                .size(400.dp)
                .background(
                    Brush.radialGradient(
                        colors = listOf(
                            Color(0xFF6B62F2).copy(alpha = 0.15f),
                            Color.Transparent
                        )
                    )
                )
        )

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.padding(24.dp)
        ) {
            Text(
                text = "BIENVENUE",
                color = Color(0xFFFFFFFF),
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 4.sp,
                textAlign = TextAlign.Center
            )
            
            Spacer(modifier = Modifier.height(12.dp))
            
            Text(
                text = "MemeGen AI",
                color = Color(0xFFE5E5E5), // Bone primary text
                fontSize = 36.sp,
                fontWeight = FontWeight.ExtraBold,
                letterSpacing = (-1.5).sp,
                textAlign = TextAlign.Center
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = "Préparation de ton studio créatif...",
                color = Color(0xFFC2C2C2), // Mist secondary text
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(48.dp))

            // Custom Smiling emoji that fills up
            Box(
                modifier = Modifier
                    .size(160.dp)
                    .clip(CircleShape)
                    .background(Color(0xFF1D1D1D)) // Char surface
                    .border(1.dp, Color(0xFFE5E5E5).copy(alpha = 0.1f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Canvas(modifier = Modifier.size(110.dp)) {
                    val radius = size.minDimension / 2f
                    val center = androidx.compose.ui.geometry.Offset(size.width / 2f, size.height / 2f)

                    // 1. Draw a faded background circle outline
                    drawCircle(
                        color = Color(0xFFFFFFFF).copy(alpha = 0.08f),
                        radius = radius,
                        center = center
                    )

                    // 2. Draw the filling yellow circle based on progress (0f to 1f) using standard clipPath on DrawScope
                    val path = androidx.compose.ui.graphics.Path().apply {
                        addOval(androidx.compose.ui.geometry.Rect(0f, 0f, size.width, size.height))
                    }
                    clipPath(path) {
                        val fillHeight = size.height * progress
                        drawRect(
                            color = Color(0xFFFFD700), // Yellow gold
                            topLeft = androidx.compose.ui.geometry.Offset(0f, size.height - fillHeight),
                            size = androidx.compose.ui.geometry.Size(size.width, fillHeight)
                        )
                    }

                    // 3. Draw eyes and smile arc on top
                    val eyeColor = Color(0xFF0A0A0A)
                    // Left eye
                    drawCircle(
                        color = eyeColor,
                        radius = radius * 0.12f,
                        center = androidx.compose.ui.geometry.Offset(center.x - radius * 0.35f, center.y - radius * 0.2f)
                    )
                    // Right eye
                    drawCircle(
                        color = eyeColor,
                        radius = radius * 0.12f,
                        center = androidx.compose.ui.geometry.Offset(center.x + radius * 0.35f, center.y - radius * 0.2f)
                    )

                    // Smile
                    val smileWidth = radius * 0.8f
                    val smileHeight = radius * 0.5f
                    drawArc(
                        color = eyeColor,
                        startAngle = 10f,
                        sweepAngle = 160f,
                        useCenter = false,
                        topLeft = androidx.compose.ui.geometry.Offset(center.x - smileWidth / 2f, center.y - radius * 0.1f),
                        size = androidx.compose.ui.geometry.Size(smileWidth, smileHeight),
                        style = androidx.compose.ui.graphics.drawscope.Stroke(
                            width = radius * 0.1f, 
                            cap = androidx.compose.ui.graphics.StrokeCap.Round
                        )
                    )
                }
            }

            Spacer(modifier = Modifier.height(36.dp))
            
            Text(
                text = "${(progress * 100).toInt()}%",
                color = Color(0xFFE5E5E5),
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace
            )
        }
    }
}
}

// ============================================================================
// 6. MULTIMEDIA AI STUDIO CONTAINER SECTION
// ============================================================================
@Composable
fun MultimediaStudioSection(viewModel: MemeViewModel, contextText: String) {
    val context = LocalContext.current
    var expandedMode by remember { mutableStateOf<String?>(null) } // "STICKER", "GIF", "VIDEO" or null

    val isGeneratingSticker by viewModel.isGeneratingSticker.collectAsStateWithLifecycle()
    val stickerEmoji by viewModel.stickerEmoji.collectAsStateWithLifecycle()
    val stickerText by viewModel.stickerText.collectAsStateWithLifecycle()

    val isSearchingGif by viewModel.isSearchingGif.collectAsStateWithLifecycle()
    val gifQuery by viewModel.gifQuery.collectAsStateWithLifecycle()
    val gifMood by viewModel.selectedGifMood.collectAsStateWithLifecycle()

    val isGeneratingVideo by viewModel.isGeneratingVideo.collectAsStateWithLifecycle()
    val videoTitle by viewModel.videoTitle.collectAsStateWithLifecycle()
    val videoPunchline by viewModel.videoPunchline.collectAsStateWithLifecycle()

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFF1D1D1D).copy(alpha = 0.85f), RoundedCornerShape(24.dp))
            .border(1.dp, Color(0xFFE5E5E5).copy(alpha = 0.08f), RoundedCornerShape(24.dp))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Default.Star, contentDescription = null, tint = Color.White, modifier = Modifier.size(20.dp))
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "Studio d'Expression IA",
                color = Color.White,
                fontWeight = FontWeight.ExtraBold,
                fontSize = 15.sp
            )
            Spacer(modifier = Modifier.weight(1f))
            Box(
                modifier = Modifier
                    .background(Color(0xFF3D3D3D), RoundedCornerShape(12.dp)) // Iron active background
                    .border(1.dp, Color(0xFFE5E5E5).copy(alpha = 0.08f), RoundedCornerShape(12.dp))
                    .padding(horizontal = 8.dp, vertical = 4.dp)
            ) {
                Text("Gemini 3.5 Active", color = Color(0xFFE5E5E5), fontSize = 10.sp, fontWeight = FontWeight.Bold)
            }
        }

        Text(
            text = "En plus du mème classique, convertis ta situation en stickers personnalisés, GIF de réaction ou courte vidéo TikTok animée !",
            color = Color(0xFFC2C2C2),
            fontSize = 11.sp,
            lineHeight = 15.sp
        )

        // Options Row (3 buttons side by side)
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // Sticker Button
            val isSticker = expandedMode == "STICKER"
            Button(
                onClick = {
                    if (expandedMode == "STICKER") expandedMode = null
                    else {
                        expandedMode = "STICKER"
                        viewModel.generateStickerFromContext(contextText)
                    }
                },
                modifier = Modifier
                    .weight(1f)
                    .border(
                        width = 1.dp,
                        color = if (isSticker) Color.Transparent else Color(0xFFE5E5E5).copy(alpha = 0.08f),
                        shape = RoundedCornerShape(12.dp)
                    ),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (isSticker) Color.White else Color(0xFF1D1D1D),
                    contentColor = if (isSticker) Color(0xFF0A0A0A) else Color.White
                ),
                contentPadding = PaddingValues(horizontal = 4.dp, vertical = 8.dp)
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("🎨", fontSize = 18.sp)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text("Sticker IA", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }

            // GIF Button
            val isGif = expandedMode == "GIF"
            Button(
                onClick = {
                    if (expandedMode == "GIF") expandedMode = null
                    else {
                        expandedMode = "GIF"
                        viewModel.generateGifFromContext(contextText)
                    }
                },
                modifier = Modifier
                    .weight(1f)
                    .border(
                        width = 1.dp,
                        color = if (isGif) Color.Transparent else Color(0xFFE5E5E5).copy(alpha = 0.08f),
                        shape = RoundedCornerShape(12.dp)
                    ),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (isGif) Color.White else Color(0xFF1D1D1D),
                    contentColor = if (isGif) Color(0xFF0A0A0A) else Color.White
                ),
                contentPadding = PaddingValues(horizontal = 4.dp, vertical = 8.dp)
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("🎬", fontSize = 18.sp)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text("GIF Situation", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }

            // Short Video Button
            val isVideo = expandedMode == "VIDEO"
            Button(
                onClick = {
                    if (expandedMode == "VIDEO") expandedMode = null
                    else {
                        expandedMode = "VIDEO"
                        viewModel.generateVideoFromContext(contextText)
                    }
                },
                modifier = Modifier
                    .weight(1f)
                    .border(
                        width = 1.dp,
                        color = if (isVideo) Color.Transparent else Color(0xFFE5E5E5).copy(alpha = 0.08f),
                        shape = RoundedCornerShape(12.dp)
                    ),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (isVideo) Color.White else Color(0xFF1D1D1D),
                    contentColor = if (isVideo) Color(0xFF0A0A0A) else Color.White
                ),
                contentPadding = PaddingValues(horizontal = 4.dp, vertical = 8.dp)
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("📺", fontSize = 18.sp)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text("Short Vidéo", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        // Expanded Builder Panels with smooth Transition animations
        AnimatedVisibility(
            visible = expandedMode != null,
            enter = expandVertically(animationSpec = spring()) + fadeIn(),
            exit = shrinkVertically(animationSpec = spring()) + fadeOut()
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF1D1D1D).copy(alpha = 0.85f), RoundedCornerShape(16.dp))
                    .border(1.dp, Color(0xFFE5E5E5).copy(alpha = 0.08f), RoundedCornerShape(16.dp))
                    .padding(12.dp)
            ) {
                when (expandedMode) {
                    "STICKER" -> {
                        if (isGeneratingSticker) {
                            Column(
                                modifier = Modifier.fillMaxWidth().padding(16.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                CircularProgressIndicator(color = Color(0xFFE5E5E5))
                                Spacer(modifier = Modifier.height(8.dp))
                                Text("Génération du sticker par l'IA...", color = Color.LightGray, fontSize = 12.sp)
                            }
                        } else {
                            Column(
                                modifier = Modifier.fillMaxWidth(),
                                verticalArrangement = Arrangement.spacedBy(16.dp)
                            ) {
                                StickerCreatorContent(
                                    emoji = stickerEmoji,
                                    text = stickerText,
                                    onEmojiChange = { viewModel.changeStickerEmoji(it) },
                                    onTextChange = { viewModel.changeStickerText(it) },
                                    onSave = {
                                        viewModel.saveMultimediaEntity(
                                            type = "STICKER",
                                            contextText = contextText,
                                            topText = stickerEmoji,
                                            bottomText = stickerText,
                                            mediaPath = null
                                        ) { success ->
                                            Toast.makeText(context, if (success) "Sticker sauvegardé !" else "Erreur", Toast.LENGTH_SHORT).show()
                                            expandedMode = null
                                        }
                                    }
                                )
                                AdvancedOutputConfigPanel(viewModel = viewModel, mode = "STICKER")
                            }
                        }
                    }
                    "GIF" -> {
                        if (isSearchingGif) {
                            Column(
                                modifier = Modifier.fillMaxWidth().padding(16.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                CircularProgressIndicator(color = Color(0xFFE5E5E5))
                                Spacer(modifier = Modifier.height(8.dp))
                                Text("Recherche de situation par l'IA...", color = Color.LightGray, fontSize = 12.sp)
                            }
                        } else {
                            Column(
                                modifier = Modifier.fillMaxWidth(),
                                verticalArrangement = Arrangement.spacedBy(16.dp)
                            ) {
                                GifCreatorContent(
                                    query = gifQuery,
                                    selectedMood = gifMood,
                                    onMoodChange = { viewModel.changeGifMood(it) },
                                    onSave = {
                                        viewModel.saveMultimediaEntity(
                                            type = "GIF",
                                            contextText = contextText,
                                            topText = gifQuery,
                                            bottomText = gifMood,
                                            mediaPath = null
                                        ) { success ->
                                            Toast.makeText(context, if (success) "GIF de situation enregistré !" else "Erreur", Toast.LENGTH_SHORT).show()
                                            expandedMode = null
                                        }
                                    }
                                )
                                AdvancedOutputConfigPanel(viewModel = viewModel, mode = "GIF")
                            }
                        }
                    }
                    "VIDEO" -> {
                        if (isGeneratingVideo) {
                            Column(
                                modifier = Modifier.fillMaxWidth().padding(16.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                CircularProgressIndicator(color = Color(0xFFE5E5E5))
                                Spacer(modifier = Modifier.height(8.dp))
                                Text("Production du storyboard animé...", color = Color.LightGray, fontSize = 12.sp)
                            }
                        } else {
                            Column(
                                modifier = Modifier.fillMaxWidth(),
                                verticalArrangement = Arrangement.spacedBy(16.dp)
                            ) {
                                VideoCreatorContent(
                                    title = videoTitle,
                                    punchline = videoPunchline,
                                    onSave = {
                                        viewModel.saveMultimediaEntity(
                                            type = "VIDEO",
                                            contextText = contextText,
                                            topText = videoTitle,
                                            bottomText = videoPunchline,
                                            mediaPath = null
                                        ) { success ->
                                            Toast.makeText(context, if (success) "Short Vidéo Animée enregistrée !" else "Erreur", Toast.LENGTH_SHORT).show()
                                            expandedMode = null
                                        }
                                    }
                                )
                                AdvancedOutputConfigPanel(viewModel = viewModel, mode = "VIDEO")
                            }
                        }
                    }
                }
            }
        }
    }
}

// ============================================================================
// STICKER GENERATOR COMPONENT
// ============================================================================
@Composable
fun StickerCreatorContent(
    emoji: String,
    text: String,
    onEmojiChange: (String) -> Unit,
    onTextChange: (String) -> Unit,
    onSave: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text("🎨 Personnalise ton Sticker IA :", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp, modifier = Modifier.align(Alignment.Start))
        
        var bounceState by remember { mutableStateOf(false) }
        val scaleAnim by animateFloatAsState(
            targetValue = if (bounceState) 1.15f else 1.0f,
            animationSpec = spring(dampingRatio = Spring.DampingRatioHighBouncy, stiffness = Spring.StiffnessMedium),
            label = "StickerBounce"
        )

        Box(
            modifier = Modifier
                .size(160.dp)
                .graphicsLayer(scaleX = scaleAnim, scaleY = scaleAnim)
                .clickable {
                    bounceState = !bounceState
                }
                .background(Color.Transparent),
            contentAlignment = Alignment.Center
        ) {
            Box(
                modifier = Modifier
                    .size(120.dp)
                    .background(Color.White.copy(alpha = 0.08f), CircleShape)
            )

            Column(
                modifier = Modifier
                    .width(130.dp)
                    .clip(RoundedCornerShape(24.dp))
                    .background(Color.White)
                    .border(4.dp, Color(0xFF1D1D1D), RoundedCornerShape(24.dp))
                    .padding(8.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Text(text = emoji, fontSize = 54.sp)
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = text.uppercase(),
                    color = Color(0xFF1D1D1D),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.ExtraBold,
                    textAlign = TextAlign.Center,
                    lineHeight = 12.sp
                )
            }
        }

        Text("Astuce: Appuie sur le sticker pour le secouer !", color = Color.Gray, fontSize = 10.sp)

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            listOf("😂", "💀", "🔥", "🚀", "🤡", "🤦‍♂️", "🤯", "👑", "🦄").forEach { e ->
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .background(if (emoji == e) Color.White else Color(0xFF1D1D1D))
                        .border(1.dp, Color(0xFFE5E5E5).copy(alpha = 0.08f), CircleShape)
                        .clickable { onEmojiChange(e) },
                    contentAlignment = Alignment.Center
                ) {
                    Text(e, fontSize = 16.sp)
                }
            }
        }

        OutlinedTextField(
            value = text,
            onValueChange = onTextChange,
            label = { Text("Modifier le slogan du Sticker") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = Color(0xFFE5E5E5),
                unfocusedBorderColor = Color(0xFFE5E5E5).copy(alpha = 0.08f),
                focusedLabelColor = Color(0xFFE5E5E5),
                unfocusedLabelColor = Color(0xFF686868),
                focusedTextColor = Color.White,
                unfocusedTextColor = Color.White
            )
        )

        Button(
            onClick = onSave,
            colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = Color(0xFF0A0A0A)),
            shape = RoundedCornerShape(9999.dp),
            modifier = Modifier.fillMaxWidth().height(44.dp)
        ) {
            Icon(Icons.Default.Done, contentDescription = null, modifier = Modifier.size(16.dp))
            Spacer(modifier = Modifier.width(6.dp))
            Text("SAUVEGARDER LE STICKER", fontWeight = FontWeight.Bold, fontSize = 12.sp)
        }
    }
}

// ============================================================================
// GIF CREATOR COMPONENT
// ============================================================================
@Composable
fun GifCreatorContent(
    query: String,
    selectedMood: String,
    onMoodChange: (String) -> Unit,
    onSave: () -> Unit
) {
    val moods = listOf(
        "LOL" to "😂 Rire",
        "PANIQUE" to "😱 Panique",
        "COLÈRE" to "😡 Colère",
        "DANSE" to "🕺 Danse"
    )

    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text("🎬 GIF de Situation IA :", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp, modifier = Modifier.align(Alignment.Start))
        
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color(0xFF1D1D1D), RoundedCornerShape(12.dp))
                .border(1.dp, Color(0xFFE5E5E5).copy(alpha = 0.08f), RoundedCornerShape(12.dp))
                .padding(8.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = "GIF QUERY : \"$query\"",
                    color = Color.LightGray,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center
                )
                Spacer(modifier = Modifier.height(12.dp))

                val infiniteTransition = rememberInfiniteTransition(label = "gif")
                val floatOffset by infiniteTransition.animateFloat(
                    initialValue = -10f,
                    targetValue = 10f,
                    animationSpec = infiniteRepeatable(
                        animation = tween(400, easing = EaseInOutSine),
                        repeatMode = RepeatMode.Reverse
                    ),
                    label = "gif_float"
                )
                val scale by infiniteTransition.animateFloat(
                    initialValue = 0.9f,
                    targetValue = 1.1f,
                    animationSpec = infiniteRepeatable(
                        animation = tween(300, easing = EaseInOutBack),
                        repeatMode = RepeatMode.Reverse
                    ),
                    label = "gif_scale"
                )

                Box(
                    modifier = Modifier
                        .size(120.dp)
                        .graphicsLayer(
                            translationY = if (selectedMood == "LOL" || selectedMood == "DANSE") floatOffset else 0f,
                            scaleX = if (selectedMood == "PANIQUE" || selectedMood == "COLÈRE") scale else 1f,
                            scaleY = if (selectedMood == "PANIQUE" || selectedMood == "COLÈRE") scale else 1f
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    when (selectedMood) {
                        "LOL" -> {
                            Text("😂", fontSize = 70.sp)
                        }
                        "PANIQUE" -> {
                            Text("😱", fontSize = 70.sp)
                        }
                        "COLÈRE" -> {
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .background(Color.Red.copy(alpha = 0.15f), CircleShape)
                            )
                            Text("😡", fontSize = 70.sp)
                        }
                        "DANSE" -> {
                            Text("🕺", fontSize = 70.sp)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))
                Box(
                    modifier = Modifier
                        .background(Color.White.copy(alpha = 0.1f), RoundedCornerShape(4.dp))
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                ) {
                    Text("LOOP PLAYING ↺", color = Color.Green, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            moods.forEach { (id, label) ->
                val isSelected = selectedMood == id
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(8.dp))
                        .background(if (isSelected) Color.White else Color(0xFF1D1D1D))
                        .border(1.dp, Color(0xFFE5E5E5).copy(alpha = 0.08f), RoundedCornerShape(8.dp))
                        .clickable { onMoodChange(id) }
                        .padding(vertical = 8.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = label,
                        color = if (isSelected) Color(0xFF0A0A0A) else Color.White,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        Button(
            onClick = onSave,
            colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = Color(0xFF0A0A0A)),
            shape = RoundedCornerShape(9999.dp),
            modifier = Modifier.fillMaxWidth().height(44.dp)
        ) {
            Icon(Icons.Default.Done, contentDescription = null, modifier = Modifier.size(16.dp))
            Spacer(modifier = Modifier.width(6.dp))
            Text("SAUVEGARDER LE GIF DE SITUATION", fontWeight = FontWeight.Bold, fontSize = 12.sp)
        }
    }
}

// ============================================================================
// SHORT VIDEO GENERATOR COMPONENT (TikTok / Reels Style Player)
// ============================================================================
@Composable
fun VideoCreatorContent(
    title: String,
    punchline: String,
    onSave: () -> Unit
) {
    var isPlaying by remember { mutableStateOf(true) }
    var progress by remember { mutableFloatStateOf(0.4f) }
    var isMuted by remember { mutableStateOf(false) }

    LaunchedEffect(isPlaying) {
        if (isPlaying) {
            while (true) {
                kotlinx.coroutines.delay(100)
                progress += 0.01f
                if (progress > 1.0f) {
                    progress = 0.0f
                }
            }
        }
    }

    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text("📺 Short Vidéo Animée IA :", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp, modifier = Modifier.align(Alignment.Start))

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(240.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(Color(0xFF1D1D1D))
                .border(1.dp, Color(0xFFE5E5E5).copy(alpha = 0.08f), RoundedCornerShape(16.dp))
        ) {
            val infiniteTransition = rememberInfiniteTransition(label = "video_bg")
            val gradientShift by infiniteTransition.animateFloat(
                initialValue = 0f,
                targetValue = 100f,
                animationSpec = infiniteRepeatable(
                    animation = tween(3000, easing = LinearEasing),
                    repeatMode = RepeatMode.Reverse
                ),
                label = "shift"
            )

            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.radialGradient(
                            colors = listOf(Color(0xFF6B62F2).copy(alpha = 0.15f), Color.Transparent),
                            radius = 250f + gradientShift
                        )
                    )
            )

            val captionScale by infiniteTransition.animateFloat(
                initialValue = 1.0f,
                targetValue = 1.15f,
                animationSpec = infiniteRepeatable(
                    animation = tween(450, easing = EaseInOutSine),
                    repeatMode = RepeatMode.Reverse
                ),
                label = "caption"
            )

            val emojiOffsetY by infiniteTransition.animateFloat(
                initialValue = 150f,
                targetValue = -30f,
                animationSpec = infiniteRepeatable(
                    animation = tween(2500, easing = LinearEasing),
                    repeatMode = RepeatMode.Restart
                ),
                label = "float_emoji"
            )

            if (isPlaying) {
                Text(
                    text = "😂",
                    fontSize = 24.sp,
                    modifier = Modifier
                        .align(Alignment.BottomEnd)
                        .offset(x = (-30).dp, y = emojiOffsetY.dp)
                        .graphicsLayer(alpha = 0.6f)
                )
            }

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(
                    modifier = Modifier
                        .background(Color(0xFF1D1D1D), RoundedCornerShape(8.dp))
                        .border(1.dp, Color(0xFFE5E5E5).copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = title.uppercase(),
                        color = Color(0xFFE5E5E5),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.ExtraBold,
                        textAlign = TextAlign.Center
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = punchline,
                    color = Color.White,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.ExtraBold,
                    textAlign = TextAlign.Center,
                    lineHeight = 18.sp,
                    modifier = Modifier
                        .graphicsLayer(
                            scaleX = if (isPlaying) captionScale else 1.0f,
                            scaleY = if (isPlaying) captionScale else 1.0f
                        )
                        .padding(horizontal = 12.dp)
                )
            }

            Row(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .height(30.dp)
                    .padding(horizontal = 24.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Bottom
            ) {
                for (i in 0..12) {
                    val heightFactor by infiniteTransition.animateFloat(
                        initialValue = 4f,
                        targetValue = 24f,
                        animationSpec = infiniteRepeatable(
                            animation = tween(300 + (i * 40), easing = EaseInOutSine),
                            repeatMode = RepeatMode.Reverse
                        ),
                        label = "bar_$i"
                    )
                    Box(
                        modifier = Modifier
                            .width(5.dp)
                            .height(if (isPlaying) heightFactor.dp else 6.dp)
                            .clip(RoundedCornerShape(2.dp))
                            .background(Color.White)
                    )
                }
            }

            Row(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .background(Color.Black.copy(alpha = 0.5f), CircleShape)
                        .clickable { isMuted = !isMuted },
                    contentAlignment = Alignment.Center
                ) {
                    Text(if (isMuted) "🔇" else "🔊", fontSize = 14.sp)
                }

                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .background(Color.Black.copy(alpha = 0.5f), CircleShape)
                        .clickable { isPlaying = !isPlaying },
                    contentAlignment = Alignment.Center
                ) {
                    Text(if (isPlaying) "⏸" else "▶", fontSize = 14.sp)
                }
            }

            LinearProgressIndicator(
                progress = { progress },
                color = Color.White,
                trackColor = Color.White.copy(alpha = 0.2f),
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .height(3.dp)
            )
        }

        Button(
            onClick = onSave,
            colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = Color(0xFF0A0A0A)),
            shape = RoundedCornerShape(9999.dp),
            modifier = Modifier.fillMaxWidth().height(44.dp)
        ) {
            Icon(Icons.Default.Done, contentDescription = null, modifier = Modifier.size(16.dp))
            Spacer(modifier = Modifier.width(6.dp))
            Text("SAUVEGARDER LA SHORT VIDÉO ANIMÉE", fontWeight = FontWeight.Bold, fontSize = 12.sp)
        }
    }
}

// ============================================================================
// 7. HIGH-FIDELITY MATERIAL 3 CUSTOM CHIP SELECTOR
// ============================================================================
@Composable
fun CustomFilterChip(selected: Boolean, label: String, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(20.dp))
            .background(if (selected) Color.White else Color(0xFF1D1D1D))
            .border(
                1.dp,
                if (selected) Color.Transparent else Color(0xFFE5E5E5).copy(alpha = 0.08f),
                RoundedCornerShape(20.dp)
            )
            .clickable { onClick() }
            .padding(horizontal = 14.dp, vertical = 8.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = label,
            color = if (selected) Color(0xFF0A0A0A) else Color(0xFFC2C2C2),
            fontWeight = FontWeight.Bold,
            fontSize = 12.sp
        )
    }
}
