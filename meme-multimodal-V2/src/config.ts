let _env: Record<string, string> = {};
try {
  const Config = require('react-native-config').default;
  _env = Config || {};
} catch {}

const env = (key: string): string => _env[key] || '';

/** API keys — loaded from .env via react-native-config, falls back to build-time values. */

const rawGeminiKey = env('GEMINI_API_KEY');
const rawDefaultKey = env('DEFAULT_GEMINI_API_KEY');
function isValidGeminiKey(k: string) { return k && (k.startsWith('AIzaSy') || k.startsWith('AQ.')); }
export const GEMINI_API_KEY = isValidGeminiKey(rawGeminiKey) ? rawGeminiKey : (isValidGeminiKey(rawDefaultKey) ? rawDefaultKey : '');
export const DEFAULT_GEMINI_API_KEY = isValidGeminiKey(rawDefaultKey) ? rawDefaultKey : (isValidGeminiKey(rawGeminiKey) ? rawGeminiKey : '');

export const IMAGE_GPT_API_KEY = env('IMAGE_GPT_API_KEY') || '';
/** @deprecated use IMAGE_GPT_API_KEY */
export const MAGE_GPT_API_KEY = IMAGE_GPT_API_KEY;

export const GIPHY_API_KEY = env('GIPHY_API_KEY') || '';

export const KILPY_API_KEY = env('KILPY_API_KEY') || '';

export const EDEN_API_KEY = env('EDEN_API_KEY') || '';
export const POLINATION_AI_API_KEY = env('POLINATION_AI_API_KEY') || '';
export const PICSART_API_KEY = env('PICSART_API_KEY') || '';

export const PEXELS_API_KEY = env('PEXELS_API_KEY') || '';

export const OPEN_ROUTE_API_KEY = env('OPEN_ROUTE_API_KEY') || '';
export const GROK_API_KEY = env('GROK_API_KEY') || '';
export const API_LEAGUE_KEY = env('API_LEAGUE_KEY') || '';
export const PIXAZO_API_KEY = env('PIXAZO_API_KEY') || '';
