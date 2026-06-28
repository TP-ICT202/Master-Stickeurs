import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, TextInput, ScrollView, Alert, Image, Linking,
} from 'react-native';
import { Sparkles, Save, Settings, Clapperboard, Smile, Frown, AlertTriangle, Music2, Play, X } from 'lucide-react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import { useStore } from '../store/useStore';
import { themes, getDerivedColors } from '../theme/colors';
import { t } from '../utils/i18n';
import {
  generateStickerSuggestion, generateGifSearchQuery, generateVideoStoryboard,
  generateStickerFromImage, generateGifQueryFromImage, generateVideoQueryFromImage,
  removeImageBackground,
} from '../services/gemini';
import { searchGifs, FALLBACK_GIFS } from '../services/giphy';
import { searchShortVideo, searchShortVideos } from '../services/pexels';
import { saveMeme } from '../services/database';

const moods = ['LOL', 'PANIQUE', 'COLERE', 'DANSE'] as const;
const moodIcons: Record<string, React.ElementType> = { LOL: Smile, PANIQUE: Frown, COLERE: AlertTriangle, DANSE: Music2 };
const videoEffects = ['Cyber Glow', 'Retro Wave', 'VHS Grain', 'Neon Pulse', 'Vaporwave'] as const;
const TEXT_POSITIONS = ['bottom', 'top', 'left', 'right'] as const;

export default function MultimediaStudioSection({ contextText }: { contextText?: string }) {
  const store = useStore();
  const theme = themes[store.currentTheme as keyof typeof themes] || themes['Dark Void'];
  const derived = getDerivedColors(theme);
  const ctx = contextText || store.contextInput;
  const [isOpen, setIsOpen] = useState(false);

  if (!ctx.trim()) return null;

  return (
    <View style={styles.section}>
      <TouchableOpacity
        onPress={() => setIsOpen(!isOpen)}
        style={[styles.toggleBtn, { backgroundColor: derived.cardBackground, borderColor: derived.borderColor }]}
      >
        <Sparkles size={16} color={derived.textColor} strokeWidth={1.5} />
        <Text style={[styles.toggleText, { color: derived.textColor }]}>
          {isOpen ? '▼' : '▶'} Mème Studio
        </Text>
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.content}>
          <StickerContent contextText={ctx} />
          <GifContent contextText={ctx} />
          <VideoContent contextText={ctx} />
        </View>
      )}
    </View>
  );
}

