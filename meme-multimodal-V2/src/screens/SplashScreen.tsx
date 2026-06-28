import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import { splashGradientColors, splashSpotlightColor, SURFACE_RGB, BONE_TEXT, VOID_BASE } from '../theme/colors';

const { width, height } = Dimensions.get('window');

const centerX = width / 2;
const centerY = height / 2;

const ringEmojis = [
  { emoji: '😂', angle: 0, dist: 130, s: 44 },
  { emoji: '😱', angle: 45, dist: 150, s: 40 },
  { emoji: '😡', angle: 90, dist: 125, s: 38 },
  { emoji: '🕺', angle: 135, dist: 155, s: 46 },
  { emoji: '💀', angle: 180, dist: 120, s: 42 },
  { emoji: '🔥', angle: 225, dist: 145, s: 40 },
  { emoji: '🤔', angle: 270, dist: 130, s: 36 },
  { emoji: '🤡', angle: 315, dist: 150, s: 42 },
  { emoji: '🚀', angle: 20, dist: 185, s: 46 },
  { emoji: '👾', angle: 290, dist: 185, s: 40 },
];

const interactiveEmojis = ['😜', '😂', '🤖', '🚀', '🎨', '💡', '🔥', '⭐', '🌈', '👾'];

export default function SplashScreen({ onEnter }: { onEnter: () => void }) {
  const [currentEmoji, setCurrentEmoji] = useState(interactiveEmojis[0]);
  const shared = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shared, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(shared, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ]),
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -12, duration: 1800, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 12, duration: 1800, useNativeDriver: true }),
      ]),
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(btnScale, { toValue: 1.04, duration: 1000, useNativeDriver: true }),
        Animated.timing(btnScale, { toValue: 1.0, duration: 1000, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  const handleEmojiPress = () => {
    const next = interactiveEmojis[(interactiveEmojis.indexOf(currentEmoji) + 1) % interactiveEmojis.length];
    setCurrentEmoji(next);
    scaleAnim.setValue(0.5);
    rotateAnim.setValue(0);
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 160, useNativeDriver: true }),
      Animated.timing(rotateAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  };

  const rotateInterp = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-15deg', '15deg'],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={splashGradientColors}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <View style={[StyleSheet.absoluteFill, { opacity: 0.25 }]}>
        <View style={{
          position: 'absolute', top: -100, left: -200, right: -200,
          height: 450, borderRadius: 500, backgroundColor: splashSpotlightColor, opacity: 0.5,
        }} />
      </View>

      {ringEmojis.map((item, i) => {
        const angleRad = (item.angle * Math.PI) / 180;
        const orbitX = Math.cos(angleRad) * item.dist;
        const orbitY = Math.sin(angleRad) * item.dist;
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: centerX + orbitX - item.s / 2,
              top: centerY - 80 + orbitY - item.s / 2,
              opacity: 0.2,
              transform: [
                {
                  translateY: shared.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, Math.sin(angleRad) * 6 + 4, 0],
                  }),
                },
              ],
            }}
          >
            <View style={{
              backgroundColor: `rgba(${SURFACE_RGB},0.3)`,
              borderRadius: 9999,
              paddingHorizontal: 8,
              paddingVertical: 6,
            }}>
              <Text style={{ fontSize: item.s }}>{item.emoji}</Text>
            </View>
          </Animated.View>
        );
      })}

      <TouchableOpacity activeOpacity={0.7} onPress={handleEmojiPress}>
        <Animated.View style={{
          width: 180, height: 180, justifyContent: 'center', alignItems: 'center',
          transform: [
            { scale: scaleAnim },
            { rotate: rotateInterp },
            { translateY: floatAnim },
          ],
        }}>
          <View style={styles.logoInner}>
            <View style={styles.logoGradientOuter} />
            <View style={styles.logoSurface} />
            <Text style={styles.logoEmoji}>{currentEmoji}</Text>
          </View>
        </Animated.View>
      </TouchableOpacity>

      <View style={styles.glassCard}>
        <Text style={styles.title}>MemeGen AI</Text>
        <Text style={styles.subtitle}>
          Crée des Memes, Stickers, GIFs de situation & courtes Videos Animees instantanement avec l'intelligence de Gemini 3.5 !
        </Text>
        <Text style={styles.hint}>Tape l'emoji pour changer</Text>
      </View>

      <Animated.View style={{ transform: [{ scale: btnScale }] }}>
        <TouchableOpacity style={styles.startBtn} onPress={onEnter} activeOpacity={0.8}>
          <Text style={styles.startBtnText}>DÉBUTER L'EXPÉRIENCE →</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logoInner: {
    width: 160, height: 160, borderRadius: 80,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  logoGradientOuter: {
    ...StyleSheet.absoluteFillObject, width: 150, height: 150,
    borderRadius: 75, top: 5, left: 5,
    backgroundColor: splashSpotlightColor, opacity: 0.2,
  },
  logoSurface: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: `rgba(${SURFACE_RGB},0.85)`,
    borderRadius: 80, borderWidth: 1,
    borderColor: `rgba(229,229,229,0.15)`,
  },
  logoEmoji: { fontSize: 72, zIndex: 2 },
  glassCard: {
    backgroundColor: `rgba(15,15,17,0.85)`,
    borderRadius: 24, borderWidth: 1,
    borderColor: `rgba(255,255,255,0.12)`,
    padding: 20, alignItems: 'center', marginTop: 8, gap: 10,
    width: width - 64,
  },
  title: {
    fontSize: 38, fontWeight: '800', color: '#FFFFFF',
    letterSpacing: -1.5, textAlign: 'center',
  },
  subtitle: {
    fontSize: 14, color: BONE_TEXT, textAlign: 'center', lineHeight: 22,
  },
  hint: {
    fontSize: 11, color: 'rgba(255,255,255,0.5)',
    textAlign: 'center', fontStyle: 'italic',
  },
  startBtn: {
    backgroundColor: '#FFFFFF', borderRadius: 9999,
    paddingHorizontal: 32, paddingVertical: 14, marginTop: 20,
    height: 48, justifyContent: 'center',
  },
  startBtnText: {
    color: VOID_BASE, fontWeight: '700', fontSize: 15, textAlign: 'center',
  },
});
