import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TRANSLATIONS, ThemeProperties } from './ThemeAndLang';
import { GeminiClient } from '../api/GeminiClient';

const { width } = Dimensions.get('window');

interface VoiceToMemeProps {
  currentLang: 'FR' | 'EN';
  theme: ThemeProperties;
  onRefreshLibrary: () => void;
}

const PRESET_COLORS = [
  ['#8A2387', '#E94057', '#F27121'], // Sunset
  ['#00F2FE', '#4FACFE'], // Ocean
  ['#11998E', '#38EF7D'], // Forest
  ['#1F1C2C', '#928DAB'], // Gothic
  ['#ED213A', '#93291E']  // Fire
];

const SIMULATED_TRANSCRIPTS_FR = [
  "Mon patron qui m'écrit à 23h pour dire 'C'est urgent pour demain matin 8h'",
  "Quand le prof de maths dit 'L'interro de ce matin sera extrêmement simple, détendez-vous'",
  "Mon code qui a compilé du premier coup sans aucune erreur après 4 heures de galère",
  "Quand je dis que je commence mon régime lundi mais que je vois un bon plat de garba devant moi"
];

const SIMULATED_TRANSCRIPTS_EN = [
  "My boss writing me at 11 PM saying 'This is urgent for tomorrow 8 AM'",
  "When the math teacher says 'This morning's quiz will be extremely simple, just relax'",
  "My code compiling on the very first try without any errors after 4 hours of struggles",
  "When I say I am starting my diet on Monday but see a delicious burger right in front of me"
];

