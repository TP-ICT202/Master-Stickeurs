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
  Image,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TRANSLATIONS, ThemeProperties } from './ThemeAndLang';
import { GeminiClient } from '../api/GeminiClient';

const { width } = Dimensions.get('window');

interface StatusRemixerProps {
  currentLang: 'FR' | 'EN';
  theme: ThemeProperties;
  onRefreshLibrary: () => void;
}

// Beautiful preset mock image cards for direct simulator use!
const PRESET_MOCK_IMAGES = [
  {
    id: 'confused_dog',
    label: '🐶 Confused Dog',
    base64: 'mock_base64_dog',
    url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=300&auto=format&fit=crop',
    defaultPrompt: "Un chien très mignon mais avec l'air complètement confus ou suspect."
  },
  {
    id: 'programmer_desk',
    label: '💻 Dev Desk Night',
    base64: 'mock_base64_dev',
    url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=300&auto=format&fit=crop',
    defaultPrompt: "Une pièce sombre de développeur avec des lignes de code fluorescentes sur les écrans."
  },
  {
    id: 'success_coffee',
    label: '☕ Victory Coffee',
    base64: 'mock_base64_coffee',
    url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=300&auto=format&fit=crop',
    defaultPrompt: "Une tasse de café fumant à côté d'un bloc-notes disant 'Victory' ou 'Succès'."
  }
];

export default function StatusRemixer({ currentLang, theme, onRefreshLibrary }: StatusRemixerProps) {
  const [selectedImg, setSelectedImg] = useState(PRESET_MOCK_IMAGES[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [topText, setTopText] = useState('CHOISIS UNE PHOTO');
  const [bottomText, setBottomText] = useState('ET COMMENCE L\'ANALYSE IA !');
  const [overlayColor, setOverlayColor] = useState<string | null>(null);

  const translate = (key: string) => {
    return TRANSLATIONS[currentLang][key] || key;
  };

  const startImageAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      // In a real device, we would send the actual base64 of the selected image.
      // We will call the real Gemini API passing a description of the image context.
      const result = await GeminiClient.generateMemeTextSuggestions(
        `L'utilisateur a téléversé cette image: ${selectedImg.defaultPrompt}. Suggère des punchlines adaptées.`
      );
      setTopText(result.top);
      setBottomText(result.bottom);
    } catch (e) {
      Alert.alert('Error', String(e));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    try {
      const newItem = {
        id: 'photo_' + Date.now(),
        type: 'MEME',
        topText: topText,
        bottomText: bottomText,
        bgIdx: 1, // Store under a preset indicator
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

  const filterColors = [
    { label: 'Normal', color: null },
    { label: 'Cyber', color: 'rgba(0, 255, 204, 0.2)' },
    { label: 'Sunset', color: 'rgba(233, 64, 87, 0.25)' },
    { label: 'Solar', color: 'rgba(251, 191, 36, 0.2)' },
    { label: 'Forest', color: 'rgba(56, 239, 125, 0.2)' }
  ];

  return (
    <ScrollView contentContainerStyle={[styles.scrollContent, { backgroundColor: theme.baseColor }]}>
      {/* Title */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.titleText, { color: theme.textColor }]}>
          {translate('photo_remixer_title')}
        </Text>
        <Text style={[styles.subtitleText, { color: theme.secondaryTextColor }]}>
          {translate('photo_remixer_desc')}
        </Text>
      </View>

      {/* Preset Pickers Grid */}
      <Text style={[styles.subTitle, { color: theme.textColor }]}>
        📱 Sélectionne une Image de Simulation :
      </Text>
      <View style={styles.presetsGrid}>
        {PRESET_MOCK_IMAGES.map((img) => {
          const isCurrent = img.id === selectedImg.id;
          return (
            <TouchableOpacity
              key={img.id}
              style={[
                styles.imgPresetCard,
                { borderColor: theme.borderColor },
                isCurrent && { borderColor: theme.accentColor, borderWidth: 2 }
              ]}
              onPress={() => setSelectedImg(img)}
            >
              <Image source={{ uri: img.url }} style={styles.imgPresetThumbnail} />
              <Text style={[styles.imgPresetLabel, { color: theme.textColor }]} numberOfLines={1}>
                {img.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Live Preview canvas */}
      <View style={styles.previewContainer}>
        <Text style={[styles.subTitle, { color: theme.textColor }]}>
          {translate('live_preview')}
        </Text>
        
        <View style={[styles.imageCanvas, { borderColor: theme.borderColor }]}>
          {/* Main background image loaded dynamically */}
          <Image source={{ uri: selectedImg.url }} style={styles.canvasBackground} />
          
          {/* Apply visual tint overlay filter */}
          {overlayColor && <View style={[styles.tintOverlay, { backgroundColor: overlayColor }]} />}

          {/* Top Caption */}
          <View style={styles.captionWrapper}>
            <Text style={styles.canvasMemeText}>{topText}</Text>
          </View>

          {/* Bottom Caption */}
          <View style={[styles.captionWrapper, { justifyContent: 'flex-end' }]}>
            <Text style={styles.canvasMemeText}>{bottomText}</Text>
          </View>
        </View>
      </View>

      {/* Action triggers */}
      <TouchableOpacity
        style={[styles.analyzeBtn, { backgroundColor: theme.accentColor }]}
        onPress={startImageAnalysis}
        disabled={isAnalyzing}
      >
        {isAnalyzing ? (
          <View style={styles.loaderRow}>
            <ActivityIndicator size="small" color="#000000" />
            <Text style={styles.loaderText}>{translate('image_analyzing')}</Text>
          </View>
        ) : (
          <Text style={styles.analyzeBtnText}>⚡ ANALYSER AVEC GEMINI IA</Text>
        )}
      </TouchableOpacity>

      {/* Color Overlays Filters */}
      <Text style={[styles.subTitle, { color: theme.textColor, marginTop: 16 }]}>
        🎭 Filtres de Teinte Visuels :
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow}>
        {filterColors.map((f, idx) => {
          const isSelected = overlayColor === f.color;
          return (
            <TouchableOpacity
              key={idx}
              style={[
                styles.filterChip,
                { backgroundColor: theme.isDark ? '#1C1C1E' : '#FFFFFF', borderColor: theme.borderColor },
                isSelected && { borderColor: theme.accentColor, borderWidth: 1.5 }
              ]}
              onPress={() => setOverlayColor(f.color)}
            >
              <Text style={[styles.filterChipText, { color: theme.textColor }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

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

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveBtn, { backgroundColor: theme.accentColor }]}
        onPress={handleSave}
        disabled={isAnalyzing}
      >
        <Text style={styles.saveBtnText}>💾 {translate('btn_save')}</Text>
      </TouchableOpacity>
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
  subTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  presetsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  imgPresetCard: {
    width: '31%',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: 'rgba(128,128,128,0.04)',
    alignItems: 'center',
    paddingBottom: 6,
  },
  imgPresetThumbnail: {
    width: '100%',
    height: 70,
    resizeMode: 'cover',
  },
  imgPresetLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  previewContainer: {
    marginBottom: 16,
  },
  imageCanvas: {
    width: width - 32,
    height: width - 32,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'space-between',
    padding: 20,
  },
  canvasBackground: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'cover',
  },
  tintOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  captionWrapper: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    zIndex: 10,
  },
  canvasMemeText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 8,
  },
  analyzeBtn: {
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  analyzeBtnText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 13,
  },
  loaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loaderText: {
    color: '#000000',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 12,
  },
  filtersRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
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
