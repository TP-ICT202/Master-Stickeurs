import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import { splashGradientColors, splashSpotlightColor, SURFACE_RGB, BONE_TEXT, VOID_BASE } from '../theme/colors';

const { width, height } = Dimensions.get('window');

const floatingEmojis = [
  { emoji: '😂', ox: -130, oy: -280, s: 56, rs: 1800 },
  { emoji: '😱', ox: 130, oy: -260, s: 64, rs: 2200 },
  { emoji: '😡', ox: -140, oy: -160, s: 48, rs: 2000 },
  { emoji: '🕺', ox: 140, oy: -140, s: 68, rs: 2500 },
  { emoji: '💀', ox: -150, oy: 100, s: 60, rs: 1900 },
  { emoji: '🔥', ox: 150, oy: 110, s: 56, rs: 1700 },
  { emoji: '🤔', ox: -120, oy: 250, s: 52, rs: 2400 },
  { emoji: '🤡', ox: 120, oy: 240, s: 60, rs: 2100 },
  { emoji: '🤖', ox: -140, oy: -50, s: 50, rs: 2300 },
  { emoji: '🚀', ox: 140, oy: -20, s: 64, rs: 1600 },
  { emoji: '👀', ox: -70, oy: -320, s: 48, rs: 2000 },
  { emoji: '🎉', ox: 70, oy: -310, s: 52, rs: 2100 },
  { emoji: '🤦', ox: -80, oy: 310, s: 56, rs: 2300 },
  { emoji: '🤫', ox: 80, oy: 310, s: 50, rs: 2200 },
  { emoji: '🤯', ox: -50, oy: 190, s: 64, rs: 1800 },
  { emoji: '👾', ox: 50, oy: -200, s: 52, rs: 1900 },
  { emoji: '💩', ox: -150, oy: 180, s: 50, rs: 2000 },
  { emoji: '🍕', ox: 150, oy: 180, s: 52, rs: 2400 },
  { emoji: '😜', ox: -60, oy: -110, s: 48, rs: 2200 },
  { emoji: '😎', ox: 60, oy: -90, s: 52, rs: 2100 },
  { emoji: '✨', ox: -90, oy: 30, s: 44, rs: 1700 },
  { emoji: '🎨', ox: 90, oy: 40, s: 48, rs: 2000 },
  { emoji: '📺', ox: -30, oy: -240, s: 44, rs: 2300 },
  { emoji: '🎬', ox: 40, oy: 130, s: 50, rs: 2200 },
];

function FloatingEmojiItem({ item }: { item: typeof floatingEmojis[0] }) {
  const rot = useRef(new Animated.Value(0)).current;
  const transY = useRef(new Animated.Value(0)).current;
  const sc = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const rd = item.rs;
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(rot, { toValue: 1, duration: rd, useNativeDriver: true }),
          Animated.timing(rot, { toValue: 0, duration: rd, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(transY, { toValue: -12, duration: rd + 200, useNativeDriver: true }),
          Animated.timing(transY, { toValue: 12, duration: rd + 200, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(sc, { toValue: 0.92, duration: rd - 150, useNativeDriver: true }),
          Animated.timing(sc, { toValue: 1.08, duration: rd - 150, useNativeDriver: true }),
        ]),
      ]),
    ).start();
  }, []);

  const rotateInterp = rot.interpolate({
    inputRange: [0, 1],
    outputRange: ['-12deg', '12deg'],
  });

  const cx = width / 2 + item.ox;
  const cy = height / 2 + item.oy;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: cx,
        top: cy,
        transform: [{ translateY: transY }, { rotate: rotateInterp }, { scale: sc }],
      }}
    >
      <View style={{
        backgroundColor: `rgba(${SURFACE_RGB},0.35)`,
        borderRadius: 9999,
        paddingHorizontal: 8,
        paddingVertical: 6,
      }}>
        <Text style={{ fontSize: item.s }}>{item.emoji}</Text>
      </View>
    </Animated.View>
  );
}

export default function SplashScreen({ onEnter }: { onEnter: () => void }) {
  const logoScale = useRef(new Animated.Value(0.95)).current;
  const logoFloat = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoScale, { toValue: 1.05, duration: 2000, useNativeDriver: true }),
        Animated.timing(logoScale, { toValue: 0.95, duration: 2000, useNativeDriver: true }),
      ]),
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoFloat, { toValue: -10, duration: 1500, useNativeDriver: true }),
        Animated.timing(logoFloat, { toValue: 10, duration: 1500, useNativeDriver: true }),
      ]),
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(btnScale, { toValue: 1.04, duration: 1000, useNativeDriver: true }),
        Animated.timing(btnScale, { toValue: 1.0, duration: 1000, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={splashGradientColors}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <View style={[StyleSheet.absoluteFill, { opacity: 0.25 }]}>
        <View
          style={{
            position: 'absolute',
            top: -100,
            left: -200,
            right: -200,
            height: 450,
            borderRadius: 500,
            backgroundColor: splashSpotlightColor,
            opacity: 0.5,
          }}
        />
      </View>

      {floatingEmojis.map((item, i) => (
        <FloatingEmojiItem key={i} item={item} />
      ))}

      <Animated.View
        style={{
          width: 200,
          height: 200,
          justifyContent: 'center',
          alignItems: 'center',
          transform: [{ scale: logoScale }, { translateY: logoFloat }],
        }}
      >
        <View style={styles.logoInner}>
          <View style={styles.logoGradientOuter} />
          <View style={styles.logoSurface} />
          <Text style={styles.logoEmoji}>😜</Text>
        </View>
      </Animated.View>

      <View style={styles.glassCard}>
        <Text style={styles.title}>MemeGen AI</Text>
        <Text style={styles.subtitle}>
          Crée des Memes, Stickers, GIFs de situation & courtes Videos Animees instantanement avec l'intelligence de Gemini 3.5 !
        </Text>
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
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoGradientOuter: {
    ...StyleSheet.absoluteFillObject,
    width: 150,
    height: 150,
    borderRadius: 75,
    top: 5,
    left: 5,
    backgroundColor: splashSpotlightColor,
    opacity: 0.2,
  },
  logoSurface: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: `rgba(${SURFACE_RGB},0.85)`,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: `rgba(229,229,229,0.15)`,
  },
  logoEmoji: { fontSize: 72, zIndex: 2 },
  glassCard: {
    backgroundColor: `rgba(15,15,17,0.85)`,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: `rgba(255,255,255,0.12)`,
    padding: 20,
    alignItems: 'center',
    marginTop: 8,
    gap: 10,
    width: width - 64,
  },
  title: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: BONE_TEXT,
    textAlign: 'center',
    lineHeight: 22,
  },
  startBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 9999,
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginTop: 20,
    height: 48,
    justifyContent: 'center',
  },
  startBtnText: {
    color: VOID_BASE,
    fontWeight: '700',
    fontSize: 15,
    textAlign: 'center',
  },
});
