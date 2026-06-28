import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, Animated,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import { Cpu, Sparkles, Image, RotateCcw, Save, Share2, Loader } from 'lucide-react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import { useStore } from '../store/useStore';
import { themes, getDerivedColors } from '../theme/colors';
import { t } from '../utils/i18n';
import MemeCardPreview from '../components/MemeCardPreview';
import MultimediaStudioSection from '../components/MultimediaStudioSection';
import {
  generateMemeTextSuggestions, generateImageFromPrompt,
} from '../services/gemini';
import { saveMeme } from '../services/database';
import { shareMeme } from '../utils/memeSaver';

export default function ContextReaderScreen() {
  const store = useStore();
  const theme = themes[store.currentTheme as keyof typeof themes] || themes['Dark Void'];
  const derived = getDerivedColors(theme);
  const memeViewRef = useRef<ViewShot>(null);
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (store.isLoadingTextMeme || store.isGeneratingTextImage) {
      Animated.loop(
        Animated.timing(spinAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ).start();
    } else {
      spinAnim.setValue(0);
    }
  }, [store.isLoadingTextMeme, store.isGeneratingTextImage]);

  const spinInterp = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleGenerateTextMeme = async () => {
    if (!store.textContextInput.trim()) return;
    store.setIsLoadingTextMeme(true);
    try {
      const [top, bottom] = await generateMemeTextSuggestions(store.textContextInput);
      store.setTextTopSuggestion(top);
      store.setTextBottomSuggestion(bottom);

      const uri = await generateImageFromPrompt(store.textContextInput);
      if (uri) store.setTextBgBitmap(uri);
      else Alert.alert(t('ai_bg_title', store.currentLanguage), 'Pollinations backup used.');
    } finally {
      store.setIsLoadingTextMeme(false);
    }
  };

  const handleGenerateAiBg = async () => {
    if (!store.textContextInput.trim()) return;
    store.setIsGeneratingTextImage(true);
    try {
      const uri = await generateImageFromPrompt(store.textContextInput);
      if (uri) store.setTextBgBitmap(uri);
    } finally {
      store.setIsGeneratingTextImage(false);
    }
  };

  const handleSave = async () => {
    try {
      const meme = await saveMeme({
        type: 'TEXT',
        contextText: store.textContextInput,
        topText: store.textTopSuggestion,
        bottomText: store.textBottomSuggestion,
        bgImageUri: store.textBgBitmap,
      });
      store.addSavedMeme(meme);
      Alert.alert(t('save_success', store.currentLanguage));
    } catch { Alert.alert('Erreur', 'Echec sauvegarde'); }
  };

  const handleShare = () => {
    shareMeme({ topText: store.textTopSuggestion, bottomText: store.textBottomSuggestion, viewRef: memeViewRef.current });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.aiCard, { backgroundColor: 'rgba(29,29,29,0.85)', borderColor: 'rgba(229,229,229,0.08)' }]}>
        <View style={[StyleSheet.absoluteFill, { opacity: 0.2 }]}>
          <View style={{ position: 'absolute', top: -40, left: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: theme.spotlightColor, opacity: 0.2 }} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, zIndex: 1 }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#3D3D3D', justifyContent: 'center', alignItems: 'center' }}>
            <Cpu size={22} color={theme.accentColor} strokeWidth={1.5} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.aiTitle, { color: '#E5E5E5' }]}>{t('ready_to_transform', store.currentLanguage)}</Text>
            <Text style={[styles.aiSubtitle, { color: '#C2C2C2' }]}>{t('context_reader_active', store.currentLanguage)}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.descCard, { backgroundColor: 'rgba(29,29,29,0.85)', borderColor: 'rgba(229,229,229,0.08)' }]}>
        <Text style={[styles.descTitle, { color: '#E5E5E5' }]}>
          {t('context_reader_title', store.currentLanguage)}
        </Text>
        <Text style={[styles.descText, { color: '#C2C2C2' }]}>
          {t('context_reader_desc', store.currentLanguage)}
        </Text>
      </View>

      <TextInput
        style={[styles.textInput, { color: '#E5E5E5', borderColor: 'rgba(229,229,229,0.08)', backgroundColor: 'rgba(29,29,29,0.85)' }]}
        placeholder={t('situation_hint', store.currentLanguage) || "Ex: Ma cherie me dit qu'elle est en route alors qu'on entend le bruit de la douche derriere..."}
        placeholderTextColor="#686868"
        multiline
        numberOfLines={4}
        value={store.textContextInput}
        onChangeText={store.setTextContextInput}
      />

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleGenerateTextMeme}
        disabled={store.isLoadingTextMeme || !store.textContextInput.trim()}
      >
        <LinearGradient
          colors={['#8B5CF6', '#6366F1', '#3B82F6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.generateBtn, { opacity: store.isLoadingTextMeme || !store.textContextInput.trim() ? 0.5 : 1 }]}
        >
          <Sparkles size={18} color="#FFFFFF" strokeWidth={1.5} />
          <Text style={styles.generateBtnText}>
            {store.isLoadingTextMeme ? t('loading', store.currentLanguage) : t('generate_text_meme', store.currentLanguage)}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      {(store.isLoadingTextMeme || store.isGeneratingTextImage) && (
        <View style={[styles.loadingCard, { backgroundColor: derived.cardBackground }]}>
          <Animated.View style={{ transform: [{ rotate: spinInterp }] }}>
            <Loader size={32} color={theme.accentColor} strokeWidth={1.5} />
          </Animated.View>
          <Text style={{ color: derived.secondaryTextColor, marginTop: 8 }}>
            {store.isGeneratingTextImage ? t('loading', store.currentLanguage) + ' image...' : t('loading', store.currentLanguage)}
          </Text>
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <Text style={[styles.sectionTitle, { color: '#FFFFFF', flex: 1 }]}>
          {t('ai_bg_title', store.currentLanguage)}
        </Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleGenerateAiBg}
          disabled={store.isGeneratingTextImage || !store.textContextInput.trim()}
          style={[styles.genBgBtn, { opacity: store.isGeneratingTextImage || !store.textContextInput.trim() ? 0.5 : 1 }]}
        >
          <LinearGradient
            colors={['#10B981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.genBgBtnGrad}
          >
            <RotateCcw size={14} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.genBgBtnText}>
              {t('subtitle_label', store.currentLanguage)}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {(store.textTopSuggestion || store.textBottomSuggestion) && (
        <>
          <Text style={[styles.previewLabel, { color: '#E5E5E5' }]}>{t('preview_label', store.currentLanguage)}</Text>
          <ViewShot ref={memeViewRef} options={{ format: 'png', quality: 0.9 }}>
            <MemeCardPreview
              templateIndex={store.textBgIndex}
              topText={store.textTopSuggestion}
              bottomText={store.textBottomSuggestion}
              customBgUri={store.textBgBitmap}
            />
          </ViewShot>
          <View style={styles.actions}>
            <TouchableOpacity activeOpacity={0.85} onPress={handleSave} style={styles.actionBtnWrapper}>
              <LinearGradient colors={['#FFFFFF', '#E5E5E5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.actionBtnGrad}>
                <Save size={16} color="#0A0A0A" strokeWidth={1.5} />
                <Text style={[styles.actionBtnText, { color: '#0A0A0A' }]}>{t('save', store.currentLanguage)}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} onPress={handleShare} style={styles.actionBtnWrapper}>
              <LinearGradient colors={['#1D1D1D', '#2D2D2D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.actionBtnGrad}>
                <Share2 size={16} color="#E5E5E5" strokeWidth={1.5} />
                <Text style={[styles.actionBtnText, { color: '#E5E5E5' }]}>{t('share', store.currentLanguage)}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </>
      )}

      {store.textContextInput.trim() && (
        <MultimediaStudioSection contextText={store.textContextInput} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  aiCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
  },
  aiTitle: { fontSize: 14, fontWeight: '600' },
  aiSubtitle: { fontSize: 11, marginTop: 2 },
  descCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
  },
  descTitle: { fontSize: 16, fontWeight: '700' },
  descText: { fontSize: 12, lineHeight: 16, marginTop: 6, color: '#C2C2C2' },
  textInput: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  generateBtn: {
    borderRadius: 9999,
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  generateBtnIcon: { fontSize: 20 },
  generateBtnText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  genBgBtn: { borderRadius: 9999, overflow: 'hidden' },
  genBgBtnGrad: {
    paddingHorizontal: 16,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 9999,
    flexDirection: 'row',
    gap: 6,
  },
  genBgBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  loadingCard: { borderRadius: 16, padding: 20, alignItems: 'center' },
  previewLabel: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtnWrapper: { flex: 1, borderRadius: 9999, overflow: 'hidden' },
  actionBtnGrad: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(229,229,229,0.15)',
    flexDirection: 'row',
    gap: 6,
  },
  actionBtnText: { fontSize: 14, fontWeight: '700' },
});
