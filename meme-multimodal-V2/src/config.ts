let _env: Record<string, string> = {};
try {
  const Config = require('react-native-config').default;
  _env = Config || {};
} catch {}

const env = (key: string): string => _env[key] || '';

/** API keys — loaded from .env via react-native-config, falls back to build-time values. */

export const GEMINI_API_KEY = env('GEMINI_API_KEY') || 'AIzaSyD8YbDQ6WvX0qYBkyrjT3P4S7iDqZOz-uY';

export const IMAGE_GPT_API_KEY = env('IMAGE_GPT_API_KEY') || 'imagegpt-nlWj2HDNZzOFRjKUq5rZptL18or1';
/** @deprecated use IMAGE_GPT_API_KEY */
export const MAGE_GPT_API_KEY = IMAGE_GPT_API_KEY;

export const GIPHY_API_KEY = env('GIPHY_API_KEY') || 'dc6zaTOxFJmzC';

export const KILPY_API_KEY = env('KILPY_API_KEY') || '';

export const EDEN_API_KEY = env('EDEN_API_KEY') || '';
export const POLINATION_AI_API_KEY = env('POLINATION_AI_API_KEY') || '';
export const PICSART_API_KEY = env('PICSART_API_KEY') || '';

export const PEXELS_API_KEY = env('PEXELS_API_KEY') || '';
