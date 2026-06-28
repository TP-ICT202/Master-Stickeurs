import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, TextInput, Alert } from 'react-native';
import { Globe, Award, Palette, Sliders, Settings as SettingsIcon, Check, Key } from 'lucide-react-native';
import { useStore } from '../store/useStore';
import { themes, type ThemeName, getDerivedColors } from '../theme/colors';
import { t } from '../utils/i18n';
import type { Language, Edition } from '../types';

const languages: Language[] = ['FR', 'EN', 'ES'];
const editions: { key: Edition; color: string; features: string[] }[] = [
  { key: 'Standard', color: '#94A3B8', features: ['Generation de base', 'Formats standards (PNG/JPG)', 'Filtres essentiels'] },
  { key: 'Pro', color: '#38BDF8', features: ['Generation illimitee', 'Export HD (1080p)', 'Tous les filtres', 'Animation GIF/Video'] },
  { key: 'Enterprise', color: '#FBBF24', features: ['Tout Pro', 'Partage collaboratif', 'Marque blanche', 'Export 4K', 'API access'] },
  { key: 'Developer', color: '#A855F7', features: ['Tout Enterprise', 'Console debug Gemini', 'Logs IA temps reel', 'Mode developeur', 'Tests automatises'] },
];

const allThemes: ThemeName[] = ['Dark Void', 'Cosmic Slate', 'Cyber Neon', 'Rose Gold', 'Solar Eclipse', 'Pure Light'];

const themeColorMap: Record<string, { base: string; accent: string }> = {
  'Dark Void': { base: '#0A0A0A', accent: '#6B62F2' },
  'Cosmic Slate': { base: '#0E1214', accent: '#10B981' },
  'Cyber Neon': { base: '#000000', accent: '#00FFCC' },
  'Rose Gold': { base: '#120E11', accent: '#FDA4AF' },
  'Solar Eclipse': { base: '#140F08', accent: '#FBBF24' },
  'Pure Light': { base: '#F1F5F9', accent: '#3B82F6' },
};

