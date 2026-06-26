import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import ViewShot, { captureRef } from 'react-native-view-shot';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import ReceiveSharingIntent from 'react-native-receive-sharing-intent';
import { analyzeText } from '../services/api';

interface Meme {
  topText: string;
  bottomText: string;
  emoji: string;
  caption: string;
  imageUrl: string | null;
}

export default function ContextReaderScreen() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [meme, setMeme] = useState<Meme | null>(null);
  const memeRef = useRef<any>(null);

  useEffect(() => {
    ReceiveSharingIntent.getReceivedFiles(
      (files: any) => {
        if (files && files.length > 0 && files[0].text) {
          setText(files[0].text);
        }
      },
      (error: any) => {
        console.log('Share intent error:', error);
      },
      'memeforge'
    );

    return () => {
      ReceiveSharingIntent.clearReceivedFiles();
    };
  }, []);

  const generateMeme = async () => {
    if (!text.trim()) {
      Alert.alert('Oups !', 'Colle un texte avant de générer 😅');
      return;
    }
    setLoading(true);
    setMeme(null);

    try {
      const data = await analyzeText(text);
      setMeme({
        topText: data.topText || 'MÈME GÉNÉRÉ',
        bottomText: data.bottomText || 'PAR GEMINI AI 🔥',
        emoji: data.emoji || '😂',
        caption: data.caption || 'Généré par Gemini',
        imageUrl: data.imageUrl || null,
      });
    } catch (error) {
      Alert.alert(
        '⚠️ Backend indisponible',
        "Le serveur de B1 n'est pas accessible. Mode démo activé.",
        [{ text: 'OK' }]
      );
      setMeme({
        topText: 'EN ROUTE DEPUIS 1H...',
        bottomText: 'LA DOUCHE : ALLOW ME 😂',
        emoji: '🚿',
        caption: '"Mode démo — connecte le backend B1"',
        imageUrl: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const saveMeme = async () => {
    try {
      if (Platform.OS === 'android') {
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
            {
              title: 'Permission Galerie',
              message: "MemeForge a besoin d'accéder à ta galerie.",
              buttonPositive: 'OK',
              buttonNegative: 'Annuler',
            }
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert('Permission refusée', 'Impossible de sauvegarder sans permission.');
            return;
          }
        } else {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
              title: 'Permission Galerie',
              message: "MemeForge a besoin d'accéder à ta galerie.",
              buttonPositive: 'OK',
              buttonNegative: 'Annuler',
            }
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert('Permission refusée', 'Impossible de sauvegarder sans permission.');
            return;
          }
        }
      }

      const uri = await captureRef(memeRef.current, {
        format: 'jpg',
        quality: 0.9,
      });

      const destPath = `${RNFS.PicturesDirectoryPath}/meme_${Date.now()}.jpg`;
      await RNFS.copyFile(uri, destPath);
      await RNFS.scanFile(destPath);

      Alert.alert('✅ Sauvegardé !', 'Ton mème est dans ta galerie 🎉');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder le mème.');
      console.error(error);
    }
  };

  const shareMeme = async () => {
    try {
      const uri = await captureRef(memeRef.current, {
        format: 'jpg',
        quality: 0.9,
      });

      await Share.open({
        url: `file://${uri}`,
        type: 'image/jpeg',
        title: 'Mon mème MemeForge 🔥',
        message: 'Généré par MemeForge AI 😂',
      });
    } catch (error: any) {
      if (error?.message !== 'User did not share') {
        Alert.alert('Erreur', 'Impossible de partager le mème.');
      }
    }
  };

  return (
    <LinearGradient
      colors={['#2D1154', '#5C2D8F', '#A0522D', '#D4956A']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe}>

        {/* Emojis flottants */}
        <View style={styles.floatingContainer} pointerEvents="none">
          <Text style={[styles.floatingEmoji, { top: 120, left: 20, fontSize: 38 }]}>😂</Text>
          <Text style={[styles.floatingEmoji, { top: 110, left: 120, fontSize: 28 }]}>🤣</Text>
          <Text style={[styles.floatingEmoji, { top: 130, right: 20, fontSize: 34 }]}>😱</Text>
          <Text style={[styles.floatingEmoji, { top: 180, left: 10, fontSize: 26 }]}>😤</Text>
          <Text style={[styles.floatingEmoji, { top: 170, right: 15, fontSize: 28 }]}>🤡</Text>
          <Text style={[styles.floatingEmoji, { top: 230, left: 40, fontSize: 25 }]}>💀</Text>
          <Text style={[styles.floatingEmoji, { top: 340, right: 60, fontSize: 30 }]}>🔥</Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerLabel}>CONTEXT READER</Text>
            <Text style={styles.headerSub}>MemeForge AI ✦</Text>
          </View>
          <View style={styles.headerIcon}>
            <Text style={{ fontSize: 16 }}>⚙️</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>

            <Text style={styles.cardTitle}>Texte → Mème instantané</Text>
            <Text style={styles.cardSubtitle}>
              Colle un extrait de discussion. L'IA analyse le contexte et génère le mème parfait.
            </Text>

            {/* Input */}
            <TextInput
              style={styles.input}
              placeholder="Colle ton texte ici... 😭"
              placeholderTextColor="rgba(255,255,255,0.3)"
              multiline
              maxLength={500}
              value={text}
              onChangeText={setText}
            />
            <Text style={styles.counter}>{text.length} / 500</Text>

            {/* Bouton générer */}
            <TouchableOpacity
              style={[styles.btnPrimary, loading && styles.btnDisabled]}
              onPress={generateMeme}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.btnPrimaryText}>
                {loading ? 'GÉNÉRATION EN COURS...' : 'GÉNÉRER MON MÈME →'}
              </Text>
            </TouchableOpacity>

            {loading && (
              <ActivityIndicator size="large" color="#D4956A" style={{ marginBottom: 16 }} />
            )}

            {/* Résultat */}
            {meme && (
              <>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>Résultat</Text>
                  <View style={styles.dividerLine} />
                </View>

                <ViewShot ref={memeRef} options={{ format: 'jpg', quality: 0.9 }}>
                  <View style={styles.resultCard}>
                    <View style={styles.resultImage}>
                      <LinearGradient
                        colors={['#1a0533', '#3B1F6B', '#5C2D8F']}
                        style={styles.memeImageGradient}
                      >
                        <Text style={styles.memeEmoji}>{meme.emoji}</Text>
                      </LinearGradient>
                      <Text style={styles.memeTextTop}>{meme.topText}</Text>
                      <Text style={styles.memeTextBottom}>{meme.bottomText}</Text>
                    </View>
                    <View style={styles.resultFooter}>
                      <Text style={styles.resultCaption}>💬 {meme.caption}</Text>
                      <View style={styles.geminiBadge}>
                        <Text style={styles.geminiText}>✨ GEMINI</Text>
                      </View>
                    </View>
                  </View>
                </ViewShot>

                <View style={styles.btnRow}>
                  <TouchableOpacity style={styles.btnSecondary} onPress={saveMeme}>
                    <Text style={styles.btnSecondaryText}>💾 Sauvegarder</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnSecondary} onPress={shareMeme}>
                    <Text style={styles.btnSecondaryText}>📤 Partager</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  floatingContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 0,
  },
  floatingEmoji: {
    position: 'absolute',
    opacity: 0.9,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  headerSub: {
    color: '#D4956A',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  headerIcon: {
    width: 34,
    height: 34,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: 'rgba(15,5,30,0.85)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 0,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 6,
    lineHeight: 28,
  },
  cardSubtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 18,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 16,
    padding: 14,
    color: '#fff',
    fontSize: 13,
    minHeight: 90,
    textAlignVertical: 'top',
    marginBottom: 6,
  },
  counter: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 10,
    textAlign: 'right',
    marginBottom: 14,
  },
  btnPrimary: {
    backgroundColor: '#fff',
    borderRadius: 50,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 16,
  },
  btnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  btnPrimaryText: {
    color: '#2D1154',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  resultCard: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.13)',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 14,
  },
  resultImage: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  memeImageGradient: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memeEmoji: {
    fontSize: 60,
  },
  memeTextTop: {
    position: 'absolute',
    top: 10, left: 10, right: 10,
    textAlign: 'center',
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 1,
    textTransform: 'uppercase',
  },
  memeTextBottom: {
    position: 'absolute',
    bottom: 10, left: 10, right: 10,
    textAlign: 'center',
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 1,
    textTransform: 'uppercase',
  },
  resultFooter: {
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultCaption: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontStyle: 'italic',
    flex: 1,
    marginRight: 8,
  },
  geminiBadge: {
    backgroundColor: 'rgba(212,149,106,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(212,149,106,0.4)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  geminiText: {
    color: '#D4956A',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 50,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '700',
  },
});