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

interface MemeStudioProps {
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

export default function MemeStudio({ currentLang, theme, onRefreshLibrary }: MemeStudioProps) {
  const [contextInput, setContextInput] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<'MEME' | 'STICKER' | 'GIF' | 'VIDEO'>('MEME');
  
  // Meme state
  const [topText, setTopText] = useState('QUAND TU IMPLÉMENTES L\'IA');
  const [bottomText, setBottomText] = useState('SANS CONFIGURER LES CLÉS !');
  const [selectedBgIdx, setSelectedBgIdx] = useState(0);

  // Sticker state
  const [stickerEmoji, setStickerEmoji] = useState('🔥');
  const [stickerText, setStickerText] = useState('C\'EST COMPILÉ !');

  // GIF state
  const [gifQuery, setGifQuery] = useState('celebration computer cat');

  // Video state
  const [videoTitle, setVideoTitle] = useState('ALERTE MAXIMUM ⚠️');
  const [videoPunch, setVideoPunch] = useState('DÉSASTRE GÉNÉRALISÉ EN COURS !');

  const [isGenerating, setIsGenerating] = useState(false);

  const translate = (key: string) => {
    return TRANSLATIONS[currentLang][key] || key;
  };

  const handleGenerate = async () => {
    if (!contextInput.trim()) return;
    setIsGenerating(true);
    try {
      if (selectedFormat === 'MEME') {
        const res = await GeminiClient.generateMemeTextSuggestions(contextInput);
        setTopText(res.top);
        setBottomText(res.bottom);
      } else if (selectedFormat === 'STICKER') {
        const res = await GeminiClient.generateStickerSuggestion(contextInput);
        setStickerEmoji(res.emoji);
        setStickerText(res.text);
      } else if (selectedFormat === 'GIF') {
        const query = await GeminiClient.generateGifSearchQuery(contextInput);
        setGifQuery(query);
      } else if (selectedFormat === 'VIDEO') {
        const res = await GeminiClient.generateVideoStoryboard(contextInput);
        setVideoTitle(res.title);
        setVideoPunch(res.punchline);
      }
    } catch (e) {
      Alert.alert('Error', String(e));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    try {
      let newItem: any = {
        id: selectedFormat.toLowerCase() + '_' + Date.now(),
        type: selectedFormat,
        timestamp: Date.now()
      };

      if (selectedFormat === 'MEME') {
        newItem.topText = topText;
        newItem.bottomText = bottomText;
        newItem.bgIdx = selectedBgIdx;
      } else if (selectedFormat === 'STICKER') {
        newItem.emoji = stickerEmoji;
        newItem.text = stickerText;
      } else if (selectedFormat === 'GIF') {
        newItem.gifQuery = gifQuery;
      } else if (selectedFormat === 'VIDEO') {
        newItem.videoTitle = videoTitle;
        newItem.videoPunchline = videoPunch;
      }

      const raw = await AsyncStorage.getItem('SAVED_MEMES');
      const list = raw ? JSON.parse(raw) : [];
      list.push(newItem);
      await AsyncStorage.setItem('SAVED_MEMES', JSON.stringify(list));
      
      onRefreshLibrary();
      
      let successMsg = translate('save_success');
      if (selectedFormat === 'STICKER') successMsg = translate('sticker_saved');
      if (selectedFormat === 'GIF') successMsg = translate('gif_saved');
      if (selectedFormat === 'VIDEO') successMsg = translate('video_saved');

      Alert.alert(
        currentLang === 'FR' ? 'Succès' : 'Success',
        successMsg
      );
    } catch (e) {
      Alert.alert('Error', translate('save_err'));
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.scrollContent, { backgroundColor: theme.baseColor }]}>
      {/* Dynamic AI Status Vibe Header Card */}
      <View style={[styles.aiCard, { backgroundColor: theme.isDark ? '#1C1C1E' : '#FFFFFF', borderColor: theme.borderColor }]}>
        <Text style={[styles.aiCardTitle, { color: theme.textColor }]}>
          ✨ {translate('vibe_ready')}
        </Text>
        <Text style={[styles.aiCardSubtitle, { color: theme.secondaryTextColor }]}>
          {translate('context_active')}
        </Text>
      </View>

      {/* Context Input Card */}
      <View style={[styles.sectionCard, { backgroundColor: theme.isDark ? '#1C1C1E' : '#FFFFFF', borderColor: theme.borderColor }]}>
        <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
          🧠 {translate('context_title')}
        </Text>
        <Text style={[styles.sectionDesc, { color: theme.secondaryTextColor }]}>
          {translate('context_desc')}
        </Text>
        
        <TextInput
          style={[styles.textInput, { color: theme.textColor, borderColor: theme.borderColor, backgroundColor: theme.isDark ? '#000000' : '#F1F5F9' }]}
          multiline
          numberOfLines={3}
          value={contextInput}
          onChangeText={setContextInput}
          placeholder={translate('context_placeholder')}
          placeholderTextColor="#686868"
        />
      </View>

      {/* Format Selector horizontal chips */}
      <View style={[styles.formatCard, { backgroundColor: theme.isDark ? '#1C1C1E' : '#FFFFFF', borderColor: theme.borderColor }]}>
        <Text style={[styles.formatLabel, { color: theme.textColor }]}>{translate('prompt_format')}</Text>
        <View style={styles.formatRow}>
          {['MEME', 'STICKER', 'GIF', 'VIDEO'].map((fmt) => {
            const isSelected = selectedFormat === fmt;
            let displayLabel = fmt;
            if (fmt === 'MEME') displayLabel = translate('filter_memes').replace('📁', '').replace('🧠', '').trim();
            if (fmt === 'STICKER') displayLabel = translate('filter_stickers').replace('📁', '').replace('🎨', '').trim();
            if (fmt === 'GIF') displayLabel = translate('filter_gifs').replace('📁', '').replace('🎬', '').trim();
            if (fmt === 'VIDEO') displayLabel = translate('filter_videos').replace('📁', '').replace('📺', '').trim();

            return (
              <TouchableOpacity
                key={fmt}
                onPress={() => setSelectedFormat(fmt as any)}
                style={[
                  styles.formatBtn,
                  { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' },
                  isSelected && { backgroundColor: theme.accentColor }
                ]}
              >
                <Text style={[styles.formatBtnText, { color: isSelected ? '#000000' : theme.textColor }]}>
                  {displayLabel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Generate AI Button */}
      <TouchableOpacity
        onPress={handleGenerate}
        disabled={!contextInput.trim() || isGenerating}
        style={[styles.generateBtn, { backgroundColor: theme.accentColor }, (!contextInput.trim() || isGenerating) && styles.disabledBtn]}
      >
        {isGenerating ? (
          <ActivityIndicator color="#000000" />
        ) : (
          <Text style={styles.generateBtnText}>
            {selectedFormat === 'STICKER'
              ? translate('btn_generate_sticker')
              : selectedFormat === 'GIF'
              ? translate('btn_generate_gif')
              : selectedFormat === 'VIDEO'
              ? translate('btn_generate_video')
              : translate('btn_generate_text')}
          </Text>
        )}
      </TouchableOpacity>

      {/* Live Preview Display based on type */}
      <Text style={[styles.subTitle, { color: theme.textColor }]}>{translate('live_preview')}</Text>

      {selectedFormat === 'MEME' && (
        <View style={styles.previewSection}>
          {/* Background selector */}
          <Text style={[styles.bgSelectionLabel, { color: theme.secondaryTextColor }]}>{translate('bg_title')}</Text>
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

          {/* Canvas display */}
          <View style={[styles.previewCanvas, { backgroundColor: PRESET_COLORS[selectedBgIdx][0] }]}>
            <Text style={styles.memeTopText}>{topText}</Text>
            <Text style={styles.memeBottomText}>{bottomText}</Text>
          </View>

          {/* Edit controls */}
          <Text style={[styles.legendLabel, { color: theme.secondaryTextColor, marginTop: 14 }]}>{translate('legend_top')}</Text>
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
        </View>
      )}

      {selectedFormat === 'STICKER' && (
        <View style={styles.previewSection}>
          <View style={[styles.stickerBubble, { backgroundColor: theme.isDark ? '#1C1C1E' : '#FFFFFF', borderColor: theme.borderColor }]}>
            <Text style={styles.stickerEmojiText}>{stickerEmoji}</Text>
            <Text style={[styles.stickerBubbleText, { color: theme.textColor }]}>{stickerText}</Text>
          </View>

          <Text style={[styles.legendLabel, { color: theme.secondaryTextColor, marginTop: 14 }]}>Modifier l'Emoji :</Text>
          <TextInput
            style={[styles.legendInput, { color: theme.textColor, borderColor: theme.borderColor, backgroundColor: theme.isDark ? '#1C1C1E' : '#FFFFFF' }]}
            value={stickerEmoji}
            onChangeText={setStickerEmoji}
            placeholder="Emoji"
            placeholderTextColor="#686868"
          />

          <Text style={[styles.legendLabel, { color: theme.secondaryTextColor, marginTop: 8 }]}>{translate('sticker_slogan_label')}</Text>
          <TextInput
            style={[styles.legendInput, { color: theme.textColor, borderColor: theme.borderColor, backgroundColor: theme.isDark ? '#1C1C1E' : '#FFFFFF' }]}
            value={stickerText}
            onChangeText={setStickerText}
            placeholderTextColor="#686868"
          />
        </View>
      )}

      {selectedFormat === 'GIF' && (
        <View style={styles.previewSection}>
          <View style={[styles.gifBubble, { backgroundColor: theme.isDark ? '#1C1C1E' : '#FFFFFF', borderColor: theme.borderColor }]}>
            <Text style={[styles.gifQueryText, { color: theme.textColor }]}>🔍 {gifQuery}</Text>
            <Text style={[styles.gifSubText, { color: theme.secondaryTextColor }]}>
              Requête Giphy optimisée générée avec Gemini 3.5
            </Text>
          </View>

          <Text style={[styles.legendLabel, { color: theme.secondaryTextColor, marginTop: 14 }]}>Modifier la requête de recherche :</Text>
          <TextInput
            style={[styles.legendInput, { color: theme.textColor, borderColor: theme.borderColor, backgroundColor: theme.isDark ? '#1C1C1E' : '#FFFFFF' }]}
            value={gifQuery}
            onChangeText={setGifQuery}
            placeholderTextColor="#686868"
          />
        </View>
      )}

      {selectedFormat === 'VIDEO' && (
        <View style={styles.previewSection}>
          <View style={[styles.videoBubble, { backgroundColor: theme.isDark ? '#1C1C1E' : '#FFFFFF', borderColor: theme.borderColor }]}>
            <Text style={[styles.videoTitleText, { color: theme.accentColor }]}>{videoTitle}</Text>
            <Text style={[styles.videoPunchText, { color: theme.textColor }]}>{videoPunch}</Text>
            <Text style={[styles.videoSubText, { color: theme.secondaryTextColor }]}>
              Storyboard d'animation TikTok généré avec l'IA
            </Text>
          </View>

          <Text style={[styles.legendLabel, { color: theme.secondaryTextColor, marginTop: 14 }]}>Modifier le Titre d'Intro :</Text>
          <TextInput
            style={[styles.legendInput, { color: theme.textColor, borderColor: theme.borderColor, backgroundColor: theme.isDark ? '#1C1C1E' : '#FFFFFF' }]}
            value={videoTitle}
            onChangeText={setVideoTitle}
            placeholderTextColor="#686868"
          />

          <Text style={[styles.legendLabel, { color: theme.secondaryTextColor, marginTop: 8 }]}>Modifier la Punchline Finale :</Text>
          <TextInput
            style={[styles.legendInput, { color: theme.textColor, borderColor: theme.borderColor, backgroundColor: theme.isDark ? '#1C1C1E' : '#FFFFFF' }]}
            value={videoPunch}
            onChangeText={setVideoPunch}
            placeholderTextColor="#686868"
          />
        </View>
      )}

      {/* Save Button */}
      <TouchableOpacity
        onPress={handleSave}
        disabled={isGenerating}
        style={[styles.saveBtn, { backgroundColor: theme.isDark ? '#1C1C1E' : '#FFFFFF', borderColor: theme.borderColor }]}
      >
        <Text style={[styles.saveBtnText, { color: theme.textColor }]}>
          💾 {translate('btn_save')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  aiCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  aiCardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  aiCardSubtitle: {
    fontSize: 11,
    marginTop: 4,
  },
  sectionCard: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionDesc: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 6,
    marginBottom: 12,
  },
  textInput: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    textAlignVertical: 'top',
    fontSize: 13,
  },
  formatCard: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  formatLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  formatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  formatBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 3,
  },
  formatBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  generateBtn: {
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  generateBtnText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  previewSection: {
    width: '100%',
  },
  bgSelectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  presetsRow: {
    flexDirection: 'row',
    marginBottom: 12,
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
  memeTopText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 8,
  },
  memeBottomText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
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
  },
  stickerBubble: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    width: '100%',
    aspectRatio: 1,
    justifyContent: 'center',
  },
  stickerEmojiText: {
    fontSize: 72,
  },
  stickerBubbleText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    textAlign: 'center',
  },
  gifBubble: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    width: '100%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gifQueryText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  gifSubText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  videoBubble: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    width: '100%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoTitleText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  videoPunchText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  videoSubText: {
    fontSize: 11,
    marginTop: 12,
    textAlign: 'center',
    opacity: 0.6,
  },
  saveBtn: {
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 16,
    marginBottom: 40,
  },
  saveBtnText: {
    fontWeight: 'bold',
    fontSize: 14,
  }
});