export default function VoiceToMeme({ currentLang, theme, onRefreshLibrary }: VoiceToMemeProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [topText, setTopText] = useState('TRANSCRIPTION VIDE');
  const [bottomText, setBottomText] = useState('ENREGISTRE UN VOCAL S\'IL TE PLAÎT');
  const [selectedBgIdx, setSelectedBgIdx] = useState(0);

  const translate = (key: string) => {
    return TRANSLATIONS[currentLang][key] || key;
  };

  const startSimulatedRecording = () => {
    setIsRecording(true);
    setTranscript('');
    
    setTimeout(() => {
      setIsRecording(false);
      const list = currentLang === 'FR' ? SIMULATED_TRANSCRIPTS_FR : SIMULATED_TRANSCRIPTS_EN;
      const randomText = list[Math.floor(Math.random() * list.length)];
      setTranscript(randomText);
      generateMeme(randomText);
    }, 2000);
  };

  const generateMeme = async (textToUse: string) => {
    if (!textToUse.trim()) return;
    setIsGenerating(true);
    try {
      const suggestions = await GeminiClient.generateVoiceToMemeText(textToUse);
      setTopText(suggestions.top);
      setBottomText(suggestions.bottom);
    } catch (e) {
      Alert.alert('Error', String(e));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    try {
      const newItem = {
        id: 'voice_' + Date.now(),
        type: 'MEME',
        topText: topText,
        bottomText: bottomText,
        bgIdx: selectedBgIdx,
        timestamp: Date.now()
      };

      const raw = await AsyncStorage.getItem('SAVED_MEMES');
      const list = raw ? JSON.parse(raw) : [];
      list.push(newItem);
      await AsyncStorage.setItem('SAVED_MEMES', JSON.stringify(list));
      
      onRefreshLibrary();
      Alert.alert(
        currentLang === 'FR' ? 'Sauvegardé !' : 'Saved!',
        translate('save_success')
      );
    } catch {
      Alert.alert('Error', translate('save_err'));
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.scrollContent, { backgroundColor: theme.baseColor }]}>
      {/* Title */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.titleText, { color: theme.textColor }]}>
          {translate('voice_to_meme_title')}
        </Text>
        <Text style={[styles.subtitleText, { color: theme.secondaryTextColor }]}>
          {translate('voice_to_meme_desc')}
        </Text>
      </View>

      {/* Recording Area */}
      <View style={[styles.card, { backgroundColor: theme.isDark ? '#1C1C1E' : '#FFFFFF', borderColor: theme.borderColor }]}>
        <TouchableOpacity
          style={[
            styles.recordButton,
            { borderColor: isRecording ? '#EF4444' : theme.accentColor },
            isRecording && { backgroundColor: 'rgba(239, 68, 68, 0.1)' }
          ]}
          onPress={startSimulatedRecording}
          disabled={isRecording || isGenerating}
        >
          {isRecording ? (
            <ActivityIndicator size="large" color="#EF4444" />
          ) : (
            <Text style={[styles.recordButtonIcon, { color: theme.accentColor }]}>🎙️</Text>
          )}
          <Text style={[styles.recordButtonLabel, { color: isRecording ? '#EF4444' : theme.textColor }]}>
            {isRecording ? translate('recording_in_progress') : translate('tap_to_record')}
          </Text>
        </TouchableOpacity>

        {/* Manual simulator select */}
        <Text style={[styles.simulatorLabel, { color: theme.secondaryTextColor }]}>
          {translate('simulate_voice_note')}
        </Text>
        <View style={styles.presetTranscriptsRow}>
          {(currentLang === 'FR' ? SIMULATED_TRANSCRIPTS_FR : SIMULATED_TRANSCRIPTS_EN).map((t, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.presetTranscriptChip, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderColor: theme.borderColor }]}
              onPress={() => {
                setTranscript(t);
                generateMeme(t);
              }}
              disabled={isRecording || isGenerating}
            >
              <Text style={[styles.presetTranscriptText, { color: theme.textColor }]} numberOfLines={1}>
                📢 Vocal #{idx + 1}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Live Transcription Box */}
      {transcript.length > 0 && (
        <View style={[styles.card, { backgroundColor: theme.isDark ? '#1C1C1E' : '#FFFFFF', borderColor: theme.borderColor }]}>
          <Text style={[styles.cardTitle, { color: theme.textColor }]}>
            📝 {translate('voice_note_transcription')}
          </Text>
          <View style={[styles.transcriptBubble, { backgroundColor: theme.isDark ? '#000000' : '#F1F5F9' }]}>
            <Text style={[styles.transcriptText, { color: theme.textColor }]}>
              "{transcript}"
            </Text>
          </View>
        </View>
      )}

      {/* Output Section */}
      <View style={styles.outputContainer}>
        {/* Color presets selection */}
        <Text style={[styles.subTitle, { color: theme.textColor }]}>{translate('bg_title')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsRow}>
          {PRESET_COLORS.map((colors, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => setSelectedBgIdx(idx)}
              style={[
                styles.presetCircle,
                { backgroundColor: colors[0] },
                selectedBgIdx === idx && styles.presetSelected
              ]}
            />
          ))}
        </ScrollView>

        {/* Live Preview */}
        <Text style={[styles.subTitle, { color: theme.textColor, marginTop: 10 }]}>
          {translate('live_preview')}
        </Text>
        
        {isGenerating ? (
          <View style={[styles.previewCanvasPlaceholder, { borderColor: theme.borderColor }]}>
            <ActivityIndicator size="large" color={theme.accentColor} />
            <Text style={[styles.placeholderText, { color: theme.secondaryTextColor, marginTop: 12 }]}>
              Analyse et transcription IA...
            </Text>
          </View>
        ) : (
          <View style={[styles.previewCanvas, { backgroundColor: PRESET_COLORS[selectedBgIdx][0] }]}>
            <Text style={styles.memeTopText}>{topText}</Text>
            <Text style={styles.memeBottomText}>{bottomText}</Text>
          </View>
        )}

        {/* Editable Legends */}
        <Text style={[styles.subTitle, { color: theme.textColor, marginTop: 20 }]}>
          Personnalisation des Textes :
        </Text>
        
        <Text style={[styles.legendLabel, { color: theme.secondaryTextColor }]}>{translate('legend_top')}</Text>
        <TextInput
          style={[styles.legendInput, { color: theme.textColor, borderColor: theme.borderColor, backgroundColor: theme.isDark ? '#1C1C1E' : '#FFFFFF' }]}
          value={topText}
          onChangeText={setTopText}
          placeholderTextColor="#686868"
        />

        <Text style={[styles.legendLabel, { color: theme.secondaryTextColor, marginTop: 8 }]}>{translate('legend_bottom')}</Text>
        <TextInput
          style={[styles.legendInput, { color: theme.textColor, borderColor: theme.borderColor, backgroundColor: theme.isDark ? '#1C1C1E' : '#FFFFFF' }]}
          value={bottomText}
          onChangeText={setBottomText}
          placeholderTextColor="#686868"
        />

        {/* Action button */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: theme.accentColor }]}
          onPress={handleSave}
          disabled={isGenerating || isRecording}
        >
          <Text style={styles.saveBtnText}>💾 {translate('btn_save')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    marginBottom: 20,
    marginTop: 10,
  },
  titleText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  subtitleText: {
    fontSize: 13,
    marginTop: 4,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  recordButton: {
    height: 120,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  recordButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  recordButtonLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  simulatorLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  presetTranscriptsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  presetTranscriptChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 6,
    marginBottom: 6,
  },
  presetTranscriptText: {
    fontSize: 11,
    fontWeight: '600',
  },
  transcriptBubble: {
    borderRadius: 12,
    padding: 12,
  },
  transcriptText: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  outputContainer: {
    marginTop: 10,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  presetsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  presetCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 10,
  },
  presetSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  previewCanvas: {
    width: width - 32,
    height: width - 32,
    borderRadius: 24,
    justifyContent: 'space-between',
    padding: 24,
    alignItems: 'center',
  },
  previewCanvasPlaceholder: {
    width: width - 32,
    height: width - 32,
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 12,
    fontWeight: '600',
  },
  memeTopText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 8,
  },
  memeBottomText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 8,
  },
  legendLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  legendInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    marginBottom: 6,
  },
  saveBtn: {
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 30,
  },
  saveBtnText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 14,
  }
});
