export interface ThemeProperties {
  baseColor: string;
  washColors: string[];
  spotlightColor: string;
  accentColor: string;
  isDark: boolean;
}

export type ThemeName =
  | 'Dark Void'
  | 'Cosmic Slate'
  | 'Cyber Neon'
  | 'Rose Gold'
  | 'Solar Eclipse'
  | 'Pure Light';

const hexAlpha = (hex: string, alpha: number): string => {
  if (alpha >= 1) return hex;
  const a = Math.round(alpha * 255).toString(16).padStart(2, '0');
  return hex + a;
};

export const themes: Record<ThemeName, ThemeProperties> = {
  'Dark Void': {
    baseColor: '#0A0A0A',
    washColors: ['#4867AF', '#9CAFB8', '#C49577'],
    spotlightColor: '#6B62F2',
    accentColor: '#6B62F2',
    isDark: true,
  },
  'Cosmic Slate': {
    baseColor: '#0E1214',
    washColors: ['#1E293B', '#0F172A', '#10B981'],
    spotlightColor: '#10B981',
    accentColor: '#10B981',
    isDark: true,
  },
  'Cyber Neon': {
    baseColor: '#000000',
    washColors: ['#1E102F', '#0A1520', '#000000'],
    spotlightColor: '#00FFCC',
    accentColor: '#00FFCC',
    isDark: true,
  },
  'Rose Gold': {
    baseColor: '#120E11',
    washColors: ['#2E1B24', '#22151B', '#FDA4AF'],
    spotlightColor: '#FDA4AF',
    accentColor: '#FDA4AF',
    isDark: true,
  },
  'Solar Eclipse': {
    baseColor: '#140F08',
    washColors: ['#2A1905', '#1E1102', '#FBBF24'],
    spotlightColor: '#FBBF24',
    accentColor: '#FBBF24',
    isDark: true,
  },
  'Pure Light': {
    baseColor: '#F1F5F9',
    washColors: ['#E2E8F0', '#CBD5E1', '#3B82F6'],
    spotlightColor: '#3B82F6',
    accentColor: '#3B82F6',
    isDark: false,
  },
};

export const defaultTheme: ThemeProperties = themes['Dark Void'];

export const splashGradientColors = ['#4867AF', '#9CAFB8', '#C49577'];
export const splashSpotlightColor = '#6B62F2';

export const SURFACE_COLOR = '#1D1D1D';
export const SURFACE_RGB = '29,29,29';
export const BONE_TEXT = '#E5E5E5';
export const MIST_TEXT = '#C2C2C2';
export const IRON_ACTIVE = '#3D3D3D';
export const MID_GREY = '#797979';
export const MID_GREY_LABEL = '#686868';
export const VOID_BASE = '#0A0A0A';
export const INDIGO_HAZE = '#6B62F2';
export const GREEN_ONLINE = '#4ADE80';
export const GOLD_FILL = '#FFD700';

export function getDerivedColors(theme: ThemeProperties) {
  const isDark = theme.isDark;
  return {
    textColor: isDark ? '#FFFFFF' : '#0F172A',
    secondaryTextColor: isDark ? '#C2C2C2' : '#475569',
    cardBackground: hexAlpha(isDark ? '#1D1D1D' : '#FFFFFF', isDark ? 0.85 : 0.95),
    borderColor: hexAlpha(isDark ? '#FFFFFF' : '#000000', isDark ? 0.08 : 0.12),
  };
}
