import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { TRANSLATIONS, ThemeProperties } from './ThemeAndLang';

const { width } = Dimensions.get('window');

interface SplashScreenProps {
  currentLang: 'FR' | 'EN';
  theme: ThemeProperties;
  onEnter: () => void;
}

const FLOATING_EMOJIS = ['🧠', '😂', '🎙️', '📸', '🎬', '🔥', '💀', '👽'];

export default function SplashScreen({ currentLang, theme, onEnter }: SplashScreenProps) {
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [progressText, setProgressText] = useState('');
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.95))[0];

  const translate = (key: string) => {
    return TRANSLATIONS[currentLang][key] || key;
  };

  useEffect(() => {
    // Elegant fade-in transition
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Simulated initialization progress
    const steps = [
      currentLang === 'FR' ? "Initialisation du moteur de blagues..." : "Initializing joke engine...",
      currentLang === 'FR' ? "Connexion sécurisée aux modèles Gemini..." : "Securing connection to Gemini models...",
      currentLang === 'FR' ? "Chargement des thèmes haptiques..." : "Loading haptic themes...",
      currentLang === 'FR' ? "Votre studio créatif est prêt !" : "Your creative studio is ready!"
    ];

    let currentStep = 0;
    setProgressText(steps[0]);

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setProgressText(steps[currentStep]);
      } else {
        clearInterval(interval);
        setLoadingComplete(true);
      }
    }, 900);

    return () => clearInterval(interval);
  }, [currentLang]);

  return (
    <View style={[styles.container, { backgroundColor: theme.baseColor }]}>
      {/* Decorative background elements */}
      <View style={styles.emojiField}>
        {FLOATING_EMOJIS.map((em, idx) => (
          <Text
            key={idx}
            style={[
              styles.floatingEmoji,
              {
                left: `${10 + idx * 11}%`,
                top: `${15 + (idx % 3) * 20}%`,
                opacity: 0.12,
              }
            ]}
          >
            {em}
          </Text>
        ))}
      </View>

      <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        {/* Animated Accent Spotlight Ring */}
        <View style={[styles.spotlightRing, { borderColor: theme.accentColor }]}>
          <Text style={styles.heroLogo}>🤖</Text>
        </View>

        <Text style={[styles.welcomeTitle, { color: theme.textColor }]}>
          {translate('welcome_title')}
        </Text>

        <Text style={[styles.titleBrand, { color: theme.accentColor }]}>
          MemeGen AI
        </Text>

        <Text style={[styles.desc, { color: theme.secondaryTextColor }]}>
          {translate('welcome_desc')}
        </Text>

        {/* Loading Progress Bar */}
        <View style={styles.progressContainer}>
          {!loadingComplete ? (
            <View style={styles.loaderRow}>
              <ActivityIndicator size="small" color={theme.accentColor} />
              <Text style={[styles.progressText, { color: theme.secondaryTextColor }]}>
                {progressText}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.startBtn, { backgroundColor: theme.accentColor }]}
              onPress={onEnter}
            >
              <Text style={styles.startBtnText}>
                🚀 {translate('btn_start_experience')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      <Text style={[styles.versionLabel, { color: theme.secondaryTextColor, opacity: 0.4 }]}>
        MemeGen AI Studio v2.5 • React Native CLI
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emojiField: {
    ...StyleSheet.absoluteFillObject,
  },
  floatingEmoji: {
    position: 'absolute',
    fontSize: 32,
  },
  card: {
    width: width - 48,
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotlightRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(128,128,128,0.05)',
  },
  heroLogo: {
    fontSize: 44,
  },
  welcomeTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 3,
  },
  titleBrand: {
    fontSize: 36,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  desc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginVertical: 12,
  },
  progressContainer: {
    height: 60,
    justifyContent: 'center',
    width: '100%',
    marginTop: 16,
  },
  loaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 10,
  },
  startBtn: {
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startBtnText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 13,
  },
  versionLabel: {
    position: 'absolute',
    bottom: 24,
    fontSize: 10,
    fontWeight: '600',
  }
});
