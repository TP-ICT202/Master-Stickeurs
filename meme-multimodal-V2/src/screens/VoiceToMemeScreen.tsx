import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, Animated, Platform, PermissionsAndroid,
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
import AudioRecord from 'react-native-audio-record';

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

  useEffect(() => {
    AudioRecord.init({
      sampleRate: 44100,
      channels: 1,
      bitsPerSample: 16,
      wavFile: 'meme_audio.wav',
      audioSource: Platform.OS === 'android' ? 6 : undefined,
    });
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

  const requestAudioPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          { title: 'Microphone Permission', message: 'App needs mic access to record voice memes', buttonPositive: 'Allow' },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch {
        return false;
      }
    }
    return true;
  };

  const toggleRecording = async () => {
    if (store.isRecording) {
      store.setIsRecording(false);
      try {
        const audioFile = await AudioRecord.stop();
        if (audioFile) {
          store.setRecordedAudioPath(audioFile);
          store.setIsLoadingAudioMeme(true);
          const result = await transcribeAndGenerateMeme(audioFile);
          store.setAudioTranscript(result.transcription);
          store.setAudioMemeTop(result.topText);
          store.setAudioMemeBottom(result.bottomText);
          store.setIsLoadingAudioMeme(false);
          generateImageFromPrompt(result.transcription || result.topText).then((uri) => {
            if (uri) store.setAiBgBitmap(uri);
          });
        }
      } catch {
        store.setIsLoadingAudioMeme(false);
      }
    } else {
      try {
        const hasPerm = await requestAudioPermission();
        if (!hasPerm) {
          Alert.alert('Permission refusée', 'Impossible d\'enregistrer sans accès au microphone');
          return;
        }
        AudioRecord.start();
        store.setIsRecording(true);
      } catch (e) {
        console.warn('[AudioRecord] start error:', e);
        store.setIsRecording(false);
        Alert.alert('Erreur', 'Impossible de démarrer l\'enregistrement audio');
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
        if (uri) store.setAiBgBitmap(uri);
      });
    }).finally(() => store.setIsLoadingAudioMeme(false));
  };

  const handleGenerateVoiceBg = async () => {
    if (!store.audioTranscript.trim()) return;
    store.setIsGeneratingImage(true);
    try {
      const uri = await generateImageFromPrompt(store.audioTranscript);
      if (uri) store.setAiBgBitmap(uri);
    } finally {
      store.setIsGeneratingImage(false);
    }
  };

  const handleSave = async () => {
    const meme = await saveMeme({
      type: 'AUDIO',
      contextText: store.audioTranscript,
      topText: store.audioMemeTop,
      bottomText: store.audioMemeBottom,
      bgImageUri: store.aiBgBitmap,
    });
    store.addSavedMeme(meme);
    Alert.alert(t('save_success', store.currentLanguage));
  };

  const handleShare = () => shareMeme({ topText: store.audioMemeTop, bottomText: store.audioMemeBottom });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.aiCard, { backgroundColor: 'rgba(29,29,29,0.85)', borderColor: 'rgba(229,229,229,0.08)' }]}>
        <View style={[StyleSheet.absoluteFill, { opacity: 0.2 }]}>
          <View style={{ position: 'absolute', top: -40, left: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: theme.spotlightColor, opacity: 0.2 }} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, zIndex: 1 }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#3D3D3D', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 24, color: '#E5E5E5' }}>🎤</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.aiTitle, { color: '#E5E5E5' }]}>Voice-to-Meme Audio AI</Text>
            <Text style={[styles.aiSubtitle, { color: '#C2C2C2' }]}>Speak or trigger a simulator option below</Text>
          </View>
        </View>
      </View>

      <View style={[styles.descCard, { backgroundColor: 'rgba(29,29,29,0.85)', borderColor: 'rgba(229,229,229,0.08)' }]}>
        <Text style={[styles.descTitle, { color: '#E5E5E5' }]}>
          {t('voice_meme_title', store.currentLanguage) || "🎙️ Voice-To-Meme"}
        </Text>
        <Text style={[styles.descText, { color: '#C2C2C2' }]}>
          {t('voice_meme_desc', store.currentLanguage)}
        </Text>
      </View>

      <View style={[styles.recordCard, { backgroundColor: 'rgba(29,29,29,0.85)', borderColor: 'rgba(229,229,229,0.08)' }]}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[
              styles.micBtn,
              { backgroundColor: store.isRecording ? '#EF4444' : '#FFFFFF' },
            ]}
            onPress={toggleRecording}
          >
            <Text style={{ fontSize: 32, color: store.isRecording ? '#fff' : '#0A0A0A' }}>
              {store.isRecording ? '⏹' : '🎤'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
        <Text style={[styles.micLabel, { color: '#FFFFFF' }]}>
          {store.isRecording
            ? "🔴 Enregistrement en cours (Appuie pour arreter)"
            : "Toucher pour enregistrer de l'audio"}
        </Text>

        <Text style={[styles.mockTitle, { color: '#C2C2C2' }]}>
          📢 Simuler une note vocale (Pratique pour emulateur) :
        </Text>
        <View style={styles.mockRow}>
          {mockExpressions.map((exp, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.mockChip, { backgroundColor: 'rgba(29,29,29,0.85)', borderColor: 'rgba(229,229,229,0.08)' }]}
              onPress={() => useMockExpression(exp)}
            >
              <Text style={[styles.mockText, { color: '#C2C2C2' }]} numberOfLines={2}>{exp}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TextInput
        style={[styles.transcriptInput, { color: '#FFFFFF', borderColor: 'rgba(229,229,229,0.08)', backgroundColor: 'rgba(29,29,29,0.85)' }]}
        placeholder="Transcription de la Note Vocale"
        placeholderTextColor="#686868"
        multiline
        value={store.audioTranscript}
        onChangeText={store.setAudioTranscript}
      />

      {(store.audioTranscript.trim() || store.audioMemeTop) && (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleGenerateVoiceBg}
          disabled={store.isGeneratingImage}
        >
          <LinearGradient
            colors={['#10B981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.generateBtn, { opacity: store.isGeneratingImage ? 0.5 : 1 }]}
          >
            <Text style={styles.generateBtnIcon}>🎨</Text>
            <Text style={styles.generateBtnText}>
              {store.isGeneratingImage ? '...' : 'GÉNÉRER FOND IA'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {(store.audioMemeTop || store.audioMemeBottom) && (
        <>
          <Text style={[styles.previewLabel, { color: '#E5E5E5' }]}>Aperçu :</Text>
          <MemeCardPreview
            templateIndex={store.selectedPresetBgIndex}
            topText={store.audioMemeTop}
            bottomText={store.audioMemeBottom}
            customBgUri={store.aiBgBitmap}
          />
          <View style={styles.actions}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSave}
              style={styles.actionBtnWrapper}
            >
              <LinearGradient
                colors={['#FFFFFF', '#E5E5E5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionBtnGrad}
              >
                <Text style={[styles.actionBtnText, { color: '#0A0A0A' }]}>💾 {t('save', store.currentLanguage)}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleShare}
              style={styles.actionBtnWrapper}
            >
              <LinearGradient
                colors={['#1D1D1D', '#2D2D2D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionBtnGrad}
              >
                <Text style={[styles.actionBtnText, { color: '#E5E5E5' }]}>↗️ {t('share', store.currentLanguage)}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </>
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
  recordCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  micBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micLabel: { fontSize: 13, fontWeight: '700' },
  mockTitle: { fontSize: 13, fontWeight: '600', marginTop: 8 },
  mockRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  mockChip: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    flex: 1,
    minWidth: '45%',
    maxWidth: '48%',
  },
  mockText: { fontSize: 10, lineHeight: 14, maxLines: 2 },
  transcriptInput: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  generateBtn: {
    borderRadius: 9999,
    height: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  generateBtnIcon: { fontSize: 18 },
  generateBtnText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
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
  },
  actionBtnText: { fontSize: 14, fontWeight: '700' },
});
