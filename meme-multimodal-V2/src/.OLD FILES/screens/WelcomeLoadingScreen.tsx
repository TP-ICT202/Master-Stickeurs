import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { defaultTheme, GOLD_FILL, SURFACE_RGB, BONE_TEXT, MIST_TEXT } from '../theme/colors';

const CIRCLE_SIZE = 160;

export default function WelcomeLoadingScreen({ onComplete }: { onComplete: () => void }) {
  const theme = defaultTheme;
  const progress = useRef(new Animated.Value(0)).current;
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start(() => {
      onComplete();
    });

    const id = progress.addListener(({ value }) => {
      setPercent(Math.round(value * 100));
    });

    return () => {
      progress.removeListener(id);
    };
  }, []);

  const fillHeight = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, CIRCLE_SIZE],
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.baseColor }]}>
      <View style={StyleSheet.absoluteFill}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.baseColor }]} />
        <View style={[StyleSheet.absoluteFill, { opacity: 0.15 }]}>
          <View
            style={{
              position: 'absolute',
              top: -100,
              left: -100,
              right: -100,
              height: 400,
              borderRadius: 500,
              backgroundColor: theme.spotlightColor,
              opacity: 0.25,
            }}
          />
        </View>
      </View>

      <Text style={styles.welcome}>BIENVENUE</Text>
      <Text style={styles.title}>MemeGen AI</Text>

      <View style={styles.circleOuter}>
        <View style={styles.circleBorder}>
          <View style={styles.circleInner}>
            <Animated.View
              style={[
                styles.circleFill,
                { height: fillHeight },
              ]}
            />
          </View>
          <View style={styles.faceContainer}>
            <View style={styles.eyes}>
              <View style={styles.eye} />
              <View style={styles.eye} />
            </View>
            <View style={styles.smile} />
          </View>
        </View>
      </View>

      <Text style={styles.percent}>{percent}%</Text>
      <Text style={styles.preparing}>Preparation de ton studio creatif...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  welcome: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 4,
    marginBottom: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: BONE_TEXT,
    letterSpacing: -1.5,
    marginBottom: 32,
  },
  circleOuter: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleBorder: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: `rgba(${SURFACE_RGB},1)`,
    borderWidth: 1,
    borderColor: `rgba(229,229,229,0.1)`,
  },
  circleInner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: CIRCLE_SIZE,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderRadius: CIRCLE_SIZE / 2,
  },
  circleFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: GOLD_FILL,
    borderTopLeftRadius: CIRCLE_SIZE,
    borderTopRightRadius: CIRCLE_SIZE,
  },
  faceContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  eyes: {
    flexDirection: 'row',
    gap: 18,
    marginBottom: 8,
  },
  eye: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#000',
  },
  smile: {
    width: 30,
    height: 12,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    borderBottomWidth: 3,
    borderColor: '#000',
  },
  percent: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'monospace',
    color: BONE_TEXT,
    marginTop: 16,
    marginBottom: 12,
  },
  preparing: {
    fontSize: 14,
    fontWeight: '500',
    color: MIST_TEXT,
    textAlign: 'center',
  },
});
