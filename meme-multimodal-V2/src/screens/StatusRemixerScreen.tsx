import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, Animated, PanResponder, Dimensions, Image, Linking, Platform,
} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import { useStore } from '../store/useStore';
import { themes, getDerivedColors } from '../theme/colors';
import { t } from '../utils/i18n';
import MemeCardPreview from '../components/MemeCardPreview';
import MultimediaStudioSection from '../components/MultimediaStudioSection';
import {
  analyzeImageForMeme, generateGifSearchQuery, removeImageBackground,
  generateStickerFromImage, generateGifQueryFromImage, generateVideoQueryFromImage,
} from '../services/gemini';
import { searchGif } from '../services/klipy';
import { searchShortVideo } from '../services/pexels';
import { requestCameraPermission, requestGalleryPermission, showPermissionDenied } from '../utils/permissions';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { saveMeme } from '../services/database';
import { shareMeme } from '../utils/memeSaver';
import { FILTERS, type DrawingPoint } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLORS = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FFFFFF', '#00FFFF'];

const subModes = ['PHOTO_REMIXER', 'STICKER', 'GIF', 'VIDEO'] as const;
const subModeLabels: Record<string, string> = {
  PHOTO_REMIXER: '📸 Photo',
  STICKER: '🎨 Sticker AI',
  GIF: '🎬 GIF Situation',
  VIDEO: '📺 Short Vidéo',
};

function DirectImageEditor() {
  const store = useStore();
  const theme = themes[store.currentTheme as keyof typeof themes] || themes['Dark Void'];
  const derived = getDerivedColors(theme);
  const [localPoints, setLocalPoints] = useState<DrawingPoint[]>([]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => store.isDrawingMode,
      onMoveShouldSetPanResponder: () => store.isDrawingMode,
      onPanResponderGrant: (evt) => {
        if (!store.isDrawingMode) return;
        const { locationX, locationY } = evt.nativeEvent;
        const pt = { x: locationX / 200, y: locationY / 200 };
        setLocalPoints([pt]);
        store.setDrawingPoints([pt]);
      },
      onPanResponderMove: (evt) => {
        if (!store.isDrawingMode) return;
        const { locationX, locationY } = evt.nativeEvent;
        const pt = { x: locationX / 200, y: locationY / 200 };
        const updated = [...localPoints, pt];
        setLocalPoints(updated);
        store.setDrawingPoints(updated);
      },
    }),
  ).current;

  return (
    <View style={[styles.editorPanel, { backgroundColor: derived.cardBackground, borderColor: derived.borderColor, borderRadius: 24, borderWidth: 1, padding: 16, gap: 12 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={[styles.editorTitle, { color: derived.textColor }]}>
          {t('editor_title', store.currentLanguage)}
        </Text>
        <TouchableOpacity onPress={() => store.setDrawingPoints([])}>
          <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: '700' }}>
            {t('editor_clear', store.currentLanguage)}
          </Text>
        </TouchableOpacity>
      </View>

      <View
        style={[styles.canvas, { borderColor: derived.borderColor, backgroundColor: '#000000' }]}
        {...panResponder.panHandlers}
      >
        {!store.isDrawingMode && (
          <View style={StyleSheet.absoluteFill}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>
                {t('editor_draw_hint', store.currentLanguage)}
              </Text>
            </View>
          </View>
        )}
        {store.isDrawingMode && (
          <View style={[styles.drawingBadge, { backgroundColor: '#EF4444' }]}>
            <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>{t('editor_draw_active', store.currentLanguage)}</Text>
          </View>
        )}
      </View>

      {store.isDrawingMode && (
        <Text style={[styles.drawingHint, { color: derived.secondaryTextColor }]}>
          Dessine avec ton doigt directement sur l'image !
        </Text>
      )}

      <View style={styles.colorPalette}>
        {COLORS.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              { width: 24, height: 24, borderRadius: 12, backgroundColor: color },
              store.drawingColor === color && { borderWidth: 2, borderColor: '#fff' },
            ]}
            onPress={() => store.setDrawingColor(color)}
          />
        ))}
      </View>

      <TouchableOpacity
        onPress={() => store.setIsDrawingMode(!store.isDrawingMode)}
        style={{ alignSelf: 'center' }}
      >
        <Text style={{ color: theme.accentColor, fontSize: 12, fontWeight: '700' }}>
          {store.isDrawingMode ? t('quit_drawing', store.currentLanguage) : t('editor_draw_hint', store.currentLanguage)}
        </Text>
      </TouchableOpacity>

      <View style={styles.sliderRow}>
        <Text style={[styles.sliderLabel, { color: derived.textColor }]}>{t('brightness', store.currentLanguage)}</Text>
        <View style={[styles.sliderTrack, { backgroundColor: derived.borderColor }]}>
          <View style={[styles.sliderFill, { width: `${((store.brightness - 0.5) / 1) * 100}%`, backgroundColor: theme.accentColor }]} />
        </View>
        <TextInput
          value={`${Math.round(store.brightness * 100)}%`}
          editable={false}
          style={[styles.sliderVal, { color: derived.textColor }]}
        />
      </View>
      <View style={styles.sliderRow}>
        <Text style={[styles.sliderLabel, { color: derived.textColor }]}>{t('contrast', store.currentLanguage)}</Text>
        <View style={[styles.sliderTrack, { backgroundColor: derived.borderColor }]}>
          <View style={[styles.sliderFill, { width: `${((store.contrast - 0.5) / 1) * 100}%`, backgroundColor: theme.accentColor }]} />
        </View>
        <TextInput
          value={`${Math.round(store.contrast * 100)}%`}
          editable={false}
          style={[styles.sliderVal, { color: derived.textColor }]}
        />
      </View>

      <Text style={[styles.filterSectionTitle, { color: derived.textColor }]}>
        {t('editor_filter_title', store.currentLanguage)}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterChip,
              { borderColor: derived.borderColor },
              store.currentFilter === filter && { backgroundColor: theme.accentColor },
            ]}
            onPress={() => store.setCurrentFilter(filter)}
          >
            <Text style={[
              styles.filterText,
              { color: store.currentFilter === filter ? '#fff' : derived.textColor },
            ]}>{filter}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

