import React, { useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import { aiBackgroundImages } from '../utils/templates';

interface Props {
  templateIndex: number;
  topText: string;
  bottomText: string;
  customBgUri?: string | null;
  size?: number;
  showBorder?: boolean;
}

const FALLBACK_BGS = aiBackgroundImages;
const GRADIENT_PAIRS: [string, string][] = [
  ['#1a1a2e', '#16213e'], ['#0f3460', '#533483'], ['#e94560', '#0a3d62'],
  ['#3d3d3d', '#2d3436'], ['#6c5ce7', '#00cec9'], ['#2d3436', '#636e72'],
  ['#6c5ce7', '#a29bfe'], ['#fd79a8', '#e84393'], ['#0984e3', '#6c5ce7'],
  ['#00b894', '#00cec9'],
];

export default function MemeCardPreview({
  templateIndex, topText, bottomText, customBgUri, size = 310, showBorder = true,
}: Props) {
  const [imgError, setImgError] = useState(false);
  const fallback = FALLBACK_BGS[templateIndex % FALLBACK_BGS.length];
  const bgUri = customBgUri || fallback;
  const gradientColors = GRADIENT_PAIRS[templateIndex % GRADIENT_PAIRS.length];

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        borderWidth: showBorder ? 2 : 0,
        borderColor: '#FFFFFF',
        overflow: 'hidden',
        justifyContent: 'space-between',
        alignSelf: 'center',
      }}
    >
      <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFill} />
      {!imgError && (
        <Image
          source={{ uri: bgUri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onError={() => setImgError(true)}
        />
      )}

      {topText ? (
        <Text
          style={{
            color: '#FFFFFF',
            fontWeight: '800',
            textAlign: 'center',
            fontSize: Math.max(24, Math.min(70, size * 0.08)),
            paddingTop: size * 0.04,
            paddingHorizontal: size * 0.04,
            textShadowColor: '#000000',
            textShadowOffset: { width: 2, height: 2 },
            textShadowRadius: 4,
            alignSelf: 'flex-start',
          }}
        >
          {topText.toUpperCase()}
        </Text>
      ) : null}

      {bottomText ? (
        <Text
          style={{
            color: '#FFFFFF',
            fontWeight: '800',
            textAlign: 'center',
            fontSize: Math.max(24, Math.min(70, size * 0.08)),
            paddingBottom: size * 0.04,
            paddingHorizontal: size * 0.04,
            textShadowColor: '#000000',
            textShadowOffset: { width: 2, height: 2 },
            textShadowRadius: 4,
            alignSelf: 'flex-end',
          }}
        >
          {bottomText.toUpperCase()}
        </Text>
      ) : null}
    </View>
  );
}
