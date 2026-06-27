import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEMES, TRANSLATIONS, ThemeProperties } from './ThemeAndLang';
import { GeminiClient } from '../api/GeminiClient';

interface SettingsProps {
  currentLang: 'FR' | 'EN';
  onChangeLang: (lang: 'FR' | 'EN') => void;
  currentThemeName: string;
  onChangeTheme: (theme: string) => void;
  currentEdition: string;
  onChangeEdition: (edition: string) => void;
  theme: ThemeProperties;
}

export default function Settings({
  currentLang,
  onChangeLang,
  currentThemeName,
  onChangeTheme,
  currentEdition,
  onChangeEdition,
  theme,
}: SettingsProps) {
  const [geminiKey, setGeminiKey] = useState('');
  const [edenKey, setEdenKey] = useState('');
  const [safeSearch, setSafeSearch] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [autoplay, setAutoplay] = useState(true);
  const [isTesting, setIsTesting] = useState(false);

  const translate = (key: string) => {
    return TRANSLATIONS[currentLang][key] || key;
  };

  useEffect(() => {
    // Load stored keys on mount
    const loadKeys = async () => {
      try {
        const storedGemini = await AsyncStorage.getItem('GEMINI_API_KEY');
        const storedEden = await AsyncStorage.getItem('EDEN_API_KEY');
        if (storedGemini) setGeminiKey(storedGemini);
        if (storedEden) setEdenKey(storedEden);
        
        const storedSafe = await AsyncStorage.getItem('SAFE_SEARCH');
        if (storedSafe !== null) setSafeSearch(storedSafe === 'true');
        
        const storedSound = await AsyncStorage.getItem('SOUND_FX');
        if (storedSound !== null) setSoundEffects(storedSound === 'true');

        const storedAutoplay = await AsyncStorage.getItem('AUTOPLAY');
        if (storedAutoplay !== null) setAutoplay(storedAutoplay === 'true');
      } catch (e) {
        console.error('Error loading settings keys', e);
      }
    };
    loadKeys();
  }, []);

  const handleSaveKeys = async () => {
    try {
      await AsyncStorage.setItem('GEMINI_API_KEY', geminiKey.trim());
      await AsyncStorage.setItem('EDEN_API_KEY', edenKey.trim());
      Alert.alert(currentLang === 'FR' ? 'Succès' : 'Success', currentLang === 'FR' ? 'Clés API sauvegardées !' : 'API Keys saved successfully!');
    } catch {
      Alert.alert('Error', 'Failed to save keys');
    }
  };

  const handleToggleSafe = async (val: boolean) => {
    setSafeSearch(val);
    await AsyncStorage.setItem('SAFE_SEARCH', String(val));
  };

  const handleToggleSound = async (val: boolean) => {
    setSoundEffects(val);
    await AsyncStorage.setItem('SOUND_FX', String(val));
  };

  const handleToggleAutoplay = async (val: boolean) => {
    setAutoplay(val);
    await AsyncStorage.setItem('AUTOPLAY', String(val));
  };

  const testConnection = async () => {
    if (!geminiKey.trim()) {
      Alert.alert(
        currentLang === 'FR' ? 'Clé manquante' : 'Missing Key',
        currentLang === 'FR' ? 'Veuillez renseigner votre clé Gemini avant de tester.' : 'Please enter your Gemini API key before testing.'
      );
      return;
    }

    setIsTesting(true);
    try {
      // Temporarily set keys in memory for test
      await AsyncStorage.setItem('GEMINI_API_KEY', geminiKey.trim());
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${geminiKey.trim()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Ping' }] }]
          })
        }
      );

      if (response.ok) {
        Alert.alert(
          currentLang === 'FR' ? 'Connexion Réussie !' : 'Connection Successful!',
          currentLang === 'FR' ? 'Gemini 3.5 Flash répond parfaitement à l\'appel.' : 'Gemini 3.5 Flash is responding perfectly.'
        );
      } else {
        const errJson = await response.json().catch(() => ({}));
        Alert.alert(
          currentLang === 'FR' ? 'Échec Connexion' : 'Connection Failed',
          `HTTP ${response.status}: ${errJson?.error?.message || 'Inconnu'}`
        );
      }
    } catch (e) {
      Alert.alert(
        currentLang === 'FR' ? 'Erreur de Réseau' : 'Network Error',
        String(e)
      );
    } finally {
      setIsTesting(false);
    }
  };

  const editions = ['Standard', 'Pro', 'Enterprise', 'Developer'];

  return (
    <ScrollView contentContainerStyle={[styles.scrollContent, { backgroundColor: theme.baseColor }]}>
      {/* Title */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.titleText, { color: theme.textColor }]}>
          ⚙️ {translate('settings_title')}
        </Text>
        <Text style={[styles.subtitleText, { color: theme.secondaryTextColor }]}>
          {translate('settings_subtitle')}
        </Text>
      </View>

      {/* Languages Card */}
      <View style={[styles.card, { backgroundColor: theme.isDark ? '#1C1C1E' : '#FFFFFF', borderColor: theme.borderColor }]}>
        <Text style={[styles.cardTitle, { color: theme.textColor }]}>🌐 {translate('lang_label')}</Text>
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, currentLang === 'FR' && { backgroundColor: theme.accentColor }]}
            onPress={() => onChangeLang('FR')}
          >
            <Text style={[styles.btnText, currentLang === 'FR' && styles.activeBtnText]}>Français</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, currentLang === 'EN' && { backgroundColor: theme.accentColor }]}
            onPress={() => onChangeLang('EN')}
          >
            <Text style={[styles.btnText, currentLang === 'EN' && styles.activeBtnText]}>English</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Theme Card */}
      <View style={[styles.card, { backgroundColor: theme.isDark ? '#1C1C1E' : '#FFFFFF', borderColor: theme.borderColor }]}>
        <Text style={[styles.cardTitle, { color: theme.textColor }]}>🎨 {translate('theme_label')}</Text>
        <View style={styles.themesContainer}>
          {Object.keys(THEMES).map((themeName) => {
            const isSelected = currentThemeName === themeName;
            const themeItem = THEMES[themeName];
            return (
              <TouchableOpacity
                key={themeName}
                style={[
                  styles.themeChip,
                  { backgroundColor: themeItem.baseColor, borderColor: isSelected ? theme.accentColor : themeItem.borderColor },
                  isSelected && styles.selectedThemeChip
                ]}
                onPress={() => onChangeTheme(themeName)}
              >
                <View style={[styles.themeColorIndicator, { backgroundColor: themeItem.accentColor }]} />
                <Text style={[styles.themeChipText, { color: themeItem.textColor }]}>{themeName}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* App Edition Card */}
      <View style={[styles.card, { backgroundColor: theme.isDark ? '#1C1C1E' : '#FFFFFF', borderColor: theme.borderColor }]}>
        <View style={styles.editionHeaderRow}>
          <Text style={[styles.cardTitle, { color: theme.textColor, marginBottom: 0 }]}>👑 {translate('edition_label')}</Text>
          <View style={[styles.badge, { backgroundColor: theme.accentColor + '20', borderColor: theme.accentColor }]}>
            <Text style={[styles.badgeText, { color: theme.accentColor }]}>{translate('active_badge')}</Text>
          </View>
        </View>
        
        <View style={styles.themesContainer}>
          {editions.map((ed) => {
            const isSelected = currentEdition === ed;
            return (
              <TouchableOpacity
                key={ed}
                style={[
                  styles.editionChip,
                  isSelected && { backgroundColor: theme.accentColor + '15', borderColor: theme.accentColor }
                ]}
                onPress={() => onChangeEdition(ed)}
              >
                <Text style={[styles.editionChipText, { color: isSelected ? theme.accentColor : theme.textColor }]}>
                  {ed}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={[styles.editionDesc, { color: theme.secondaryTextColor }]}>
          {currentEdition === 'Pro' ? translate('desc_pro') :
           currentEdition === 'Enterprise' ? translate('desc_enterprise') :
           currentEdition === 'Developer' ? translate('desc_developer') :
           translate('desc_standard')}
        </Text>
      </View>

      {/* API Credentials Card */}
      <View style={[styles.card, { backgroundColor: theme.isDark ? '#1C1C1E' : '#FFFFFF', borderColor: theme.borderColor }]}>
        <Text style={[styles.cardTitle, { color: theme.textColor }]}>🔑 Clés API de Production</Text>
        
        <Text style={[styles.inputLabel, { color: theme.secondaryTextColor }]}>Google Gemini API Key :</Text>
        <TextInput
          style={[styles.input, { color: theme.textColor, borderColor: theme.borderColor, backgroundColor: theme.isDark ? '#000000' : '#F1F5F9' }]}
          value={geminiKey}
          onChangeText={setGeminiKey}
          placeholder="AIzaSy..."
          placeholderTextColor="#666"
          secureTextEntry
        />

        <Text style={[styles.inputLabel, { color: theme.secondaryTextColor, marginTop: 12 }]}>Eden AI API Key (Optionnel Fallback) :</Text>
        <TextInput
          style={[styles.input, { color: theme.textColor, borderColor: theme.borderColor, backgroundColor: theme.isDark ? '#000000' : '#F1F5F9' }]}
          value={edenKey}
          onChangeText={setEdenKey}
          placeholder="Bearer Token..."
          placeholderTextColor="#666"
          secureTextEntry
        />

        <View style={styles.actionButtonsRow}>
          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.accentColor }]} onPress={handleSaveKeys}>
            <Text style={styles.saveBtnText}>{currentLang === 'FR' ? 'SAUVEGARDER' : 'SAVE KEYS'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.testBtn, { borderColor: theme.accentColor }]} onPress={testConnection} disabled={isTesting}>
            {isTesting ? <ActivityIndicator size="small" color={theme.accentColor} /> : <Text style={[styles.testBtnText, { color: theme.accentColor }]}>{currentLang === 'FR' ? 'TESTER IA' : 'TEST AI'}</Text>}
          </TouchableOpacity>
        </View>
      </View>

      {/* Other Preferences Card */}
      <View style={[styles.card, { backgroundColor: theme.isDark ? '#1C1C1E' : '#FFFFFF', borderColor: theme.borderColor, marginBottom: 50 }]}>
        <Text style={[styles.cardTitle, { color: theme.textColor }]}>⚙️ {translate('others_label')}</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingName, { color: theme.textColor }]}>{translate('safe_search')}</Text>
            <Text style={[styles.settingDescText, { color: theme.secondaryTextColor }]}>{translate('desc_safe_search')}</Text>
          </View>
          <Switch
            value={safeSearch}
            onValueChange={handleToggleSafe}
            trackColor={{ false: '#3a3a3c', true: theme.accentColor + '80' }}
            thumbColor={safeSearch ? theme.accentColor : '#f4f3f4'}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingName, { color: theme.textColor }]}>{translate('sound_fx')}</Text>
            <Text style={[styles.settingDescText, { color: theme.secondaryTextColor }]}>{translate('desc_sound_fx')}</Text>
          </View>
          <Switch
            value={soundEffects}
            onValueChange={handleToggleSound}
            trackColor={{ false: '#3a3a3c', true: theme.accentColor + '80' }}
            thumbColor={soundEffects ? theme.accentColor : '#f4f3f4'}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingName, { color: theme.textColor }]}>{translate('autoplay')}</Text>
            <Text style={[styles.settingDescText, { color: theme.secondaryTextColor }]}>Relancer automatiquement l'animation du storyboard</Text>
          </View>
          <Switch
            value={autoplay}
            onValueChange={handleToggleAutoplay}
            trackColor={{ false: '#3a3a3c', true: theme.accentColor + '80' }}
            thumbColor={autoplay ? theme.accentColor : '#f4f3f4'}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
  },
  sectionHeader: {
    marginBottom: 20,
    marginTop: 10,
  },
  titleText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  subtitleText: {
    fontSize: 13,
    marginTop: 4,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 14,
  },
  btnRow: {
    flexDirection: 'row',
  },
  toggleBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(128,128,128,0.08)',
    marginHorizontal: 4,
  },
  btnText: {
    color: '#8A8A8F',
    fontWeight: 'bold',
    fontSize: 13,
  },
  activeBtnText: {
    color: '#000000',
  },
  themesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  themeChip: {
    width: '46%',
    height: 48,
    borderRadius: 12,
    marginHorizontal: '2%',
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  selectedThemeChip: {
    borderWidth: 2,
  },
  themeColorIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 8,
  },
  themeChipText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  editionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  badge: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  editionChip: {
    width: '46%',
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: '2%',
    marginBottom: 8,
    backgroundColor: 'rgba(128,128,128,0.04)',
  },
  editionChipText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  editionDesc: {
    fontSize: 11,
    marginTop: 8,
    fontStyle: 'italic',
  },
  inputLabel: {
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    marginTop: 16,
  },
  saveBtn: {
    flex: 1.3,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  saveBtnText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 12,
  },
  testBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  testBtnText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  settingInfo: {
    flex: 1,
    paddingRight: 10,
  },
  settingName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  settingDescText: {
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(128,128,128,0.1)',
    marginVertical: 4,
  }
});