function StickerContent() {
  const store = useStore();
  const theme = themes[store.currentTheme as keyof typeof themes] || themes['Dark Void'];
  const derived = getDerivedColors(theme);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const hasImage = !!store.statusImagePath;
  const [extractedImageUri, setExtractedImageUri] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  useEffect(() => {
    if (hasImage && !extractedImageUri && !isExtracting) {
      setIsExtracting(true);
      removeImageBackground(store.statusImagePath!).then((uri) => {
        if (uri) setExtractedImageUri(uri);
        setIsExtracting(false);
      }).catch(() => setIsExtracting(false));
    }
  }, [hasImage]);

  useEffect(() => {
    if (!hasImage) return;
    store.setIsGeneratingSticker(true);
    generateStickerFromImage(store.statusImagePath!).then(([emoji, text]) => {
      store.setStickerEmoji(emoji);
      store.setStickerText(text);
    }).catch((e) => {
      console.warn('[StickerContent] Generation error:', e);
      store.setStickerEmoji('🔥');
      store.setStickerText("C'EST L'IMAGE !");
    }).finally(() => store.setIsGeneratingSticker(false));
  }, [hasImage]);

  useEffect(() => {
    if (hasImage) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: -5 * store.stickerAnimationSpeed, duration: 150, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 5 * store.stickerAnimationSpeed, duration: 150, useNativeDriver: true }),
      ]),
    ).start();
  }, [store.stickerAnimationSpeed, hasImage]);

  const handleSave = async () => {
    const meme = await saveMeme({
      type: 'STICKER',
      contextText: store.contextInput,
      topText: store.stickerEmoji,
      bottomText: store.stickerText,
      bgImageUri: store.statusImagePath,
    });
    store.addSavedMeme(meme);
    Alert.alert(t('sticker_saved', store.currentLanguage));
  };

  const getPositionStyle = () => {
    const pos = store.stickerTextPosition || 'bottom';
    switch (pos) {
      case 'top': return { top: 8, alignSelf: 'center' as const };
      case 'left': return { left: 8, alignSelf: 'flex-start' as const, top: '45%' as any };
      case 'right': return { right: 8, alignSelf: 'flex-end' as const, top: '45%' as any };
      default: return { bottom: 8, alignSelf: 'center' as const };
    }
  };

  return (
    <View style={[styles.subSection, { backgroundColor: derived.cardBackground, borderColor: derived.borderColor }]}>
      <Text style={[styles.subTitle, { color: derived.textColor }]}>{t('sticker_title', store.currentLanguage)}</Text>
      <Text style={[styles.subDesc, { color: derived.secondaryTextColor }]}>{t('sticker_desc', store.currentLanguage)}</Text>

      {!hasImage && (
        <>
          <Text style={[styles.paramLabel, { color: derived.textColor }]}>
            {t('sticker_shape', store.currentLanguage) || 'Forme :'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['Circle', 'Rounded', 'Star'] as const).map((shape) => (
              <TouchableOpacity
                key={shape}
                style={[styles.chip, { borderColor: derived.borderColor }, store.stickerShape === shape && { backgroundColor: theme.accentColor }]}
                onPress={() => store.setStickerShape(shape)}
              >
                <Text style={[styles.chipText, { color: store.stickerShape === shape ? '#fff' : derived.textColor }]}>{shape}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {hasImage && (
        <>
          <Text style={[styles.paramLabel, { color: derived.textColor }]}>
            Position du texte :
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['bottom', 'top', 'left', 'right'] as const).map((pos) => (
              <TouchableOpacity
                key={pos}
                style={[styles.chip, { borderColor: derived.borderColor }, store.stickerTextPosition === pos && { backgroundColor: theme.accentColor }]}
                onPress={() => store.setStickerTextPosition(pos)}
              >
                <Text style={[styles.chipText, { color: store.stickerTextPosition === pos ? '#fff' : derived.textColor }]}>{pos}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {!hasImage && (
        <>
          <Text style={[styles.paramLabel, { color: derived.textColor }]}>
            {t('sticker_speed', store.currentLanguage) || 'Animation :'}
          </Text>
          <TextInput
            value={String(store.stickerAnimationSpeed)}
            onChangeText={(v) => store.setStickerAnimationSpeed(Math.max(0.5, Math.min(2, Number(v) || 1)))}
            keyboardType="decimal-pad"
            style={[styles.input, { color: derived.textColor, borderColor: derived.borderColor }]}
          />
        </>
      )}

      {hasImage ? (
        <View style={[styles.stickerPreview, {
          borderColor: '#FFFFFF',
          borderRadius: 120,
          borderWidth: 4,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }]}>
          <Image source={{ uri: (extractedImageUri || store.statusImagePath) ?? undefined }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          {isExtracting && <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }]}><Text style={{ color: '#fff', fontWeight: '800' }}>Extraction...</Text></View>}
          {store.stickerText ? (
            <View style={[styles.stickerTextBg, { backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, ...getPositionStyle() }]}>
              <Text style={styles.stickerText}>{store.stickerText.toUpperCase()}</Text>
            </View>
          ) : null}
        </View>
      ) : (
        <Animated.View
          style={[
            styles.stickerPreview,
            {
              borderColor: derived.borderColor,
              borderRadius: store.stickerShape === 'Circle' ? 120 : store.stickerShape === 'Rounded' ? 24 : 12,
              transform: hasImage ? [] : [{ translateX: shakeAnim }],
            },
          ]}
        >
          <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.accentColor + '20' }]} />
          <Text style={{ fontSize: 84 }}>{store.stickerEmoji}</Text>
          {store.stickerText ? (
            <View style={[styles.stickerTextBg, { backgroundColor: 'rgba(0,0,0,0.7)', ...getPositionStyle() }]}>
              <Text style={styles.stickerText}>{store.stickerText.toUpperCase()}</Text>
            </View>
          ) : null}
        </Animated.View>
      )}

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleSave}
        style={{ borderRadius: 9999, overflow: 'hidden' }}
      >
        <LinearGradient colors={['#FFFFFF', '#E5E5E5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={[styles.saveBtn, { paddingHorizontal: 32 }]}>
          <Text style={[styles.saveBtnText, { color: '#0A0A0A' }]}>💾 {t('sticker_save', store.currentLanguage) || 'ENREGISTRER'}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

function GifContent() {
  const store = useStore();
  const theme = themes[store.currentTheme as keyof typeof themes] || themes['Dark Void'];
  const derived = getDerivedColors(theme);
  const kenScale = useRef(new Animated.Value(1)).current;
  const kenX = useRef(new Animated.Value(0)).current;
  const kenY = useRef(new Animated.Value(0)).current;
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const hasImage = !!store.statusImagePath;

  useEffect(() => {
    if (!hasImage) return;
    const dur = 3000 / store.gifPlaybackSpeed;
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(kenScale, { toValue: 1.4, duration: dur, useNativeDriver: true }),
          Animated.timing(kenX, { toValue: 30, duration: dur, useNativeDriver: true }),
          Animated.timing(kenY, { toValue: -10, duration: dur, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(kenScale, { toValue: 1.0, duration: dur, useNativeDriver: true }),
          Animated.timing(kenX, { toValue: -20, duration: dur, useNativeDriver: true }),
          Animated.timing(kenY, { toValue: 15, duration: dur, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(kenScale, { toValue: 1.2, duration: dur, useNativeDriver: true }),
          Animated.timing(kenX, { toValue: 0, duration: dur, useNativeDriver: true }),
          Animated.timing(kenY, { toValue: 0, duration: dur, useNativeDriver: true }),
        ]),
      ]),
    ).start();
    return () => { kenScale.setValue(1); kenX.setValue(0); kenY.setValue(0); };
  }, [store.gifPlaybackSpeed, hasImage]);

  useEffect(() => {
    if (!hasImage) return;
    store.setIsSearchingGif(true);
    setGifUrl(null);
    generateGifQueryFromImage(store.statusImagePath!).then((q) => {
      store.setGifQuery(q);
      return searchGif(q);
    }).then((gif) => {
      if (gif?.url) setGifUrl(gif.url);
    }).catch((e) => {
      console.warn('[GifContent] Generation error:', e);
      store.setGifQuery('funny reaction');
      searchGif('funny reaction').then((gif) => {
        if (gif?.url) setGifUrl(gif.url);
      });
    }).finally(() => store.setIsSearchingGif(false));
  }, [hasImage]);

  const handleGenerate = async () => {
    store.setIsSearchingGif(true);
    setGifUrl(null);
    try {
      const q = store.statusImagePath
        ? await generateGifQueryFromImage(store.statusImagePath)
        : await generateGifSearchQuery(store.contextInput || store.selectedGifMood);
      store.setGifQuery(q);
      const gif = await searchGif(q);
      if (gif?.url) setGifUrl(gif.url);
    } finally {
      store.setIsSearchingGif(false);
    }
  };

  const handleSave = async () => {
    const meme = await saveMeme({
      type: 'GIF',
      contextText: store.contextInput,
      topText: store.selectedGifMood,
      bottomText: store.gifQuery,
      bgImageUri: store.statusImagePath,
    });
    store.addSavedMeme(meme);
    Alert.alert(t('gif_saved', store.currentLanguage));
  };

  return (
    <View style={[styles.subSection, { backgroundColor: derived.cardBackground, borderColor: derived.borderColor }]}>
      <Text style={[styles.subTitle, { color: derived.textColor }]}>{t('gif_title', store.currentLanguage)}</Text>
      <Text style={[styles.subDesc, { color: derived.secondaryTextColor }]}>{t('gif_desc', store.currentLanguage)}</Text>

      {!hasImage && (
        <>
          <Text style={[styles.paramLabel, { color: derived.textColor }]}>
            {t('gif_mood', store.currentLanguage) || 'Humeur / Catégorie :'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {(['LOL', 'PANIQUE', 'COLERE', 'DANSE'] as const).map((mood) => (
              <TouchableOpacity
                key={mood}
                style={[styles.chip, { borderColor: derived.borderColor }, store.selectedGifMood === mood && { backgroundColor: theme.accentColor }]}
                onPress={() => store.setSelectedGifMood(mood)}
              >
                <Text style={[styles.chipText, { color: store.selectedGifMood === mood ? '#fff' : derived.textColor }]}>
                  {mood === 'LOL' ? '😂' : mood === 'PANIQUE' ? '😱' : mood === 'COLERE' ? '😡' : '🕺'} {mood}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <Text style={[styles.paramLabel, { color: derived.textColor }]}>
        {t('gif_speed', store.currentLanguage) || 'Vitesse :'}
      </Text>
      <TextInput
        value={String(store.gifPlaybackSpeed)}
        onChangeText={(v) => store.setGifPlaybackSpeed(Math.max(0.5, Math.min(3, Number(v) || 1)))}
        keyboardType="decimal-pad"
        style={[styles.input, { color: derived.textColor, borderColor: derived.borderColor }]}
      />

      <View style={styles.actionRow}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleGenerate}
          disabled={store.isSearchingGif}
          style={{ borderRadius: 9999, overflow: 'hidden', flex: 1 }}
        >
          <LinearGradient colors={['#8B5CF6', '#6366F1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ paddingVertical: 12, alignItems: 'center', borderRadius: 9999 }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>
              {store.isSearchingGif ? '...' : '✨ GÉNÉRER'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtnGif, { backgroundColor: '#FFFFFF' }]} onPress={handleSave}>
          <Text style={[styles.actionBtnGifText, { color: '#0A0A0A' }]}>💾 {t('gif_save', store.currentLanguage) || 'ENREGISTRER'}</Text>
        </TouchableOpacity>
      </View>

      {gifUrl ? (
        <View style={[styles.stickerPreview, { borderColor: derived.borderColor, borderRadius: 16, overflow: 'hidden' }]}>
          <Image source={{ uri: gifUrl }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
        </View>
      ) : (
        <Animated.View
          style={[styles.stickerPreview, {
            borderColor: derived.borderColor, borderRadius: 16,
            transform: hasImage ? [{ scale: kenScale }, { translateX: kenX }, { translateY: kenY }] : [],
            overflow: hasImage ? 'hidden' as const : undefined,
          }]}
        >
          {hasImage ? (
            <Image source={{ uri: store.statusImagePath ?? undefined }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.baseColor }]} />
          )}
          {!hasImage && (
            <Text style={{ fontSize: 96 }}>
              {store.selectedGifMood === 'LOL' ? '😂' : store.selectedGifMood === 'PANIQUE' ? '😱' : store.selectedGifMood === 'COLERE' ? '😡' : '🕺'}
            </Text>
          )}
          {!hasImage && <Text style={[styles.gifQueryText, { color: derived.textColor }]}>{store.gifQuery}</Text>}
        </Animated.View>
      )}
    </View>
  );
}

function VideoContent() {
  const store = useStore();
  const theme = themes[store.currentTheme as keyof typeof themes] || themes['Dark Void'];
  const derived = getDerivedColors(theme);
  const zoomAnim = useRef(new Animated.Value(1)).current;
  const panXAnim = useRef(new Animated.Value(0)).current;
  const panYAnim = useRef(new Animated.Value(0)).current;
  const hasImage = !!store.statusImagePath;
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);

  useEffect(() => {
    if (!hasImage || !store.statusImagePath) return;
    store.setIsGeneratingVideo(true);
    setVideoUrl(null);
    generateVideoQueryFromImage(store.statusImagePath).then(async ([title, punchline]) => {
      store.setVideoTitle(title);
      store.setVideoPunchline(punchline);
      const video = await searchShortVideo(punchline || title || 'funny reaction');
      if (video?.url) setVideoUrl(video.url);
    }).catch((e) => {
      console.warn('[VideoContent] Generation error:', e);
      store.setVideoTitle('ALERTE');
      store.setVideoPunchline('C\'EST CHAUD !');
    }).finally(() => store.setIsGeneratingVideo(false));
  }, [hasImage]);

  useEffect(() => {
    if (!hasImage) return;
    const dur = 4000 / (store.videoZoomSpeed || 1);
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(zoomAnim, { toValue: 1.3, duration: dur, useNativeDriver: true }),
          Animated.timing(panXAnim, { toValue: 20, duration: dur, useNativeDriver: true }),
          Animated.timing(panYAnim, { toValue: -10, duration: dur, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(zoomAnim, { toValue: 1.0, duration: dur, useNativeDriver: true }),
          Animated.timing(panXAnim, { toValue: -15, duration: dur, useNativeDriver: true }),
          Animated.timing(panYAnim, { toValue: 10, duration: dur, useNativeDriver: true }),
        ]),
      ]),
    ).start();
    return () => { zoomAnim.setValue(1); panXAnim.setValue(0); panYAnim.setValue(0); };
  }, [store.videoZoomSpeed, hasImage]);

  const handleGenerateVideo = async () => {
    setIsGeneratingVideo(true);
    setVideoUrl(null);
    try {
      const query = store.videoPunchline || store.videoTitle || store.contextInput || 'funny celebration';
      if (store.statusImagePath) {
        const [title, punchline] = await generateVideoQueryFromImage(store.statusImagePath);
        store.setVideoTitle(title);
        store.setVideoPunchline(punchline);
      }
      const video = await searchShortVideo(query);
      if (video?.url) {
        setVideoUrl(video.url);
      } else {
        Alert.alert('Vidéo', 'Aucune vidéo trouvée. Vérifie la clé Pexels dans config.ts');
      }
    } catch (e) {
      console.warn('[Video] generate error:', e);
      Alert.alert('Erreur', 'Impossible de charger la vidéo');
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleSave = async () => {
    const meme = await saveMeme({
      type: 'VIDEO',
      contextText: store.contextInput,
      topText: store.videoTitle,
      bottomText: store.videoPunchline,
      bgImageUri: store.statusImagePath,
    });
    store.addSavedMeme(meme);
    Alert.alert(t('video_saved', store.currentLanguage));
  };

  return (
    <View style={[styles.subSection, { backgroundColor: derived.cardBackground, borderColor: derived.borderColor }]}>
      <Text style={[styles.subTitle, { color: derived.textColor }]}>{t('video_title', store.currentLanguage)}</Text>
      <Text style={[styles.subDesc, { color: derived.secondaryTextColor }]}>{t('video_desc', store.currentLanguage)}</Text>

      <Text style={[styles.paramLabel, { color: derived.textColor }]}>Mouvement / Effet :</Text>
      <TextInput
        value={store.videoTitle}
        onChangeText={store.setVideoTitle}
        placeholder="Ex: zoom avant lent sur le sujet"
        placeholderTextColor="#686868"
        style={[styles.input, { color: derived.textColor, borderColor: derived.borderColor }]}
      />
      <Text style={[styles.paramLabel, { color: derived.textColor }]}>Punchline :</Text>
      <TextInput
        value={store.videoPunchline}
        onChangeText={store.setVideoPunchline}
        placeholder="Texte affiché dans la vidéo"
        placeholderTextColor="#686868"
        style={[styles.input, { color: derived.textColor, borderColor: derived.borderColor }]}
      />
      <Text style={[styles.paramLabel, { color: derived.textColor }]}>Vitesse zoom :</Text>
      <TextInput
        value={String(store.videoZoomSpeed || 1)}
        onChangeText={(v) => store.setVideoZoomSpeed(Math.max(0.3, Math.min(3, Number(v) || 1)))}
        keyboardType="decimal-pad"
        style={[styles.input, { color: derived.textColor, borderColor: derived.borderColor }]}
      />

      <View style={styles.actionRow}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleGenerateVideo}
          disabled={isGeneratingVideo}
          style={{ borderRadius: 9999, overflow: 'hidden', flex: 1 }}
        >
          <LinearGradient colors={['#EF4444', '#DC2626']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ paddingVertical: 12, alignItems: 'center', borderRadius: 9999 }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>
              {isGeneratingVideo ? '...' : '🎬 CHARGER SHORT VIDÉO'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtnGif, { backgroundColor: '#FFFFFF' }]} onPress={handleSave}>
          <Text style={[styles.actionBtnGifText, { color: '#0A0A0A' }]}>💾 SAVE</Text>
        </TouchableOpacity>
      </View>

      {videoUrl ? (
        <View style={[styles.stickerPreview, { borderColor: derived.borderColor, borderRadius: 16, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }]}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14, marginBottom: 8 }}>✅ Vidéo prête</Text>
          <TouchableOpacity
            onPress={() => Linking.openURL(videoUrl).catch(() => Alert.alert('Erreur', 'Impossible d\'ouvrir la vidéo'))}
            style={{ backgroundColor: theme.accentColor, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 }}
          >
            <Text style={{ color: '#fff', fontWeight: '800' }}>▶ LIRE LA VIDÉO</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.stickerPreview, { borderColor: derived.borderColor, borderRadius: 16, overflow: 'hidden' }]}>
          {hasImage ? (
            <Animated.Image source={{ uri: store.statusImagePath ?? undefined }} style={[StyleSheet.absoluteFill, { transform: [{ scale: zoomAnim }, { translateX: panXAnim }, { translateY: panYAnim }] }]} resizeMode="cover" />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.baseColor }]} />
          )}
          {store.videoPunchline ? (
            <View style={{ position: 'absolute', bottom: 12, left: 0, right: 0, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18, textShadowColor: '#000', textShadowRadius: 4, textShadowOffset: { width: 1, height: 1 } }}>
                {store.videoPunchline.toUpperCase()}
              </Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}


export default function StatusRemixerScreen() {
  const store = useStore();
  const theme = themes[store.currentTheme as keyof typeof themes] || themes['Dark Void'];
  const derived = getDerivedColors(theme);

  const processImage = (uri: string) => {
    store.setStatusImagePath(uri);
    store.setIsAnalyzingStatusImage(true);
    analyzeImageForMeme(uri).then(([top, bottom]) => {
      store.setStatusTopText(top);
      store.setStatusBottomText(bottom);
    }).finally(() => store.setIsAnalyzingStatusImage(false));
  };

  const handlePickImage = async () => {
    const ok = await requestGalleryPermission();
    if (!ok) { showPermissionDenied('gallery'); return; }
    try {
      launchImageLibrary(
        { mediaType: 'photo', quality: 0.8, selectionLimit: 1 },
        (response) => {
          if (response.didCancel) {
            console.log('[StatusRemixer] Image selection cancelled');
            return;
          }
          if (response.errorCode) {
            console.warn('[StatusRemixer] Image picker error:', response.errorMessage);
            Alert.alert('❌ Erreur Galerie', response.errorMessage || 'Impossible d\'accéder à la galerie');
            return;
          }
          const uri = response.assets?.[0]?.uri;
          if (uri) {
            console.log('[StatusRemixer] Image selected:', uri);
            processImage(uri);
          }
        },
      );
    } catch (e) {
      console.warn('[StatusRemixer] launchImageLibrary error:', e);
      Alert.alert('❌ Erreur', 'Impossible d\'ouvrir la galerie');
    }
  };

  const handleTakePhoto = async () => {
    const ok = await requestCameraPermission();
    if (!ok) { showPermissionDenied('camera'); return; }
    try {
      launchCamera(
        { mediaType: 'photo', quality: 0.8, saveToPhotos: false, cameraType: 'back' },
        (response) => {
          if (response.didCancel) {
            console.log('[StatusRemixer] Camera cancelled');
            return;
          }
          if (response.errorCode) {
            console.warn('[StatusRemixer] Camera error:', response.errorCode, response.errorMessage);
            Alert.alert('❌ Erreur Caméra', response.errorMessage || 'Impossible d\'accéder à la caméra. Vérifie les permissions.');
            return;
          }
          const uri = response.assets?.[0]?.uri;
          if (uri) {
            console.log('[StatusRemixer] Photo taken:', uri);
            processImage(uri);
          }
        },
      );
    } catch (e) {
      console.warn('[StatusRemixer] launchCamera error:', e);
      Alert.alert('❌ Erreur Caméra', (e instanceof Error ? e.message : 'Impossible de lancer la caméra'));
    }
  };

  const handleAnalyze = async () => {
    if (!store.statusImagePath) return;
    store.setIsAnalyzingStatusImage(true);
    try {
      const [top, bottom] = await analyzeImageForMeme(store.statusImagePath);
      store.setStatusTopText(top);
      store.setStatusBottomText(bottom);
    } finally {
      store.setIsAnalyzingStatusImage(false);
    }
  };

  const handleSave = async () => {
    const meme = await saveMeme({
      type: 'IMAGE',
      contextText: store.contextInput,
      topText: store.statusTopText,
      bottomText: store.statusBottomText,
      bgImageUri: store.statusImagePath,
    });
    store.addSavedMeme(meme);
    Alert.alert(t('save_success', store.currentLanguage));
  };

  const handleShare = () => shareMeme({ topText: store.statusTopText, bottomText: store.statusBottomText });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subModeRow}>
        {subModes.map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[
              styles.subModeChip,
              store.statusSubMode === mode
                ? { backgroundColor: theme.accentColor, borderColor: theme.accentColor }
                : { backgroundColor: derived.cardBackground, borderColor: derived.borderColor },
            ]}
            onPress={() => store.setStatusSubMode(mode)}
          >
            <Text style={[
              styles.subModeText,
              { color: store.statusSubMode === mode ? '#fff' : derived.textColor },
            ]}>
              {subModeLabels[mode]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {store.statusSubMode === 'PHOTO_REMIXER' && (
        <>
          <View style={[styles.aiCard, { backgroundColor: 'rgba(29,29,29,0.85)', borderColor: 'rgba(229,229,229,0.08)' }]}>
            <View style={[StyleSheet.absoluteFill, { opacity: 0.2 }]}>
              <View style={{ position: 'absolute', top: -40, left: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: theme.spotlightColor, opacity: 0.2 }} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, zIndex: 1 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#3D3D3D', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 24, color: '#E5E5E5' }}>📸</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#E5E5E5', fontSize: 14, fontWeight: '600' }}>Status Remixer Photo AI</Text>
                <Text style={{ color: '#C2C2C2', fontSize: 11 }}>Upload or select a photo to begin</Text>
              </View>
            </View>
          </View>

          <View style={[styles.descCard, { backgroundColor: 'rgba(29,29,29,0.85)', borderColor: 'rgba(229,229,229,0.08)' }]}>
            <Text style={[styles.descTitle, { color: '#E5E5E5' }]}>
              {t('photo_remixer_title', store.currentLanguage)}
            </Text>
            <Text style={[styles.descText, { color: '#C2C2C2' }]}>
              {t('photo_remixer_desc', store.currentLanguage)}
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.galleryBtn, { backgroundColor: theme.accentColor }]}
              onPress={handlePickImage}
            >
              <Text style={styles.galleryBtnText}>{t('gallery', store.currentLanguage)}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cameraBtn, { backgroundColor: theme.spotlightColor }]}
              onPress={handleTakePhoto}
            >
              <Text style={styles.cameraBtnText}>📷 {t('photo', store.currentLanguage)}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.editBtn,
                store.showImageEditor
                  ? { backgroundColor: derived.textColor, borderColor: derived.textColor }
                  : { backgroundColor: derived.cardBackground, borderColor: derived.borderColor },
              ]}
              onPress={() => store.setShowImageEditor(!store.showImageEditor)}
            >
              <Text style={[
                styles.editBtnText,
                { color: store.showImageEditor ? theme.baseColor : derived.textColor },
              ]}>
                {t('edit', store.currentLanguage)}
              </Text>
            </TouchableOpacity>
          </View>

          {store.showImageEditor && <DirectImageEditor />}

          <TextInput
            style={[styles.textInput, { color: derived.textColor, borderColor: derived.borderColor, backgroundColor: 'transparent' }]}
            placeholder="Legende superieure (Haut)"
            placeholderTextColor={derived.secondaryTextColor}
            value={store.statusTopText}
            onChangeText={store.setStatusTopText}
          />
          <TextInput
            style={[styles.textInput, { color: derived.textColor, borderColor: derived.borderColor, backgroundColor: 'transparent' }]}
            placeholder="Legende inferieure (Bas)"
            placeholderTextColor={derived.secondaryTextColor}
            value={store.statusBottomText}
            onChangeText={store.setStatusBottomText}
          />

          {store.isAnalyzingStatusImage && (
            <View style={[styles.analyzingCard, { backgroundColor: derived.cardBackground }]}>
              <Text style={[styles.analyzingText, { color: derived.secondaryTextColor }]}>
                {t('ai_analysis', store.currentLanguage)}
              </Text>
            </View>
          )}

          {(store.statusTopText || store.statusBottomText) && (
            <>
              <MemeCardPreview
                templateIndex={store.selectedPresetBgIndex}
                topText={store.statusTopText}
                bottomText={store.statusBottomText}
                customBgUri={store.statusImagePath}
              />
              <View style={styles.actions}>
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#FFFFFF' }]} onPress={handleSave}>
                  <Text style={[styles.actionBtnText, { color: '#0A0A0A' }]}>{t('save', store.currentLanguage)}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.shareBtn, { backgroundColor: derived.cardBackground, borderColor: derived.borderColor, borderWidth: 1 }]}
                  onPress={handleShare}
                >
                  <Text style={[styles.actionBtnText, { color: derived.textColor }]}>{t('share', store.currentLanguage)}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {(store.contextInput.trim() || store.statusTopText.trim()) && (
            <MultimediaStudioSection contextText={store.contextInput || store.statusTopText} />
          )}
        </>
      )}

      {store.statusSubMode === 'STICKER' && <StickerContent />}
      {store.statusSubMode === 'GIF' && <GifContent />}
      {store.statusSubMode === 'VIDEO' && <VideoContent />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  subModeRow: { flexDirection: 'row', gap: 8 },
  subModeChip: {
    borderRadius: 9999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  subModeText: { fontSize: 12, fontWeight: '700' },
  aiCard: { borderRadius: 24, borderWidth: 1, padding: 16, overflow: 'hidden' },
  descCard: { borderRadius: 24, borderWidth: 1, padding: 16 },
  descTitle: { fontSize: 16, fontWeight: '700' },
  descText: { fontSize: 12, lineHeight: 16, marginTop: 6, color: '#C2C2C2' },
  buttonRow: { flexDirection: 'row', gap: 12 },
  galleryBtn: {
    flex: 1.3,
    borderRadius: 9999,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  galleryBtnText: { color: '#fff', fontWeight: '700', fontSize: 11 },
  cameraBtn: {
    flex: 1,
    borderRadius: 9999,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  cameraBtnText: { color: '#fff', fontWeight: '700', fontSize: 11 },
  editBtn: {
    flex: 1,
    borderRadius: 9999,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  editBtnText: { fontSize: 11, fontWeight: '700' },
  editorPanel: { gap: 12 },
  editorTitle: { fontSize: 14, fontWeight: '700' },
  canvas: {
    height: 200,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  drawingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  drawingHint: { fontSize: 11, fontStyle: 'italic', textAlign: 'center' },
  colorPalette: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sliderLabel: { fontSize: 11, width: 80 },
  sliderTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  sliderFill: { height: 6, borderRadius: 3 },
  sliderVal: { fontSize: 11, width: 45, textAlign: 'right' },
  filterSectionTitle: { fontSize: 12, fontWeight: '600' },
  filterChip: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  filterText: { fontSize: 11, fontWeight: '600' },
  textInput: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    fontSize: 13,
  },
  analyzingCard: { borderRadius: 12, padding: 12, alignItems: 'center' },
  analyzingText: { fontSize: 11, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 12 },
  saveBtn: {
    borderRadius: 9999,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  saveBtnText: { fontSize: 14, fontWeight: '700' },
  shareBtn: {
    borderRadius: 9999,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  actionBtnText: { fontSize: 14, fontWeight: '700' },
  subSection: { borderRadius: 24, borderWidth: 1, padding: 16, gap: 12 },
  subTitle: { fontSize: 16, fontWeight: '700' },
  subDesc: { fontSize: 12, lineHeight: 16, color: '#C2C2C2' },
  paramLabel: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  chip: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: { fontSize: 11, fontWeight: '500' },
  input: { borderRadius: 10, borderWidth: 1, padding: 8, fontSize: 14, width: 80 },
  stickerPreview: {
    width: 240,
    height: 240,
    alignSelf: 'center',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  stickerTextBg: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginTop: 8 },
  stickerText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  gifQueryText: { fontSize: 12, marginTop: 8, textAlign: 'center' },
  videoPreview: {
    width: 180,
    height: 320,
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 12,
  },
  videoTitle: { fontSize: 14, fontWeight: '800', textAlign: 'center' },
  videoPunchline: { fontSize: 10, textAlign: 'center', marginTop: 4 },
  playBtn: { borderRadius: 9999, height: 44, justifyContent: 'center', alignItems: 'center' },
  playBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  vinyl: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  vinylInner: { width: 20, height: 20, borderRadius: 10 },
  spectrum: { flexDirection: 'row', gap: 4, alignItems: 'flex-end' },
  spectrumBar: { width: 6, borderRadius: 3 },
  actionRow: { flexDirection: 'row', gap: 12, justifyContent: 'center', marginTop: 8 },
  actionBtnGif: {
    borderRadius: 9999,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  actionBtnGifText: { fontWeight: '700', fontSize: 12 },
});
