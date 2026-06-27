import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, FlatList,
  Modal, Dimensions, Animated, PanResponder, Image,
} from 'react-native';
import RNFS from 'react-native-fs';
import ViewShot from 'react-native-view-shot';
import { useStore } from '../store/useStore';
import { themes, getDerivedColors } from '../theme/colors';
import { t } from '../utils/i18n';
import { loadMemes, deleteMeme as deleteMemeDb } from '../services/database';
import MemeCardPreview from '../components/MemeCardPreview';
import type { MemeEntity } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const filters = ['TOUT', 'MEME', 'STICKER', 'GIF', 'VIDEO'] as const;
const filterEmojis: Record<string, string> = {
  TOUT: '📁', MEME: '🧠', STICKER: '🎨', GIF: '🎬', VIDEO: '📺',
};

function FullPreviewModal({
  visible, memes, startIndex, onClose,
}: {
  visible: boolean; memes: MemeEntity[]; startIndex: number; onClose: () => void;
}) {
  const store = useStore();
  const theme = themes[store.currentTheme as keyof typeof themes] || themes['Dark Void'];
  const derived = getDerivedColors(theme);
  const [currentIdx, setCurrentIdx] = useState(startIndex);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const viewShotRef = useRef<ViewShot>(null);
  const idxRef = useRef(currentIdx);
  const memesRef = useRef(memes);
  idxRef.current = currentIdx;
  memesRef.current = memes;

  useEffect(() => { setCurrentIdx(startIndex); slideAnim.setValue(0); }, [startIndex, visible]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 20 && Math.abs(gs.dx) > Math.abs(gs.dy),
      onPanResponderMove: (_, gs) => { slideAnim.setValue(gs.dx); },
      onPanResponderRelease: (_, gs) => {
        const idx = idxRef.current;
        const m = memesRef.current;
        if (gs.dx < -80 && idx < m.length - 1) {
          setCurrentIdx(idx + 1);
        } else if (gs.dx > 80 && idx > 0) {
          setCurrentIdx(idx - 1);
        }
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }).start();
      },
    }),
  ).current;

  if (!memes[currentIdx]) return null;
  const meme = memes[currentIdx];
  const isSticker = meme.type === 'STICKER';
  const cardBg = meme.bgImageUri || meme.imagePath || meme.audioPath || undefined;

  const handleDownload = async () => {
    if (!viewShotRef.current || typeof viewShotRef.current.capture !== 'function') {
      Alert.alert('Erreur', 'Capture failed');
      return;
    }
    try {
      const uri = await viewShotRef.current.capture();
      const dest = `${RNFS.DownloadDirectoryPath || RNFS.DocumentDirectoryPath}/MemeGen_${meme.id}_${Date.now()}.png`;
      await RNFS.copyFile(uri, dest);
      Alert.alert('Succès', `Mème sauvegardé`);
    } catch { Alert.alert('Erreur', 'Échec'); }
  };

  const handleShare = async () => {
    if (!viewShotRef.current || typeof viewShotRef.current.capture !== 'function') return;
    try {
      const uri = await viewShotRef.current.capture();
      const Share = require('react-native-share').default;
      await Share.open({ url: `file://${uri}`, type: 'image/png' });
    } catch {}
  };

  const handleDelete = () => {
    const idx = idxRef.current;
    const m = memesRef.current;
    const targetMeme = m[idx];
    if (!targetMeme) return;
    Alert.alert('Supprimer ?', '', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        await deleteMemeDb(targetMeme.id);
        store.removeSavedMeme(targetMeme.id);
        const newMemes = m.filter((_, i) => i !== idx);
        if (newMemes.length === 0) onClose();
        else if (idx >= newMemes.length) setCurrentIdx(newMemes.length - 1);
      }},
    ]);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.92)' }]}>
        <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
          <Text style={styles.modalCloseText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.modalCounter}>{currentIdx + 1} / {memes.length}</Text>

        <Animated.View
          {...panResponder.panHandlers}
          style={[styles.modalPreviewWrap, { transform: [{ translateX: slideAnim }] }]}
        >
          <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }}>
            <MemeCardPreview
              templateIndex={0}
              topText={isSticker ? '' : meme.topText}
              bottomText={isSticker ? '' : meme.bottomText}
              customBgUri={cardBg}
              size={SCREEN_WIDTH - 64}
              showBorder={false}
            />
            {isSticker && (
              <View style={styles.modalStickerOverlay}>
                <Text style={styles.modalStickerText}>{meme.topText}</Text>
              </View>
            )}
          </ViewShot>
        </Animated.View>

        <Text style={styles.modalType}>{meme.type} • {new Date(meme.timestamp).toLocaleDateString()}</Text>

        <View style={styles.modalActions}>
          <TouchableOpacity style={[styles.modalActionBtn, { backgroundColor: '#10B981' }]} onPress={handleDownload}>
            <Text style={styles.modalActionIcon}>⬇</Text>
            <Text style={styles.modalActionLabel}>Télécharger</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modalActionBtn, { backgroundColor: '#3B82F6' }]} onPress={handleShare}>
            <Text style={styles.modalActionIcon}>↗</Text>
            <Text style={styles.modalActionLabel}>Partager</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modalActionBtn, { backgroundColor: '#EF4444' }]} onPress={handleDelete}>
            <Text style={styles.modalActionIcon}>✕</Text>
            <Text style={styles.modalActionLabel}>Supprimer</Text>
          </TouchableOpacity>
        </View>

        {memes.length > 1 && (
          <View style={styles.modalDots}>
            {memes.map((_, i) => (
              <View key={i} style={[styles.dot, i === currentIdx && styles.dotActive]} />
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
}

export default function MemeLibraryScreen() {
  const store = useStore();
  const theme = themes[store.currentTheme as keyof typeof themes] || themes['Dark Void'];
  const derived = getDerivedColors(theme);
  const [activeFilter, setActiveFilter] = useState<string>('TOUT');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const viewShotRefs = useRef<Map<number, ViewShot>>(new Map());

  useEffect(() => {
    loadMemes().then(store.setSavedMemes);
  }, []);

  const filteredMemes = activeFilter === 'TOUT'
    ? store.savedMemes
    : store.savedMemes.filter((m) => m.type === activeFilter);

  const openPreview = (idx: number) => {
    setPreviewIndex(idx);
    setPreviewOpen(true);
  };

  const handleDownload = async (meme: MemeEntity) => {
    const ref = viewShotRefs.current.get(meme.id);
    if (!ref || typeof ref.capture !== 'function') {
      Alert.alert('Erreur', 'Impossible de capturer le meme');
      return;
    }
    try {
      const uri = await ref.capture();
      const dest = `${RNFS.DownloadDirectoryPath || RNFS.DocumentDirectoryPath}/MemeGen_${meme.id}_${Date.now()}.png`;
      await RNFS.copyFile(uri, dest);
      Alert.alert('Succès', `Mème sauvegardé dans : ${dest}`);
    } catch {
      Alert.alert('Erreur', 'Échec de la sauvegarde');
    }
  };

  const handleShareMeme = async (meme: MemeEntity) => {
    const ref = viewShotRefs.current.get(meme.id);
    if (!ref || typeof ref.capture !== 'function') {
      Alert.alert('Erreur', 'Impossible de partager');
      return;
    }
    try {
      const uri = await ref.capture();
      const Share = require('react-native-share').default;
      await Share.open({ url: `file://${uri}`, type: 'image/png' });
    } catch {}
  };

  const handleDelete = (meme: MemeEntity) => {
    Alert.alert(
      t('delete_confirm', store.currentLanguage) || 'Supprimer ce mème ?',
      '',
      [
        { text: t('close', store.currentLanguage) || 'Annuler', style: 'cancel' },
        {
          text: t('delete', store.currentLanguage) || 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteMemeDb(meme.id);
            store.removeSavedMeme(meme.id);
          },
        },
      ],
    );
  };

  const renderItem = ({ item, index }: { item: MemeEntity; index: number }) => {
    const isSticker = item.type === 'STICKER';
    const cardBg = item.bgImageUri || item.imagePath || item.audioPath || undefined;
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => openPreview(index)}
        style={[styles.cardOuter, { backgroundColor: derived.cardBackground, borderColor: derived.borderColor }]}
      >
        <ViewShot
          ref={(r) => { if (r) viewShotRefs.current.set(item.id, r); }}
          options={{ format: 'png', quality: 0.9 }}
        >
          <MemeCardPreview
            templateIndex={0}
            topText={isSticker ? '' : item.topText}
            bottomText={isSticker ? '' : item.bottomText}
            customBgUri={cardBg}
            size={280}
            showBorder={false}
          />
          {isSticker && (
            <View style={styles.stickerOverlay}>
              <Text style={styles.stickerText}>{item.topText}</Text>
            </View>
          )}
        </ViewShot>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
            onPress={() => handleDownload(item)}
          >
            <Text style={styles.actionBtnIcon}>⬇</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#3B82F6' }]}
            onPress={() => handleShareMeme(item)}
          >
            <Text style={styles.actionBtnIcon}>↗</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#EF4444' }]}
            onPress={() => handleDelete(item)}
          >
            <Text style={styles.actionBtnIcon}>✕</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.cardType, { color: derived.secondaryTextColor }]}>
          {item.type} • {new Date(item.timestamp).toLocaleDateString()}
        </Text>
      </TouchableOpacity>
    );
  };

  if (store.savedMemes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.aiCard, { backgroundColor: derived.cardBackground, borderColor: derived.borderColor }]}>
          <Text style={{ color: derived.secondaryTextColor, fontSize: 12 }}>Meme Library Archive</Text>
        </View>
        <Text style={{ fontSize: 64, opacity: 0.5, marginTop: 32 }}>🖼️</Text>
        <Text style={[styles.emptyText, { color: derived.textColor }]}>
          {t('no_memes', store.currentLanguage)}
        </Text>
        <Text style={[styles.emptyHint, { color: derived.secondaryTextColor }]}>
          {t('no_memes_hint', store.currentLanguage)}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.aiCard, { backgroundColor: derived.cardBackground, borderColor: derived.borderColor }]}>
        <Text style={{ color: derived.secondaryTextColor, fontSize: 12 }}>Meme Library Archive</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterChip,
              { borderColor: derived.borderColor, minWidth: 80 },
              activeFilter === filter && { backgroundColor: theme.accentColor },
            ]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text style={[styles.filterText, { color: activeFilter === filter ? '#fff' : derived.textColor }]}>
              {filterEmojis[filter]} {filter === 'TOUT' ? t('all', store.currentLanguage) : filter === 'MEME' ? t('meme', store.currentLanguage) : filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={[styles.sectionTitle, { color: derived.textColor }]}>
        {t('my_memes', store.currentLanguage)}
      </Text>

      <FlatList
        data={filteredMemes}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridList}
        ListEmptyComponent={
          <View style={styles.emptyFilterContainer}>
            <Text style={[styles.emptyFilterText, { color: derived.secondaryTextColor }]}>
              {t('empty_filter', store.currentLanguage)}
            </Text>
          </View>
        }
      />

      <FullPreviewModal
        visible={previewOpen}
        memes={filteredMemes}
        startIndex={previewIndex}
        onClose={() => setPreviewOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  aiCard: { borderRadius: 24, borderWidth: 1, padding: 16 },
  emptyText: { fontSize: 18, fontWeight: '700', marginTop: 16 },
  emptyHint: { fontSize: 13, textAlign: 'center', lineHeight: 18, marginTop: 8 },
  filterRow: { flexGrow: 0 },
  filterChip: { borderWidth: 1, paddingHorizontal: 16, paddingVertical: 6, marginRight: 8, borderRadius: 20, alignItems: 'center' },
  filterText: { fontSize: 11, fontWeight: '600' },
  sectionTitle: { fontSize: 14, fontWeight: '600' },
  gridRow: { gap: 12, marginBottom: 12 },
  gridList: { paddingBottom: 40 },
  cardOuter: { flex: 1, borderRadius: 16, borderWidth: 1, overflow: 'hidden', padding: 8, gap: 6 },
  cardActions: { flexDirection: 'row', justifyContent: 'space-around', gap: 4, marginTop: 4 },
  actionBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  actionBtnIcon: { color: '#fff', fontSize: 14, fontWeight: '700' },
  cardType: { fontSize: 9, textAlign: 'center' },
  stickerOverlay: { position: 'absolute', bottom: 8, left: 0, right: 0, alignItems: 'center' },
  stickerText: { color: '#fff', fontSize: 16, fontWeight: '800', textShadowColor: '#000', textShadowRadius: 4, textShadowOffset: { width: 1, height: 1 } },
  emptyFilterContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyFilterText: { fontSize: 13, textAlign: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  modalCloseBtn: { position: 'absolute', top: 50, right: 24, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  modalCloseText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  modalCounter: { position: 'absolute', top: 56, left: 24, color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '600' },
  modalPreviewWrap: { width: SCREEN_WIDTH - 64, height: (SCREEN_WIDTH - 64) * 1.2, justifyContent: 'center', alignItems: 'center' },
  modalType: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 16 },
  modalActions: { flexDirection: 'row', gap: 16, marginTop: 20 },
  modalActionBtn: { width: 96, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', gap: 2 },
  modalActionIcon: { color: '#fff', fontSize: 18 },
  modalActionLabel: { color: '#fff', fontSize: 9, fontWeight: '600' },
  modalStickerOverlay: { position: 'absolute', bottom: 12, left: 0, right: 0, alignItems: 'center' },
  modalStickerText: { color: '#fff', fontSize: 24, fontWeight: '800', textShadowColor: '#000', textShadowRadius: 6, textShadowOffset: { width: 2, height: 2 } },
  modalDots: { flexDirection: 'row', gap: 8, marginTop: 16 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)' },
  dotActive: { backgroundColor: '#fff' },
});