function StickerContent({ contextText }: { contextText: string }) {
  const store = useStore();
  const theme = themes[store.currentTheme as keyof typeof themes] || themes['Dark Void'];
  const derived = getDerivedColors(theme);
  const [inputEmoji, setInputEmoji] = useState('');
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editVal, setEditVal] = useState('');
  const [extractedImageUri, setExtractedImageUri] = useState<string | null>(null);

  const handleGenerate = async () => {
    store.setIsGeneratingSticker(true);
    try {
      if (store.statusImagePath) {
        const uri = await removeImageBackground(store.statusImagePath);
        if (uri) setExtractedImageUri(uri);
        const [emoji, text] = await generateStickerFromImage(store.statusImagePath);
        store.setStickerEmoji(emoji);
        store.setStickerText(text);
      } else {
        const [emoji, text] = await generateStickerSuggestion(contextText);
        store.setStickerEmoji(emoji);
        store.setStickerText(text);
      }
    } finally {
      store.setIsGeneratingSticker(false);
    }
  };

  const handleSave = async () => {
    try {
      const meme = await saveMeme({
        type: 'STICKER', contextText,
        topText: store.stickerEmoji, bottomText: store.stickerText,
      });
      store.addSavedMeme(meme);
      Alert.alert(t('sticker_saved', store.currentLanguage));
    } catch { Alert.alert('Erreur', 'Echec sauvegarde'); }
  };

  return (
    <View style={[styles.subSection, { backgroundColor: derived.cardBackground, borderColor: derived.borderColor }]}>
      <Text style={[styles.subTitle, { color: derived.textColor }]}>{t('sticker_title', store.currentLanguage)}</Text>
      <Text style={[styles.subDesc, { color: derived.secondaryTextColor }]}>{t('sticker_desc', store.currentLanguage)}</Text>

      {!store.statusImagePath && (
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

      {store.statusImagePath && (
        <Text style={[styles.paramLabel, { color: derived.textColor }]}>
          Position du texte :
        </Text>
      )}
      {store.statusImagePath && (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {TEXT_POSITIONS.map((pos) => (
            <TouchableOpacity
              key={pos}
              style={[styles.chip, { borderColor: derived.borderColor }, store.stickerTextPosition === pos && { backgroundColor: theme.accentColor }]}
              onPress={() => store.setStickerTextPosition(pos)}
            >
              <Text style={[styles.chipText, { color: store.stickerTextPosition === pos ? '#fff' : derived.textColor }]}>{pos}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!store.statusImagePath && (
        <>
          <Text style={[styles.paramLabel, { color: derived.textColor }]}>
            {t('sticker_speed', store.currentLanguage) || 'Animation :'}
          </Text>
          <TextInput
            value={String(store.stickerAnimationSpeed)}
            onChangeText={(v) => store.setStickerAnimationSpeed(Math.max(0.5, Math.min(2, Number(v) || 1)))}
            keyboardType="decimal-pad"
            style={[styles.smallInput, { color: derived.textColor, borderColor: derived.borderColor }]}
          />
        </>
      )}

      <StickerPreview extractedUri={extractedImageUri} />
      {store.statusImagePath && store.stickerText ? (
        <Text style={[styles.positionHint, { color: derived.secondaryTextColor }]}>
          Texte placé en {store.stickerTextPosition || 'bottom'}
        </Text>
      ) : null}

      <View style={styles.actionRow}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleGenerate}
          disabled={store.isGeneratingSticker}
          style={{ borderRadius: 9999, overflow: 'hidden', flex: 1 }}
        >
          <LinearGradient colors={['#8B5CF6', '#6366F1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ paddingVertical: 12, alignItems: 'center', borderRadius: 9999 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {!store.isGeneratingSticker && <Sparkles size={14} color="#fff" strokeWidth={2} />}
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>
                {store.isGeneratingSticker ? '...' : 'GÉNÉRER'}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', gap: 4 }]} onPress={handleSave}>
          <Save size={14} color="#0A0A0A" strokeWidth={2} />
          <Text style={[styles.actionBtnText, { color: '#0A0A0A' }]}>
            {t('sticker_save', store.currentLanguage) || 'SAUVEGARDER'}
          </Text>
        </TouchableOpacity>
      </View>

      {!store.statusImagePath && (
        <View style={[styles.configPanel, { backgroundColor: derived.cardBackground, borderColor: derived.borderColor }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Settings size={14} color={derived.textColor} strokeWidth={1.5} />
            <Text style={[styles.configTitle, { color: derived.textColor }]}>
              {t('config_title', store.currentLanguage) || 'Configuration Manuelle'}
            </Text>
          </View>
          <TouchableOpacity onPress={store.clearStickerOutput} style={{ alignSelf: 'flex-end' }}>
            <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: '700' }}>{t('clear_output', store.currentLanguage) || 'Vider Sortie'}</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Sparkles size={12} color={derived.secondaryTextColor} strokeWidth={1.5} />
            <Text style={[styles.configSubtitle, { color: derived.secondaryTextColor }]}>
              {t('ready_emojis', store.currentLanguage) || 'Éléments prêts (Tap pour insérer) :'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {store.readyToUseEmojis.map((emoji, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.emojiChip, { borderColor: derived.borderColor }]}
                onPress={() => { store.setStickerEmoji(emoji); setEditIdx(i); setEditVal(emoji); }}
              >
                <Text style={{ fontSize: 18 }}>{emoji}</Text>
                <TouchableOpacity onPress={() => store.deleteReadyToUseEmoji(emoji)}>
                  <X size={12} color="#EF4444" strokeWidth={2} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>

          {editIdx !== null && (
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <TextInput value={editVal} onChangeText={setEditVal}
                style={[styles.editInput, { color: derived.textColor, borderColor: derived.borderColor }]}
                onSubmitEditing={() => { store.editReadyToUseEmoji(store.readyToUseEmojis[editIdx], editVal); setEditIdx(null); }} />
              <TouchableOpacity onPress={() => { store.editReadyToUseEmoji(store.readyToUseEmojis[editIdx], editVal); setEditIdx(null); }} style={[styles.smallBtn, { backgroundColor: theme.accentColor }]}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>OK</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setEditIdx(null)} style={styles.smallBtn}>
                <X size={12} color={derived.secondaryTextColor} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <TextInput value={inputEmoji} onChangeText={setInputEmoji}
              placeholder={t('new_emoji', store.currentLanguage) || 'Nouveau...'}
              placeholderTextColor={derived.secondaryTextColor}
              style={[styles.editInput, { color: derived.textColor, borderColor: derived.borderColor }]}
              onSubmitEditing={() => { if (inputEmoji.trim()) { store.addReadyToUseEmoji(inputEmoji.trim()); setInputEmoji(''); } }} />
            <TouchableOpacity
              onPress={() => { if (inputEmoji.trim()) { store.addReadyToUseEmoji(inputEmoji.trim()); setInputEmoji(''); } }}
              style={[styles.smallBtn, { backgroundColor: theme.accentColor }]}>
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

function StickerPreview({ extractedUri }: { extractedUri?: string | null }) {
  const store = useStore();
  const theme = themes[store.currentTheme as keyof typeof themes] || themes['Dark Void'];
  const derived = getDerivedColors(theme);
  const hasImage = !!store.statusImagePath;
  const displayUri = extractedUri || store.statusImagePath;

  const getPositionStyle = () => {
    const pos = store.stickerTextPosition || 'bottom';
    switch (pos) {
      case 'top': return { top: 8, alignSelf: 'center' as const };
      case 'left': return { left: 8, alignSelf: 'flex-start' as const, top: '45%' as any };
      case 'right': return { right: 8, alignSelf: 'flex-end' as const, top: '45%' as any };
      default: return { bottom: 8, alignSelf: 'center' as const };
    }
  };

  if (hasImage) {
    return (
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
        <Image source={{ uri: displayUri ?? undefined }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        {store.stickerText ? (
          <View style={[styles.stickerTextBg, {
            backgroundColor: 'rgba(0,0,0,0.6)',
            borderRadius: 20,
            ...getPositionStyle(),
          }]}>
            <Text style={styles.stickerText}>{store.stickerText.toUpperCase()}</Text>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.stickerPreview,
        {
          borderColor: derived.borderColor,
          borderRadius: store.stickerShape === 'Circle' ? 120 : store.stickerShape === 'Rounded' ? 24 : 12,
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
  );
}

function GifContent({ contextText }: { contextText: string }) {
  const store = useStore();
  const theme = themes[store.currentTheme as keyof typeof themes] || themes['Dark Void'];
  const derived = getDerivedColors(theme);
  const kenScale = useRef(new Animated.Value(1)).current;
  const kenX = useRef(new Animated.Value(0)).current;
  const kenY = useRef(new Animated.Value(0)).current;
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [gifResults, setGifResults] = useState<{ url: string; previewUrl: string; title: string }[]>([...FALLBACK_GIFS].sort(() => Math.random() - 0.5).slice(0, 6));
  const hasImage = !!store.statusImagePath;

  useEffect(() => {
    if (!hasImage) return;
    const dur = 3000 / store.gifPlaybackSpeed;
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(kenScale, { toValue: 1.35, duration: dur, useNativeDriver: true }),
          Animated.timing(kenX, { toValue: 25, duration: dur, useNativeDriver: true }),
          Animated.timing(kenY, { toValue: 0, duration: dur, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(kenScale, { toValue: 1.0, duration: dur, useNativeDriver: true }),
          Animated.timing(kenX, { toValue: -15, duration: dur, useNativeDriver: true }),
          Animated.timing(kenY, { toValue: 0, duration: dur, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(kenScale, { toValue: 1.15, duration: dur, useNativeDriver: true }),
          Animated.timing(kenX, { toValue: 0, duration: dur, useNativeDriver: true }),
          Animated.timing(kenY, { toValue: 0, duration: dur, useNativeDriver: true }),
        ]),
      ]),
    ).start();
    return () => { kenScale.setValue(1); kenX.setValue(0); kenY.setValue(0); };
  }, [store.gifPlaybackSpeed, hasImage]);

  const handleGenerate = async () => {
    store.setIsSearchingGif(true);
    try {
      const q = store.statusImagePath
        ? await generateGifQueryFromImage(store.statusImagePath)
        : await generateGifSearchQuery(contextText);
      store.setGifQuery(q);
      const results = await searchGifs(q, 6);
      if (results.length > 0) {
        setGifResults(results);
        setGifUrl(results[0].url);
      }
    } finally {
      store.setIsSearchingGif(false);
    }
  };

  const handleSave = async () => {
    try {
      const meme = await saveMeme({
        type: 'GIF', contextText,
        topText: store.selectedGifMood, bottomText: store.gifQuery,
      });
      store.addSavedMeme(meme);
      Alert.alert(t('gif_saved', store.currentLanguage));
    } catch { Alert.alert('Erreur', 'Echec sauvegarde'); }
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
            {moods.map((mood) => (
              <TouchableOpacity
                key={mood}
                style={[styles.chip, { borderColor: derived.borderColor }, store.selectedGifMood === mood && { backgroundColor: theme.accentColor }]}
                onPress={() => store.setSelectedGifMood(mood)}
              >
                <Text style={[styles.chipText, { color: store.selectedGifMood === mood ? '#fff' : derived.textColor }]}>
                  {moodEmojis[mood]} {mood === 'LOL' ? 'Rire' : mood === 'PANIQUE' ? 'Panique' : mood === 'COLERE' ? 'Colère' : 'Danse'}
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
        style={[styles.smallInput, { color: derived.textColor, borderColor: derived.borderColor }]}
      />

      {gifResults.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 120 }}>
          <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}>
            {gifResults.map((gif, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setGifUrl(gif.url)}
                style={{
                  width: 100, height: 100, borderRadius: 12, overflow: 'hidden',
                  borderWidth: gif.url === gifUrl ? 3 : 1,
                  borderColor: gif.url === gifUrl ? theme.accentColor : derived.borderColor,
                }}
              >
                <Image source={{ uri: gif.previewUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

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
          {!hasImage && (() => {
            const MI = moodIcons[store.selectedGifMood];
            return MI ? <MI size={80} color={derived.secondaryTextColor} strokeWidth={1} /> : <Smile size={80} color={derived.secondaryTextColor} strokeWidth={1} />;
          })()}
          {!hasImage && <Text style={[styles.gifQueryText, { color: derived.textColor }]}>{store.gifQuery}</Text>}
        </Animated.View>
      )}

      <View style={styles.actionRow}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleGenerate}
          disabled={store.isSearchingGif}
          style={{ borderRadius: 9999, overflow: 'hidden', flex: 1 }}
        >
          <LinearGradient colors={['#8B5CF6', '#6366F1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ paddingVertical: 12, alignItems: 'center', borderRadius: 9999 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {!store.isSearchingGif && <Sparkles size={14} color="#fff" strokeWidth={2} />}
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>
                {store.isSearchingGif ? '...' : 'GÉNÉRER'}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', gap: 4 }]} onPress={handleSave}>
          <Save size={14} color="#0A0A0A" strokeWidth={2} />
          <Text style={[styles.actionBtnText, { color: '#0A0A0A' }]}>
            {t('gif_save', store.currentLanguage) || 'SAUVEGARDER'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function VideoContent({ contextText }: { contextText: string }) {
  const store = useStore();
  const theme = themes[store.currentTheme as keyof typeof themes] || themes['Dark Void'];
  const derived = getDerivedColors(theme);
  const zoomAnim = useRef(new Animated.Value(1)).current;
  const panXAnim = useRef(new Animated.Value(0)).current;
  const panYAnim = useRef(new Animated.Value(0)).current;
  const hasImage = !!store.statusImagePath;
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoResults, setVideoResults] = useState<{ url: string; previewUrl: string; title: string }[]>([]);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);

  useEffect(() => {
    if (!hasImage) return;
    const dur = 4000 / (store.videoZoomSpeed || 1);
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(zoomAnim, { toValue: 1.3, duration: dur, useNativeDriver: true }),
          Animated.timing(panXAnim, { toValue: 20, duration: dur, useNativeDriver: true }),
          Animated.timing(panYAnim, { toValue: 0, duration: dur, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(zoomAnim, { toValue: 1.0, duration: dur, useNativeDriver: true }),
          Animated.timing(panXAnim, { toValue: -15, duration: dur, useNativeDriver: true }),
          Animated.timing(panYAnim, { toValue: 0, duration: dur, useNativeDriver: true }),
        ]),
      ]),
    ).start();
    return () => { zoomAnim.setValue(1); panXAnim.setValue(0); panYAnim.setValue(0); };
  }, [store.videoZoomSpeed, hasImage]);

  const handleGenerateVideo = async () => {
    if (!contextText.trim() && !store.statusImagePath) return;
    setIsGeneratingVideo(true);
    setVideoUrl(null);
    setVideoResults([]);
    try {
      let query = contextText || 'funny celebration';
      if (store.statusImagePath) {
        const [title, punchline] = await generateVideoQueryFromImage(store.statusImagePath);
        store.setVideoTitle(title);
        store.setVideoPunchline(punchline);
        query = punchline || title;
      } else {
        const [title, punchline] = await generateVideoStoryboard(contextText);
        store.setVideoTitle(title);
        store.setVideoPunchline(punchline);
        query = punchline || title;
      }
      const results = await searchShortVideos(query, 4);
      setVideoResults(results);
      if (results.length > 0) {
        setVideoUrl(results[0].url);
      } else {
        Alert.alert('Vidéo', 'Aucune vidéo Pexels trouvée pour cette recherche.');
      }
    } catch (e) {
      console.warn('[Video] generate error:', e);
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleSave = async () => {
    try {
      const meme = await saveMeme({
        type: 'VIDEO', contextText,
        topText: store.videoTitle, bottomText: store.videoPunchline,
        bgImageUri: store.statusImagePath,
      });
      store.addSavedMeme(meme);
      Alert.alert(t('video_saved', store.currentLanguage));
    } catch { Alert.alert('Erreur', 'Echec sauvegarde'); }
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
        style={[styles.smallInput, { color: derived.textColor, borderColor: derived.borderColor, width: '100%' }]}
      />
      <Text style={[styles.paramLabel, { color: derived.textColor }]}>Punchline :</Text>
      <TextInput
        value={store.videoPunchline}
        onChangeText={store.setVideoPunchline}
        placeholder="Texte affiché dans la vidéo"
        placeholderTextColor="#686868"
        style={[styles.smallInput, { color: derived.textColor, borderColor: derived.borderColor, width: '100%' }]}
      />
      <Text style={[styles.paramLabel, { color: derived.textColor }]}>Vitesse zoom :</Text>
      <TextInput
        value={String(store.videoZoomSpeed || 1)}
        onChangeText={(v) => store.setVideoZoomSpeed(Math.max(0.3, Math.min(3, Number(v) || 1)))}
        keyboardType="decimal-pad"
        style={[styles.smallInput, { color: derived.textColor, borderColor: derived.borderColor, width: 80 }]}
      />

      {videoResults.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 120 }}>
          <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}>
            {videoResults.map((v, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setVideoUrl(v.url)}
                style={{
                  width: 100, height: 100, borderRadius: 12, overflow: 'hidden',
                  borderWidth: v.url === videoUrl ? 3 : 1,
                  borderColor: v.url === videoUrl ? theme.accentColor : derived.borderColor,
                  backgroundColor: '#000',
                }}
              >
                <Image source={{ uri: v.previewUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      <View style={styles.actionRow}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleGenerateVideo}
          disabled={isGeneratingVideo}
          style={{ borderRadius: 9999, overflow: 'hidden', flex: 1 }}
        >
          <LinearGradient colors={['#EF4444', '#DC2626']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ paddingVertical: 12, alignItems: 'center', borderRadius: 9999 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {!isGeneratingVideo && <Clapperboard size={14} color="#fff" strokeWidth={2} />}
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>
                {isGeneratingVideo ? '...' : 'CHARGER SHORT VIDÉO'}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', gap: 4 }]} onPress={handleSave}>
          <Save size={14} color="#0A0A0A" strokeWidth={2} />
          <Text style={[styles.actionBtnText, { color: '#0A0A0A' }]}>SAVE</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.stickerPreview, { borderColor: derived.borderColor, borderRadius: 16, overflow: 'hidden' }]}>
        {videoUrl ? (
          <View style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', width: '100%', height: '100%' }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14, marginBottom: 8 }}>Video prete</Text>
            <TouchableOpacity
              onPress={() => Linking.openURL(videoUrl).catch(() => Alert.alert('Erreur', 'Impossible d\'ouvrir la vidéo'))}
              style={{ backgroundColor: theme.accentColor, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <Play size={16} color="#fff" strokeWidth={2} />
              <Text style={{ color: '#fff', fontWeight: '800' }}>LIRE LA VIDEO</Text>
            </TouchableOpacity>
          </View>
        ) : hasImage ? (
          <Animated.Image source={{ uri: store.statusImagePath ?? undefined }} style={[StyleSheet.absoluteFill, { transform: [{ scale: zoomAnim }, { translateX: panXAnim }, { translateY: panYAnim }] }]} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.baseColor }]} />
        )}
        {!videoUrl && store.videoPunchline ? (
          <View style={{ position: 'absolute', bottom: 12, left: 0, right: 0, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18, textShadowColor: '#000', textShadowRadius: 4, textShadowOffset: { width: 1, height: 1 } }}>
              {store.videoPunchline.toUpperCase()}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 16, gap: 12 },
  toggleBtn: { borderRadius: 24, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleText: { fontSize: 14, fontWeight: '600' },
  content: { gap: 16 },
  subSection: { borderRadius: 24, borderWidth: 1, padding: 16, gap: 12 },
  subTitle: { fontSize: 16, fontWeight: '700' },
  subDesc: { fontSize: 12, lineHeight: 16, color: '#C2C2C2' },
  paramLabel: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  chip: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, marginRight: 4 },
  chipText: { fontSize: 11, fontWeight: '500' },
  smallInput: { borderRadius: 10, borderWidth: 1, padding: 8, fontSize: 14, width: 80 },
  stickerPreview: {
    width: 240, height: 240, alignSelf: 'center', borderWidth: 1,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  stickerTextBg: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginTop: 8, position: 'absolute' },
  stickerText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  positionHint: { fontSize: 10, textAlign: 'center', fontStyle: 'italic' },
  gifQueryText: { fontSize: 12, marginTop: 8, textAlign: 'center' },
  actionRow: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  actionBtn: { borderRadius: 9999, paddingHorizontal: 24, paddingVertical: 12 },
  actionBtnText: { fontWeight: '700', fontSize: 12 },
  videoPreview: {
    width: 180, height: 320, alignSelf: 'center', borderWidth: 1, borderRadius: 16,
    overflow: 'hidden', justifyContent: 'space-around', alignItems: 'center', padding: 12,
  },
  videoTitle: { fontSize: 14, fontWeight: '800', textAlign: 'center' },
  videoPunchline: { fontSize: 10, textAlign: 'center', marginTop: 4 },
  playBtn: { borderRadius: 9999, height: 44, justifyContent: 'center', alignItems: 'center' },
  playBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  vinyl: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  vinylInner: { width: 20, height: 20, borderRadius: 10 },
  spectrum: { flexDirection: 'row', gap: 4, alignItems: 'flex-end', height: 80 },
  spectrumBar: { width: 6, borderRadius: 3 },
  configPanel: { borderRadius: 16, borderWidth: 1, padding: 12, gap: 8, marginTop: 8 },
  configTitle: { fontSize: 12, fontWeight: '600' },
  configSubtitle: { fontSize: 11 },
  emojiChip: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, gap: 2 },
  editInput: { borderWidth: 1, borderRadius: 8, padding: 6, flex: 1, fontSize: 14 },
  smallBtn: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
});
