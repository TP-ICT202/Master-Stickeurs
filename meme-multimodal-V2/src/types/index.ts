export interface MemeEntity {
  id: number;
  type: 'TEXT' | 'AUDIO' | 'IMAGE' | 'STICKER' | 'GIF' | 'VIDEO';
  contextText: string;
  topText: string;
  bottomText: string;
  audioPath?: string | null;
  imagePath?: string | null;
  bgImageUri?: string | null;
  timestamp: number;
}

export interface AudioMemeResult {
  transcription: string;
  topText: string;
  bottomText: string;
  emotion: string;
}

export interface FloatingEmoji {
  emoji: string;
  xOffset: number;
  yOffset: number;
  size: number;
  initialRotation: number;
  rotationSpeed: number;
  scaleMultiplier: number;
}

export interface ThemeProperties {
  baseColor: string;
  washColors: string[];
  spotlightColor: string;
  accentColor: string;
  isDark: boolean;
}

export type Language = 'FR' | 'EN' | 'ES';
export type Edition = 'Standard' | 'Pro' | 'Enterprise' | 'Developer';

export type StatusSubMode = 'PHOTO_REMIXER' | 'STICKER' | 'GIF' | 'VIDEO';

export type GifMood = 'LOL' | 'PANIQUE' | 'COLERE' | 'DANSE';

export type VideoEffect = 'Cyber Glow' | 'Retro Wave' | 'VHS Grain' | 'Neon Pulse' | 'Vaporwave';

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface StickerStyle {
  shape: 'Circle' | 'Rounded' | 'Star';
  animationSpeed: number;
  emoji: string;
  text: string;
}

export interface GifConfig {
  mood: GifMood;
  playbackSpeed: number;
  query: string;
}

export interface VideoConfig {
  effect: VideoEffect;
  isPlaying: boolean;
  title: string;
  punchline: string;
}

export interface FilterConfig {
  brightness: number;
  contrast: number;
  filter: FilterType;
  drawingPoints: DrawingPoint[];
  drawingColor: string;
  isDrawingMode: boolean;
}

export type FilterType = 'Original' | 'Grayscale' | 'Sepia' | 'Invert' | 'Teal Glow' | 'Amber Glow' | 'Neon Violet';

export const FILTERS: FilterType[] = [
  'Original', 'Grayscale', 'Sepia', 'Invert', 'Teal Glow', 'Amber Glow', 'Neon Violet',
];
