import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Dimensions, StyleSheet } from 'react-native';

const { width, height } = Dimensions.get('window');

const emojis = [
  { emoji: '😂' }, { emoji: '😱' }, { emoji: '😡' }, { emoji: '🕺' },
  { emoji: '💀' }, { emoji: '🔥' }, { emoji: '🤔' }, { emoji: '🤡' },
  { emoji: '🚀' }, { emoji: '🎨' }, { emoji: '✨' }, { emoji: '👾' },
];

const MARGIN = 50;
const positions = emojis.map((_, i) => ({
  left: MARGIN + ((i * 173 + 61) % (width - MARGIN * 2)),
  top: MARGIN + ((i * 131 + 89) % (height - MARGIN * 2)),
  size: 28 + ((i * 5) % 14),
}));

export default function FloatingEmojiBackground() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 5000, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 5000, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      {emojis.map((item, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: positions[i].left,
            top: positions[i].top,
            opacity: 0.18,
            transform: [
              {
                translateY: anim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, i % 2 === 0 ? -12 : 12, 0],
                }),
              },
            ],
          }}
        >
          <View style={[styles.bubble, { width: positions[i].size + 12, height: positions[i].size + 12 }]}>
            <Text style={{ fontSize: positions[i].size }}>{item.emoji}</Text>
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute', width: '100%', height: '100%',
    overflow: 'hidden',
  },
  bubble: {
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
