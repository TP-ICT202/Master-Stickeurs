import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  Platform,
  SafeAreaView,
} from 'react-native';

// NOTE SUR LES GRADIENS (IMPORTANT) :
// Pour reproduire exactement le dégradé "Pre-dawn wash" original sans ajouter de dépendance lourde,
// nous avons conçu ce composant pour utiliser soit 'react-native-linear-gradient' (recommandé en production),
// soit un système de couches de couleurs superposées en CSS natif de haute qualité comme solution prête à l'emploi.
//
// SI VOUS UTILISEZ 'react-native-linear-gradient' DANS VOTRE PROJET :
// 1. Installez le package : npm install react-native-linear-gradient
// 2. Décommentez la ligne suivante et remplacez la vue d'arrière-plan par <LinearGradient> :
// import LinearGradient from 'react-native-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Propriétés des 24 émojis flottants fidèlement tirés du code Kotlin d'origine
const BACKGROUND_EMOJIS = [
  { emoji: "😂", x: -130, y: -280, size: 48, rot: 15, duration: 1800 },
  { emoji: "😱", x: 130, y: -260, size: 54, rot: -20, duration: 2200 },
  { emoji: "😡", x: -140, y: -160, size: 40, rot: 10, duration: 2000 },
  { emoji: "🕺", x: 140, y: -140, size: 58, rot: -15, duration: 2500 },
  { emoji: "💀", x: -150, y: 100, size: 50, rot: 25, duration: 1900 },
  { emoji: "🔥", x: 150, y: 110, size: 48, rot: -30, duration: 1700 },
  { emoji: "🤔", x: -120, y: 250, size: 44, rot: -12, duration: 2400 },
  { emoji: "🤡", x: 120, y: 240, size: 50, rot: 18, duration: 2100 },
  { emoji: "🤖", x: -140, y: -50, size: 42, rot: -5, duration: 2300 },
  { emoji: "🚀", x: 140, y: -20, size: 54, rot: 45, duration: 1600 },
  { emoji: "👀", x: -70, y: -320, size: 40, rot: -18, duration: 2000 },
  { emoji: "🎉", x: 70, y: -310, size: 44, rot: 25, duration: 2100 },
  { emoji: "🤦", x: -80, y: 310, size: 48, rot: 30, duration: 2300 },
  { emoji: "🤫", x: 80, y: 310, size: 42, rot: -15, duration: 2200 },
  { emoji: "🤯", x: -50, y: 190, size: 54, rot: 10, duration: 1800 },
  { emoji: "👾", x: 50, y: -200, size: 44, rot: -8, duration: 1900 },
  { emoji: "💩", x: -150, y: 180, size: 42, rot: -25, duration: 2000 },
  { emoji: "🍕", x: 150, y: 180, size: 44, rot: 12, duration: 2400 },
  { emoji: "😜", x: -60, y: -110, size: 40, rot: 35, duration: 2200 },
  { emoji: "😎", x: 60, y: -90, size: 44, rot: -45, duration: 2100 },
  { emoji: "✨", x: -90, y: 30, size: 36, rot: 15, duration: 1700 },
  { emoji: "🎨", x: 90, y: 40, size: 40, rot: -25, duration: 2000 },
  { emoji: "📺", x: -30, y: -240, size: 36, rot: 5, duration: 2300 },
  { emoji: "🎬", x: 40, y: 130, size: 42, rot: -10, duration: 2200 }
];

interface FloatingEmojiProps {
  emoji: string;
  x: number;
  y: number;
  size: number;
  rot: number;
  duration: number;
}

