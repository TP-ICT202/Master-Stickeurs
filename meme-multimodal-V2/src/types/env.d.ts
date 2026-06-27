declare module 'react-native-config' {
  interface RNConfig {
    GEMINI_API_KEY?: string;
    GIPHY_API_KEY?: string;
    EDEN_API_KEY?: string;
    POLINATION_AI_API_KEY?: string;
    PICSART_API_KEY?: string;
  }
  const Config: RNConfig;
  export default Config;
}