export default function SettingsScreen() {
  const store = useStore();
  const theme = themes[store.currentTheme as keyof typeof themes] || themes['Dark Void'];
  const derived = getDerivedColors(theme);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.headerCard, { backgroundColor: derived.cardBackground, borderColor: derived.borderColor }]}>
        <View style={[styles.headerIconContainer, { backgroundColor: theme.accentColor + '25', borderColor: theme.accentColor + '50' }]}>
          <SettingsIcon size={28} color={theme.accentColor} strokeWidth={1.5} />
        </View>
        <Text style={[styles.headerTitle, { color: derived.textColor }]}>
          {t('settings_global', store.currentLanguage)}
        </Text>
        <Text style={[styles.headerSub, { color: derived.secondaryTextColor }]}>
          {t('settings_subtitle', store.currentLanguage) || 'Personnalise ton expérience MemeGen AI'}
        </Text>
      </View>

      <View style={[styles.section, { backgroundColor: derived.cardBackground, borderColor: derived.borderColor }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Globe size={14} color={derived.textColor + '99'} />
          <Text style={[styles.sectionTitle, { color: derived.textColor + '99' }]}>
            {t('language_label', store.currentLanguage) || t('language', store.currentLanguage)}
          </Text>
        </View>
        <View style={[styles.pillContainer, { backgroundColor: theme.baseColor, borderColor: derived.borderColor }]}>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[
                styles.pillSegment,
                store.currentLanguage === lang && { backgroundColor: theme.accentColor },
              ]}
              onPress={() => store.setLanguage(lang)}
            >
              <Text style={[
                styles.pillText,
                { color: store.currentLanguage === lang ? '#fff' : derived.secondaryTextColor },
              ]}>
                {lang}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: derived.cardBackground, borderColor: derived.borderColor }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Award size={14} color={derived.textColor + '99'} />
          <Text style={[styles.sectionTitle, { color: derived.textColor + '99' }]}>
            {t('edition_label', store.currentLanguage) || t('edition', store.currentLanguage)}
          </Text>
        </View>
        {editions.map((ed) => {
          const isSelected = store.currentEdition === ed.key;
          return (
            <TouchableOpacity
              key={ed.key}
              style={[
                styles.editionRow,
                isSelected && { backgroundColor: theme.accentColor + '15', borderColor: theme.accentColor },
                !isSelected && { borderColor: 'transparent' },
              ]}
              onPress={() => store.setEdition(ed.key)}
            >
              <View style={[styles.radioDot, { borderColor: ed.color }, isSelected && { backgroundColor: ed.color }]} />
              <View style={styles.editionContent}>
                <View style={styles.editionHeader}>
                  <Text style={[styles.editionName, { color: derived.textColor }]}>{ed.key}</Text>
                  <View style={[styles.editionBadge, { backgroundColor: ed.color + '30' }]}>
                    <Text style={[styles.editionBadgeText, { color: ed.color }]}>
                      {isSelected ? t('active_badge', store.currentLanguage) || 'ACTIVE' : t('select_badge', store.currentLanguage) || 'SELECT'}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.editionDesc, { color: derived.secondaryTextColor }]}>
                  {ed.key === 'Standard' ? (t('edition_standard', store.currentLanguage) || 'Outils standards et mèmes')
                    : ed.key === 'Pro' ? (t('edition_pro', store.currentLanguage) || 'Génération illimitée, formats HD')
                    : ed.key === 'Enterprise' ? (t('edition_enterprise', store.currentLanguage) || 'Partages collaboratifs & exports')
                    : (t('edition_developer', store.currentLanguage) || 'Console debug & logs IA Gemini')}
                </Text>
                {isSelected && (
                  <View style={{ marginTop: 8, gap: 4 }}>
                    {ed.features.map((f, i) => (
                      <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: ed.color }} />
                        <Text style={{ color: derived.secondaryTextColor, fontSize: 11 }}>{f}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[styles.section, { backgroundColor: derived.cardBackground, borderColor: derived.borderColor }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Palette size={14} color={derived.textColor + '99'} />
          <Text style={[styles.sectionTitle, { color: derived.textColor + '99' }]}>
            {t('theme_label', store.currentLanguage) || t('theme', store.currentLanguage)}
          </Text>
        </View>
        {allThemes.map((tName) => {
          const isSelected = store.currentTheme === tName;
          const colors = themeColorMap[tName] || { base: '#0A0A0A', accent: '#6B62F2' };
          return (
            <TouchableOpacity
              key={tName}
              style={[
                styles.themeRow,
                isSelected && { borderColor: theme.accentColor, backgroundColor: theme.accentColor + '15' },
                !isSelected && { borderColor: 'transparent' },
              ]}
              onPress={() => store.setTheme(tName)}
            >
              <View style={[styles.themeDotPreview, { backgroundColor: colors.base, borderColor: colors.accent }]}>
                <View style={[styles.themeDotAccent, { backgroundColor: colors.accent }]} />
              </View>
              <Text style={[styles.themeName, { color: derived.textColor }]}>{tName}</Text>
              {isSelected && <Check size={16} color={theme.accentColor} strokeWidth={3} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[styles.section, { backgroundColor: derived.cardBackground, borderColor: derived.borderColor }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Key size={14} color={theme.accentColor} />
          <Text style={[styles.sectionTitle, { color: derived.textColor + '99' }]}>
            Clé API Gemini
          </Text>
        </View>
        <TextInput
          style={[styles.apiKeyInput, { color: '#E5E5E5', borderColor: derived.borderColor, backgroundColor: 'rgba(29,29,29,0.85)' }]}
          value={store.userApiKey}
          onChangeText={store.setUserApiKey}
          placeholder="AIzaSy... (ta cle Gemini)"
          placeholderTextColor="#686868"
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />
        {store.userApiKey.trim() && (
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                'Test API',
                'Test avec le store uniquement. Les appels reels utiliseront cette cle.',
              );
            }}
            style={{ alignSelf: 'flex-end' }}
          >
            <Text style={{ color: theme.accentColor, fontSize: 11, fontWeight: '700' }}>
              Tester la connexion
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.section, { backgroundColor: derived.cardBackground, borderColor: derived.borderColor }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Sliders size={14} color={derived.textColor + '99'} />
          <Text style={[styles.sectionTitle, { color: derived.textColor + '99' }]}>
            {t('preferences_label', store.currentLanguage) || t('other_prefs', store.currentLanguage)}
          </Text>
        </View>
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={[styles.toggleLabel, { color: derived.textColor }]}>
              {t('safe_search', store.currentLanguage)}
            </Text>
            <Text style={[styles.toggleDesc, { color: derived.secondaryTextColor }]}>
              {t('safe_search_desc', store.currentLanguage) || 'Filtre proactif des contenus offensants'}
            </Text>
          </View>
          <Switch
            value={store.isSafeSearchEnabled}
            onValueChange={store.setSafeSearch}
            trackColor={{ false: derived.borderColor, true: theme.accentColor }}
            thumbColor="#FFFFFF"
          />
        </View>
        <View style={styles.toggleDivider} />
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={[styles.toggleLabel, { color: derived.textColor }]}>
              {t('sound_fx', store.currentLanguage)}
            </Text>
            <Text style={[styles.toggleDesc, { color: derived.secondaryTextColor }]}>
              {t('sound_desc', store.currentLanguage) || 'Retour haptic et alertes audio'}
            </Text>
          </View>
          <Switch
            value={store.isSoundEnabled}
            onValueChange={store.setSoundEnabled}
            trackColor={{ false: derived.borderColor, true: theme.accentColor }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  apiKeyInput: {
    borderRadius: 10, borderWidth: 1, padding: 12, fontSize: 13,
    fontFamily: 'monospace',
  },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  headerCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  headerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSub: { fontSize: 12 },
  section: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  pillContainer: {
    flexDirection: 'row',
    borderRadius: 9999,
    borderWidth: 1,
    padding: 4,
  },
  pillSegment: {
    flex: 1,
    borderRadius: 9999,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: { fontSize: 12, fontWeight: '700' },
  editionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 12,
    gap: 12,
  },
  radioDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
  },
  editionContent: { flex: 1, gap: 2 },
  editionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  editionName: { fontSize: 14, fontWeight: '700' },
  editionBadge: { borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
  editionBadgeText: { fontSize: 8, fontWeight: '700' },
  editionDesc: { fontSize: 11 },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 12,
    gap: 12,
  },
  themeDotPreview: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeDotAccent: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  themeName: { flex: 1, fontSize: 14, fontWeight: '700' },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  toggleInfo: { flex: 1, gap: 2 },
  toggleLabel: { fontSize: 14, fontWeight: '600' },
  toggleDesc: { fontSize: 11 },
  toggleDivider: { height: 1, backgroundColor: 'rgba(229,229,229,0.08)', marginVertical: 4 },
});
