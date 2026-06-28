declare module 'react-native-config' {
  interface RNConfig {
    GEMINI_API_KEY?: string;
    GIPHY_API_KEY?: string;
    EDEN_API_KEY?: string;
    POLINATION_AI_API_KEY?: string;
    PICSART_API_KEY?: string;
    KILPY_API_KEY?: string;
    API_LEAGUE_KEY?: string;
    IMAGE_GPT_API_KEY?: string;
    OPEN_ROUTE_API_KEY?: string;
    PEXELS_API_KEY?: string;
  }
  const Config: RNConfig;
  export default Config;
}