// Composant individuel d'émoji flottant avec animations oscillantes fluides de haute fidélité
const FloatingEmojiItem: React.FC<FloatingEmojiProps> = ({ emoji, x, y, size, rot, duration }) => {
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Animation de rotation oscillante
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotationAnim, {
          toValue: 1,
          duration: duration,
          easing: Easing.inOut(Easing.sine),
          useNativeDriver: true,
        }),
        Animated.timing(rotationAnim, {
          toValue: 0,
          duration: duration,
          easing: Easing.inOut(Easing.sine),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 2. Animation d'oscillation verticale (Y)
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateAnim, {
          toValue: 1,
          duration: duration + 200,
          easing: Easing.inOut(Easing.sine),
          useNativeDriver: true,
        }),
        Animated.timing(translateAnim, {
          toValue: 0,
          duration: duration + 200,
          easing: Easing.inOut(Easing.sine),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 3. Animation de pulsation de scale (Taille)
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: duration - 150,
          easing: Easing.inOut(Easing.sine),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: duration - 150,
          easing: Easing.inOut(Easing.sine),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [duration]);

  // Interpolations fidèles aux plages Compose d'origine :
  // - Rotation : initialRotation +/- 12 degrés
  const rotateInterpolation = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [`${rot - 12}deg`, `${rot + 12}deg`],
  });

  // - Translation Y : +/- 12 points
  const translateYInterpolation = translateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-12, 12],
  });

  // - Échelle (Scale) : de 0.92 à 1.08
  const scaleInterpolation = scaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1.08],
  });

  return (
    <Animated.View
      style={[
        styles.floatingEmojiContainer,
        {
          left: '50%',
          top: '50%',
          marginLeft: x,
          marginTop: y,
          transform: [
            { translateY: translateYInterpolation },
            { rotate: rotateInterpolation },
            { scale: scaleInterpolation },
          ],
        },
      ]}
    >
      <Text style={{ fontSize: size }}>{emoji}</Text>
    </Animated.View>
  );
};

export interface MemeSplashScreenProps {
  onEnterExperience?: () => void;
  language?: 'FR' | 'EN';
}

