import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
  Alert,
  Share,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TRANSLATIONS, ThemeProperties } from './ThemeAndLang';

const { width } = Dimensions.get('window');

interface MemeLibraryProps {
  currentLang: 'FR' | 'EN';
  theme: ThemeProperties;
  onRefreshTrigger?: number; // to trigger reload from outer state
}

export interface SavedMeme {
  id: string;
  type: 'MEME' | 'STICKER' | 'GIF' | 'VIDEO';
  topText?: string;
  bottomText?: string;
  bgIdx?: number;
  emoji?: string;
  text?: string;
  gifQuery?: string;
  videoTitle?: string;
  videoPunchline?: string;
  timestamp: number;
}

const PRESET_COLORS = [
  ['#8A2387', '#E94057', '#F27121'], // Sunset
  ['#00F2FE', '#4FACFE'], // Ocean
  ['#11998E', '#38EF7D'], // Forest
  ['#1F1C2C', '#928DAB'], // Gothic
  ['#ED213A', '#93291E']  // Fire
];

export default function MemeLibrary({ currentLang, theme, onRefreshTrigger }: MemeLibraryProps) {
  const [items, setItems] = useState<SavedMeme[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'MEME' | 'STICKER' | 'GIF' | 'VIDEO'>('ALL');
  const [activeItem, setActiveItem] = useState<SavedMeme | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const translate = (key: string) => {
    return TRANSLATIONS[currentLang][key] || key;
  };

  const loadSavedItems = async () => {
    try {
      const raw = await AsyncStorage.getItem('SAVED_MEMES');
      if (raw) {
        const parsed = JSON.parse(raw) as SavedMeme[];
        // Sort newest first
        parsed.sort((a, b) => b.timestamp - a.timestamp);
        setItems(parsed);
      } else {
        setItems([]);
      }
    } catch (e) {
      console.error('Error loading saved memes', e);
    }
  };

  useEffect(() => {
    loadSavedItems();
  }, [onRefreshTrigger]);

  const handleDelete = async (id: string) => {
    try {
      const updated = items.filter(it => it.id !== id);
      setItems(updated);
      await AsyncStorage.setItem('SAVED_MEMES', JSON.stringify(updated));
      setModalVisible(false);
      setActiveItem(null);
      Alert.alert(
        currentLang === 'FR' ? 'Supprimé' : 'Deleted',
        translate('meme_deleted')
      );
    } catch {
      Alert.alert('Error', 'Failed to delete item');
    }
  };

  const handleShare = async (item: SavedMeme) => {
    let message = '';
    if (item.type === 'MEME') {
      message = `[Mème] ${item.topText} -- ${item.bottomText}`;
    } else if (item.type === 'STICKER') {
      message = `[Sticker] ${item.emoji} ${item.text}`;
    } else if (item.type === 'GIF') {
      message = `[GIF Query] 🔍 ${item.gifQuery}`;
    } else if (item.type === 'VIDEO') {
      message = `[Short Vidéo] 🎬 Introduction: ${item.videoTitle} || Punchline: ${item.videoPunchline}`;
    }

    try {
      await Share.share({
        message: `${message} \n- Généré avec l'Intelligence Artificielle MemeGen AI ! ✨`
      });
    } catch (error) {
      console.error('Error sharing', error);
    }
  };

  const filteredItems = items.filter((it) => {
    if (selectedFilter === 'ALL') return true;
    return it.type === selectedFilter;
  });

  const renderItemCard = ({ item }: { item: SavedMeme }) => {
    if (item.type === 'MEME') {
      const colors = PRESET_COLORS[item.bgIdx ?? 0] || PRESET_COLORS[0];
      return (
        <TouchableOpacity
          style={[styles.memeThumbnail, { backgroundColor: colors[0] }]}
          onPress={() => {
            setActiveItem(item);
            setModalVisible(true);
          }}
        >
          <Text style={styles.thumbMemeTop} numberOfLines={2}>{item.topText}</Text>
          <Text style={styles.thumbMemeBottom} numberOfLines={2}>{item.bottomText}</Text>
          <View style={styles.typeTag}>
            <Text style={styles.typeTagText}>🧠 MEME</Text>
          </View>
        </TouchableOpacity>
      );
    }

    if (item.type === 'STICKER') {
      return (
        <TouchableOpacity
          style={[styles.stickerThumbnail, { backgroundColor: theme.isDark ? '#1C1C1E' : '#FFFFFF', borderColor: theme.borderColor }]}
          onPress={() => {
            setActiveItem(item);
            setModalVisible(true);
          }}
        >
          <Text style={styles.thumbStickerEmoji}>{item.emoji}</Text>
          <Text style={[styles.thumbStickerText, { color: theme.textColor }]} numberOfLines={1}>{item.text}</Text>
          <View style={[styles.typeTag, { backgroundColor: 'rgba(253, 164, 175, 0.25)' }]}>
            <Text style={[styles.typeTagText, { color: '#FDA4AF' }]}>🎨 STICKER</Text>
          </View>
        </TouchableOpacity>
      );
    }

    if (item.type === 'GIF') {
      return (
        <TouchableOpacity
          style={[styles.gifThumbnail, { backgroundColor: theme.isDark ? '#1C1C1E' : '#FFFFFF', borderColor: theme.borderColor }]}
          onPress={() => {
            setActiveItem(item);
            setModalVisible(true);
          }}
        >
          <Text style={styles.gifSearchIcon}>🎬</Text>
          <Text style={[styles.thumbGifQuery, { color: theme.textColor }]} numberOfLines={2}>"{item.gifQuery}"</Text>
          <View style={[styles.typeTag, { backgroundColor: 'rgba(56, 189, 248, 0.2)' }]}>
            <Text style={[styles.typeTagText, { color: '#38BDF8' }]}>🎬 GIF</Text>
          </View>
        </TouchableOpacity>
      );
    }

    // Video
    return (
      <TouchableOpacity
        style={[styles.videoThumbnail, { backgroundColor: theme.isDark ? '#1C1C1E' : '#FFFFFF', borderColor: theme.borderColor }]}
        onPress={() => {
          setActiveItem(item);
          setModalVisible(true);
        }}
      >
        <Text style={[styles.videoTitleThumb, { color: theme.accentColor }]} numberOfLines={1}>{item.videoTitle}</Text>
        <Text style={[styles.videoPunchThumb, { color: theme.textColor }]} numberOfLines={1}>{item.videoPunchline}</Text>
        <View style={[styles.typeTag, { backgroundColor: 'rgba(168, 85, 247, 0.2)' }]}>
          <Text style={[styles.typeTagText, { color: '#C084FC' }]}>📺 VIDEO</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const filters = [
    { id: 'ALL', label: translate('filter_all') },
    { id: 'MEME', label: translate('filter_memes') },
    { id: 'STICKER', label: translate('filter_stickers') },
    { id: 'GIF', label: translate('filter_gifs') },
    { id: 'VIDEO', label: translate('filter_videos') },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.baseColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.textColor }]}>
          📂 {translate('created_memes')}
        </Text>
      </View>

      {/* Filters Horizontal Row */}
      <View style={styles.filterWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {filters.map((f) => {
            const isSelected = selectedFilter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                style={[
                  styles.filterChip,
                  { backgroundColor: theme.isDark ? '#1C1C1E' : '#E2E8F0', borderColor: theme.borderColor },
                  isSelected && { backgroundColor: theme.accentColor, borderColor: theme.accentColor }
                ]}
                onPress={() => setSelectedFilter(f.id as any)}
              >
                <Text style={[styles.filterLabel, { color: isSelected ? '#000000' : theme.textColor }]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Grid Content */}
      {filteredItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>👻</Text>
          <Text style={[styles.emptyTitle, { color: theme.textColor }]}>
            {translate('no_memes_saved')}
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.secondaryTextColor }]}>
            {translate('library_empty_tip')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(it) => it.id}
          renderItem={renderItemCard}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.columnWrapper}
        />
      )}

      {/* Actions Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={[styles.modalContent, { backgroundColor: theme.isDark ? '#1C1C1E' : '#FFFFFF', borderColor: theme.borderColor }]}>
            <Text style={[styles.modalTitle, { color: theme.textColor }]}>
              🌟 {translate('menu_actions_title')}
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.secondaryTextColor }]}>
              {translate('what_to_do_question')}
            </Text>

            {/* Live Render for preview inside the modal */}
            {activeItem && (
              <View style={styles.modalPreviewWrapper}>
                {activeItem.type === 'MEME' && (
                  <View style={[styles.modalMemePreview, { backgroundColor: (PRESET_COLORS[activeItem.bgIdx ?? 0] || PRESET_COLORS[0])[0] }]}>
                    <Text style={styles.previewMemeText}>{activeItem.topText}</Text>
                    <Text style={styles.previewMemeText}>{activeItem.bottomText}</Text>
                  </View>
                )}

                {activeItem.type === 'STICKER' && (
                  <View style={styles.modalStickerPreview}>
                    <Text style={styles.previewStickerEmoji}>{activeItem.emoji}</Text>
                    <Text style={[styles.previewStickerText, { color: theme.textColor }]}>{activeItem.text}</Text>
                  </View>
                )}

                {activeItem.type === 'GIF' && (
                  <View style={styles.modalGifPreview}>
                    <Text style={styles.previewGifIcon}>🔍</Text>
                    <Text style={[styles.previewGifQuery, { color: theme.textColor }]}>"{activeItem.gifQuery}"</Text>
                  </View>
                )}

                {activeItem.type === 'VIDEO' && (
                  <View style={styles.modalVideoPreview}>
                    <Text style={[styles.previewVideoTitle, { color: theme.accentColor }]}>{activeItem.videoTitle}</Text>
                    <Text style={[styles.previewVideoPunch, { color: theme.textColor }]}>{activeItem.videoPunchline}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Action buttons */}
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={[styles.modalActionBtn, { backgroundColor: theme.accentColor }]}
                onPress={() => activeItem && handleShare(activeItem)}
              >
                <Text style={styles.actionBtnText}>🚀 {translate('btn_share_label')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalActionBtn, { backgroundColor: '#EF4444' }]}
                onPress={() => activeItem && handleDelete(activeItem.id)}
              >
                <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>🗑️ {translate('btn_delete_label')}</Text>
              </TouchableOpacity>
            </View>

            {/* Close Button */}
            <TouchableOpacity
              style={[styles.closeModalBtn, { borderColor: theme.borderColor }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={[styles.closeModalText, { color: theme.textColor }]}>
                {translate('btn_close_label')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  filterWrapper: {
    height: 48,
    marginVertical: 4,
  },
  filterRow: {
    paddingHorizontal: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  gridContent: {
    padding: 12,
    paddingBottom: 40,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  memeThumbnail: {
    width: (width - 36) / 2,
    height: (width - 36) / 2,
    borderRadius: 16,
    padding: 12,
    justifyContent: 'space-between',
    marginBottom: 12,
    overflow: 'hidden',
  },
  thumbMemeTop: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 4,
  },
  thumbMemeBottom: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 4,
  },
  typeTag: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeTagText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  stickerThumbnail: {
    width: (width - 36) / 2,
    height: (width - 36) / 2,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
  },
  thumbStickerEmoji: {
    fontSize: 48,
  },
  thumbStickerText: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  gifThumbnail: {
    width: (width - 36) / 2,
    height: (width - 36) / 2,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
  },
  gifSearchIcon: {
    fontSize: 36,
  },
  thumbGifQuery: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  videoThumbnail: {
    width: (width - 36) / 2,
    height: (width - 36) / 2,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    padding: 12,
    marginBottom: 12,
  },
  videoTitleThumb: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  videoPunchThumb: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width - 48,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  modalPreviewWrapper: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  modalMemePreview: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewMemeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 6,
  },
  modalStickerPreview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(128,128,128,0.05)',
  },
  previewStickerEmoji: {
    fontSize: 72,
  },
  previewStickerText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
    textAlign: 'center',
  },
  modalGifPreview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(128,128,128,0.05)',
    padding: 16,
  },
  previewGifIcon: {
    fontSize: 54,
  },
  previewGifQuery: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  modalVideoPreview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(128,128,128,0.05)',
    padding: 16,
  },
  previewVideoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  previewVideoPunch: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  modalActionsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalActionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  actionBtnText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 12,
  },
  closeModalBtn: {
    width: '100%',
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeModalText: {
    fontSize: 12,
    fontWeight: 'bold',
  }
});
