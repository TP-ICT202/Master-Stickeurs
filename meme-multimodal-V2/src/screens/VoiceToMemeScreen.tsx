import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, Animated, Platform,
} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import RNFS from 'react-native-fs';
import { useStore } from '../store/useStore';
import { themes, getDerivedColors } from '../theme/colors';
import { t } from '../utils/i18n';
import MemeCardPreview from '../components/MemeCardPreview';
import MultimediaStudioSection from '../components/MultimediaStudioSection';
import { generateVoiceToMemeText, transcribeAndGenerateMeme, generateImageFromPrompt } from '../services/gemini';
import { saveMeme } from '../services/database';
import { shareMeme } from '../utils/memeSaver';
import { requestMicPermission, showPermissionDenied } from '../utils/permissions';
import { Mic, RotateCcw, Save, Share2, Music, Square, Loader } from 'lucide-react-native';

let AudioRecorderPlayer: any = null;
let recorderInstance: any = null;
try {
  const mod = require('react-native-audio-recorder-player');
  AudioRecorderPlayer = mod.default || mod;
} catch (e) { console.warn('[Audio] Module non disponible:', e); }

function getAudioDir(): string {
  return `${RNFS.CachesDirectoryPath}`;
}

const mockExpressions = [
  "Qui t'a dit ca ? Faut quitter la-bas !",
  "C'est gate ! Mon argent se mange pas en vain.",
  "Il n'y a pas ton deux dans ce monde de menteurs.",
  "Tu parles trop mais ton portefeuille est en panne seche.",
  "Le secret c'est le travail, mais moi j'aime dormir !",
];