export const MemeSplashScreen: React.FC<MemeSplashScreenProps> = ({
  onEnterExperience,
  language = 'FR',
}) => {
  // Animations du Logo principal 😜
  const logoScaleAnim = useRef(new Animated.Value(0)).current;
  const logoYAnim = useRef(new Animated.Value(0)).current;
  
  // Animation de pulsation du bouton d'action principal
  const buttonScaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Boucle de pulsation de taille du Logo principal (0.95 -> 1.05)
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoScaleAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sine),
          useNativeDriver: true,
        }),
        Animated.timing(logoScaleAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sine),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Boucle de flottaison en hauteur du Logo principal (-10 -> 10)
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoYAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sine),
          useNativeDriver: true,
        }),
        Animated.timing(logoYAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sine),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Boucle de pulsation d'échelle du bouton principal (1.0 -> 1.04)
    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonScaleAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.sine),
          useNativeDriver: true,
        }),
        Animated.timing(buttonScaleAnim, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.sine),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const logoScale = logoScaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.05],
  });

  const logoTranslateY = logoYAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 10],
  });

  const buttonScale = buttonScaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1.0, 1.04],
  });

  // Traductions d'origine fidèles
  const welcomeText = language === 'FR' 
    ? "Générez des mèmes hilarants à partir de vos conversations, de vos photos ou de votre propre voix grâce à la puissance créative de l'IA de pointe." 
    : "Generate hilarious memes from your chat conversations, uploaded photos, or custom voice recordings powered by state-of-the-art AI.";
    
  const buttonText = language === 'FR' ? "Lancer l'expérience" : "Start Experience";

  return (
    <View style={styles.root}>
      {/* 
        DÉGRADÉ DE FOND VISUELLEMENT PRÉ-RÉGLÉ SUR LE "PRE-DAWN WASH" 
        (De haut en bas : Bleu horizon doux -> Gris bleuté -> Teinte Terre chaude)
      */}
      <View style={styles.gradientLayerTop} />
      <View style={styles.gradientLayerMiddle} />
      <View style={styles.gradientLayerBottom} />
      
      {/* Halo lumineux indigo centré */}
      <View style={styles.radialSpotlight} />

      {/* Rendu des 24 émojis animés d'arrière-plan */}
      <View style={StyleSheet.absoluteFill}>
        {BACKGROUND_EMOJIS.map((emojiInfo, idx) => (
          <FloatingEmojiItem
            key={`floating-emoji-${idx}-${emojiInfo.emoji}`}
            emoji={emojiInfo.emoji}
            x={emojiInfo.x}
            y={emojiInfo.y}
            size={emojiInfo.size}
            rot={emojiInfo.rot}
            duration={emojiInfo.duration}
          />
        ))}
      </View>

      {/* Conteneur principal de premier plan */}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.foregroundContainer}>
          
          {/* Logo principal oscillant 😜 */}
          <Animated.View
            style={[
              styles.logoAnimationWrapper,
              {
                transform: [
                  { scale: logoScale },
                  { translateY: logoTranslateY }
                ]
              }
            ]}
          >
            {/* Halo externe d'effet verre de haute fidélité */}
            <View style={styles.logoOuterHalo}>
              <View style={styles.logoInnerCircle}>
                <Text style={styles.logoEmoji}>😜</Text>
              </View>
            </View>
          </Animated.View>

          {/* Carte de texte en verre dépoli (Glassmorphism) */}
          <View style={styles.glassCard}>
            <Text style={styles.mainTitle}>MemeGen AI</Text>
            <Text style={styles.welcomeDescription}>{welcomeText}</Text>
          </View>

          {/* Bouton d'action principal palpitant */}
          <Animated.View style={[styles.buttonWrapper, { transform: [{ scale: buttonScale }] }]}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.actionButton}
              onPress={onEnterExperience}
            >
              <Text style={styles.actionButtonText}>{buttonText}</Text>
              <Text style={styles.arrowIcon}>→</Text>
            </TouchableOpacity>
          </Animated.View>

        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1E2D54', // Arrière-plan de secours
    overflow: 'hidden',
  },
  // Simulations du dégradé Pre-dawn wash par superposition transparente
  gradientLayerTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#4867AF', // rgb(72,103,175)
  },
  gradientLayerMiddle: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#9CAFB8', // rgb(156,175,184)
    opacity: 0.5,
  },
  gradientLayerBottom: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#C49577', // rgb(196,149,119)
    opacity: 0.35,
  },
  radialSpotlight: {
    position: 'absolute',
    width: 600,
    height: 600,
    borderRadius: 300,
    backgroundColor: 'rgba(107, 98, 242, 0.45)', // Indigo Haze
    left: SCREEN_WIDTH / 2 - 300,
    top: SCREEN_HEIGHT / 2 - 300,
    opacity: 0.6,
  },
  safeArea: {
    flex: 1,
  },
  foregroundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  // Émoji flottant d'arrière-plan en pillule dépolie
  floatingEmojiContainer: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: 'rgba(29, 29, 29, 0.45)', // Translucent Char surface
    borderWidth: 1,
    borderColor: 'rgba(229, 229, 229, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  // Logo principal
  logoAnimationWrapper: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoOuterHalo: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(229, 229, 229, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInnerCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(29, 29, 29, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(229, 229, 229, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: {
    fontSize: 72,
  },
  // Carte de texte (Glassmorphism)
  glassCard: {
    width: '100%',
    backgroundColor: 'rgba(15, 15, 17, 0.88)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    padding: 20,
    alignItems: 'center',
    marginBottom: 32,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  mainTitle: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: -1.5,
    textAlign: 'center',
    marginBottom: 10,
  },
  welcomeDescription: {
    color: '#E5E5E5',
    fontSize: 14.5,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 4,
  },
  // Bouton d'action principal
  buttonWrapper: {
    width: '100%',
  },
  actionButton: {
    width: '100%',
    height: 52,
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  actionButtonText: {
    color: '#0A0A0A',
    fontSize: 16,
    fontWeight: '800',
  },
  arrowIcon: {
    color: '#0A0A0A',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 8,
  },
});

export default MemeSplashScreen;
