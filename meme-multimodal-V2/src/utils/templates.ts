export interface BackgroundPreset {
  name: string;
  startColor: string;
  endColor: string;
  pattern: number;
}

export const backgroundPresets: BackgroundPreset[] = [
  { name: 'Vaporwave Sunset', startColor: '#FF007F', endColor: '#00F0FF', pattern: 1 },
  { name: 'Toxic Matrix', startColor: '#0D0D00', endColor: '#00FF66', pattern: 2 },
  { name: 'Cosmic Magenta', startColor: '#4A0E4E', endColor: '#E43F5A', pattern: 0 },
  { name: 'Midnight Gold', startColor: '#1B1A17', endColor: '#F0A500', pattern: 3 },
  { name: 'Neon Cyberpunk', startColor: '#1C0A35', endColor: '#05DFD7', pattern: 2 },
  { name: 'Cameroun Green-Red', startColor: '#007A5E', endColor: '#CE1126', pattern: 0 },
  { name: 'Ocean Breeze', startColor: '#082F49', endColor: '#0EA5E9', pattern: 1 },
  { name: 'Emerald Jungle', startColor: '#064E3B', endColor: '#10B981', pattern: 2 },
  { name: 'Crimson Red', startColor: '#450A0A', endColor: '#EF4444', pattern: 3 },
  { name: 'Sunset Orange', startColor: '#7C2D12', endColor: '#F97316', pattern: 0 },
];

// AI-generated background image URLs for meme backgrounds
// These are context-adaptive abstract images used when no custom AI bg is set
export const aiBackgroundImages: string[] = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=512&q=80',
  'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=512&q=80',
  'https://images.unsplash.com/photo-1557683316-973673baf926?w=512&q=80',
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=512&q=80',
  'https://images.unsplash.com/photo-1558591710-4bcf4fda3245?w=512&q=80',
  'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=512&q=80',
  'https://images.unsplash.com/photo-1557682260-96773eb01377?w=512&q=80',
  'https://images.unsplash.com/photo-1557682224-5b8590cd9ec5?w=512&q=80',
  'https://images.unsplash.com/photo-1557682257-83f3e75f4d4a?w=512&q=80',
  'https://images.unsplash.com/photo-1557682240-d0c1e3e06b7c?w=512&q=80',
];