export default function VoiceToMemeScreen() {
  const store = useStore();
  const theme = themes[store.currentTheme as keyof typeof themes] || themes['Dark Void'];
  const derived = getDerivedColors(theme);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [isInit, setIsInit] = useState(false);

  useEffect(() => {
    if (AudioRecorderPlayer) {
      try {
        recorderInstance = new AudioRecorderPlayer();
      } catch (e) {
        console.warn('[Audio] Init error:', e);
      }
    }
    setIsInit(true);
  }, []);

  useEffect(() => {
    if (store.isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.25, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.0, duration: 800, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
  }, [store.isRecording]);

  const toggleRecording = async () => {
    if (store.isRecording) {
      store.setIsRecording(false);
      try {
        if (!recorderInstance) { Alert.alert('Erreur', 'Module audio indisponible'); return; }
        const audioFile = await recorderInstance.stopRecorder();
        if (audioFile) {
          store.setRecordedAudioPath(audioFile);
          store.setIsLoadingAudioMeme(true);
          try {
            const memeResult = await transcribeAndGenerateMeme(audioFile);
            store.setAudioTranscript(memeResult.transcription);
            store.setAudioMemeTop(memeResult.topText);
            store.setAudioMemeBottom(memeResult.bottomText);
            generateImageFromPrompt(memeResult.transcription || memeResult.topText).then((uri) => {
              if (uri) store.setAudioBgBitmap(uri);
            }).catch(() => {});
          } catch (e) {
            Alert.alert('Erreur', t('gemini_error', store.currentLanguage) || 'Verifie connexion et cle API.');
          } finally {
            store.setIsLoadingAudioMeme(false);
          }
        } else {
          Alert.alert('Erreur Audio', 'Aucun fichier enregistre');
        }
      } catch (e) {
        store.setIsLoadingAudioMeme(false);
        Alert.alert('Erreur', 'Arret enregistrement impossible');
      }
    } else {
      if (!recorderInstance && !AudioRecorderPlayer) {
        Alert.alert('Erreur', 'Module audio non disponible sur cet appareil.');
        return;
      }
      const hasPerm = await requestMicPermission();
      if (!hasPerm) { showPermissionDenied('mic'); return; }
      try {
        if (!recorderInstance) recorderInstance = new AudioRecorderPlayer();
        const audioPath = `${RNFS.CachesDirectoryPath}/meme_audio_${Date.now()}.wav`;
        await recorderInstance.startRecorder(audioPath);
        store.setIsRecording(true);
      } catch (e) {
        store.setIsRecording(false);
        Alert.alert('Erreur Micro', 'Impossible de demarrer.');
      }
    }
  };

  const useMockExpression = (text: string) => {
    store.setRecordedAudioPath(null);
    store.setAudioTranscript(text);
    store.setIsLoadingAudioMeme(true);
    generateVoiceToMemeText(text).then(([top, bottom]) => {
      store.setAudioMemeTop(top);
      store.setAudioMemeBottom(bottom);
      generateImageFromPrompt(text).then((uri) => {
        if (uri) store.setAudioBgBitmap(uri);
      });
    }).finally(() => store.setIsLoadingAudioMeme(false));
  };

  const handleGenerateAudioBg = async () => {
    if (!store.audioTranscript.trim()) return;
    store.setIsGeneratingAudioImage(true);
    try {
      const uri = await generateImageFromPrompt(store.audioTranscript);
      if (uri) store.setAudioBgBitmap(uri);
      else Alert.alert(t('ai_bg_title', store.currentLanguage), 'Echec generation fond.');
    } finally {
      store.setIsGeneratingAudioImage(false);
    }
  };

  const handleSave = async () => {
    try {
      const meme = await saveMeme({
        type: 'AUDIO',
        contextText: store.audioTranscript,
        topText: store.audioMemeTop,
        bottomText: store.audioMemeBottom,
        bgImageUri: store.audioBgBitmap,
      });
      store.addSavedMeme(meme);
      Alert.alert(t('save_success', store.currentLanguage));
    } catch (e) {
      Alert.alert('Erreur', 'Echec de la sauvegarde');
    }
  };

  const handleShare = () => shareMeme({
    topText: store.audioMemeTop, bottomText: store.audioMemeBottom,
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.aiCard, { backgroundColor: 'rgba(29,29,29,0.85)', borderColor: 'rgba(229,229,229,0.08)' }]}>
        <View style={[StyleSheet.absoluteFill, { opacity: 0.2 }]}>
          <View style={{ position: 'absolute', top: -40, left: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: theme.spotlightColor, opacity: 0.2 }} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, zIndex: 1 }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#3D3D3D', justifyContent: 'center', alignItems: 'center' }}>
            <Music size={22} color={theme.accentColor} strokeWidth={1.5} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.aiTitle, { color: '#E5E5E5' }]}>Voice-to-Meme Audio AI</Text>
            <Text style={[styles.aiSubtitle, { color: '#C2C2C2' }]}>{t('voice_meme_desc', store.currentLanguage)}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.descCard, { backgroundColor: 'rgba(29,29,29,0.85)', borderColor: 'rgba(229,229,229,0.08)' }]}>
        <Text style={[styles.descTitle, { color: '#E5E5E5' }]}>{t('voice_meme_title', store.currentLanguage)}</Text>
        <Text style={[styles.descText, { color: '#C2C2C2' }]}>{t('voice_meme_desc', store.currentLanguage)}</Text>
      </View>

      <Animated.View style={{ transform: [{ scale: pulseAnim }], alignItems: 'center' }}>
        <TouchableOpacity
          style={[styles.recordBtn, { backgroundColor: store.isRecording ? '#EF4444' : theme.accentColor }]}
          onPress={toggleRecording}
          activeOpacity={0.8}
        >
          {store.isRecording ? (
            <Square size={28} color="#FFFFFF" strokeWidth={2} />
          ) : (
            <Mic size={28} color="#FFFFFF" strokeWidth={2} />
          )}
        </TouchableOpacity>
      </Animated.View>
      <Text style={[styles.recordHint, { color: derived.secondaryTextColor }]}>
        {store.isRecording
          ? t('recording', store.currentLanguage)
          : t('record_idle', store.currentLanguage)}
      </Text>

      <Text style={[styles.mockTitle, { color: derived.secondaryTextColor }]}>
        {t('mock_title', store.currentLanguage)}
      </Text>
      <View style={styles.mockRow}>
        {mockExpressions.map((expr, i) => (
          <TouchableOpacity key={i} style={[styles.mockChip, { borderColor: derived.borderColor }]} onPress={() => useMockExpression(expr)}>
            <Text style={[styles.mockText, { color: derived.textColor }]}>{expr}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {store.isLoadingAudioMeme && (
        <View style={[styles.loadingCard, { backgroundColor: derived.cardBackground }]}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Loader size={32} color={theme.accentColor} strokeWidth={1.5} />
          </Animated.View>
          <Text style={{ color: derived.secondaryTextColor, marginTop: 8 }}>{t('loading', store.currentLanguage)}</Text>
        </View>
      )}

      {store.audioTranscript ? (
        <View style={[styles.transcriptCard, { backgroundColor: derived.cardBackground, borderColor: derived.borderColor }]}>
          <Text style={[styles.transcriptLabel, { color: derived.secondaryTextColor }]}>Transcription :</Text>
          <Text style={[styles.transcriptText, { color: derived.textColor }]}>{store.audioTranscript}</Text>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <Text style={[styles.sectionTitle, { color: '#FFFFFF', flex: 1 }]}>
          {t('ai_bg_title', store.currentLanguage)}
        </Text>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleGenerateAudioBg}
          disabled={store.isGeneratingAudioImage || !store.audioTranscript.trim()}
          style={[styles.genBgBtn, { opacity: store.isGeneratingAudioImage || !store.audioTranscript.trim() ? 0.5 : 1 }]}
        >
          <LinearGradient colors={['#10B981', '#059669']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.genBgBtnGrad}>
            <RotateCcw size={14} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.genBgBtnText}>{t('subtitle_label', store.currentLanguage)}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {(store.audioMemeTop || store.audioMemeBottom) && (
        <View style={[styles.previewCard, { backgroundColor: derived.cardBackground, borderColor: derived.borderColor }]}>
          <Text style={[styles.previewLabel, { color: '#E5E5E5' }]}>{t('preview_label', store.currentLanguage)}</Text>
          <MemeCardPreview
            templateIndex={store.audioBgIndex}
            topText={store.audioMemeTop}
            bottomText={store.audioMemeBottom}
            customBgUri={store.audioBgBitmap}
          />
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
        </View>
      )}

      {store.audioTranscript.trim() && (
        <MultimediaStudioSection contextText={store.audioTranscript} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  aiCard: { borderRadius: 24, borderWidth: 1, padding: 16, overflow: 'hidden' },
  aiTitle: { fontSize: 14, fontWeight: '600' },
  aiSubtitle: { fontSize: 11, marginTop: 2 },
  descCard: { borderRadius: 24, borderWidth: 1, padding: 16 },
  descTitle: { fontSize: 16, fontWeight: '700' },
  descText: { fontSize: 12, lineHeight: 16, marginTop: 6 },
  recordBtn: {
    width: 72, height: 72, borderRadius: 36,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
  },
  recordHint: { textAlign: 'center', fontSize: 12 },
  mockTitle: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  mockRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mockChip: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  mockText: { fontSize: 10 },
  loadingCard: { borderRadius: 16, padding: 20, alignItems: 'center' },
  transcriptCard: { borderRadius: 16, borderWidth: 1, padding: 12, gap: 4 },
  transcriptLabel: { fontSize: 11, fontWeight: '600' },
  transcriptText: { fontSize: 13, lineHeight: 18 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  genBgBtn: { borderRadius: 9999, overflow: 'hidden' },
  genBgBtnGrad: {
    paddingHorizontal: 16, height: 40, justifyContent: 'center',
    alignItems: 'center', borderRadius: 9999, flexDirection: 'row', gap: 6,
  },
  genBgBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  previewCard: { borderRadius: 20, borderWidth: 1, padding: 12, gap: 12 },
  previewLabel: { fontSize: 13, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtnWrapper: { flex: 1, borderRadius: 9999, overflow: 'hidden' },
  actionBtnGrad: {
    height: 48, justifyContent: 'center', alignItems: 'center',
    borderRadius: 9999, borderWidth: 1, borderColor: 'rgba(229,229,229,0.15)',
    flexDirection: 'row', gap: 6,
  },
  actionBtnText: { fontSize: 14, fontWeight: '700' },
});
