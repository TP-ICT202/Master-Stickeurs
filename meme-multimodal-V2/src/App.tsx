import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity, StatusBar,
} from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import { useStore } from './store/useStore';
import { themes, type ThemeProperties, splashGradientColors, splashSpotlightColor, getDerivedColors } from './theme/colors';
import { t } from './utils/i18n';
import SplashScreen from './screens/SplashScreen';
import WelcomeLoadingScreen from './screens/WelcomeLoadingScreen';
import ContextReaderScreen from './screens/ContextReaderScreen';
import VoiceToMemeScreen from './screens/VoiceToMemeScreen';
import StatusRemixerScreen from './screens/StatusRemixerScreen';
import MemeLibraryScreen from './screens/MemeLibraryScreen';
import SettingsScreen from './screens/SettingsScreen';

const DRAWER_WIDTH = 280;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const tabIcons: Record<string, { icon: string; labelKey: string }> = {
  TEXT: { icon: '📝', labelKey: 'tab_text' },
  AUDIO: { icon: '🎤', labelKey: 'tab_audio' },
  IMAGE: { icon: '📷', labelKey: 'tab_photo' },
  GALLERY: { icon: '🖼️', labelKey: 'tab_archive' },
  SETTINGS: { icon: '⚙️', labelKey: 'tab_settings' },
};

function DimensionBackground({ theme, children }: { theme: ThemeProperties; children: React.ReactNode }) {
  const derived = getDerivedColors(theme);
  const washOpacity = theme.isDark ? 0.25 : 0.6;
  return (
    <View style={[styles.bgContainer, { backgroundColor: theme.baseColor }]}>
      <LinearGradient
        colors={theme.washColors.map((c) => {
          const alpha = theme.washColors.indexOf(c) === 0 ? 0.25 : theme.washColors.indexOf(c) === 1 ? 0.15 : 0.1;
          return c + Math.round(alpha * 255).toString(16).padStart(2, '0');
        })}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <View style={[StyleSheet.absoluteFill, { opacity: 0.25 }]}>
        <View
          style={{
            position: 'absolute',
            top: -100,
            left: -100,
            right: -100,
            height: 450,
            borderRadius: 500,
            backgroundColor: theme.spotlightColor,
            opacity: 0.25,
          }}
        />
      </View>
      {children}
    </View>
  );
}

function MemeHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const { currentEdition, currentLanguage, currentTheme } = useStore();
  const theme = themes[currentTheme as keyof typeof themes] || themes['Dark Void'];
  const derived = getDerivedColors(theme);

  return (
    <View style={[styles.headerContainer, { borderBottomColor: derived.borderColor }]}>
      <View style={styles.headerMain}>
        <TouchableOpacity onPress={onMenuClick} style={styles.menuBtn}>
          <Text style={[styles.menuIcon, { color: derived.textColor }]}>☰</Text>
        </TouchableOpacity>
        <Text style={[styles.headerLight, { color: derived.textColor }]}>MemeGen </Text>
        <Text style={[styles.headerBold, { color: derived.textColor }]}>AI</Text>
        <View style={[styles.editionBadge, { backgroundColor: theme.accentColor + '25', borderColor: theme.accentColor + '50' }]}>
          <Text style={[styles.editionText, { color: theme.accentColor }]}>
            {currentEdition.toUpperCase()}
          </Text>
        </View>
      </View>
    </View>
  );
}

function MemeBottomNavigation({ selectedTab, onSelect }: { selectedTab: string; onSelect: (id: string) => void }) {
  const { currentLanguage, currentTheme } = useStore();
  const theme = themes[currentTheme as keyof typeof themes] || themes['Dark Void'];
  const tabs = ['TEXT', 'AUDIO', 'IMAGE', 'GALLERY', 'SETTINGS'];

  return (
    <View style={styles.bottomNavOuter}>
      <View style={[styles.bottomNavPill, { backgroundColor: 'rgba(29,29,29,0.85)', borderColor: 'rgba(255,255,255,0.08)' }]}>
        <View style={styles.bottomNavInner}>
          {tabs.map((id) => {
            const isSelected = selectedTab === id;
            return (
              <TouchableOpacity
                key={id}
                style={[
                  styles.bottomTab,
                  isSelected && { backgroundColor: '#3D3D3D' },
                ]}
                onPress={() => onSelect(id)}
              >
                <Text style={[styles.bottomTabIcon, { color: isSelected ? '#FFFFFF' : '#797979' }]}>
                  {tabIcons[id]?.icon || '📄'}
                </Text>
                <Text style={[
                  styles.bottomTabText,
                  { color: isSelected ? '#FFFFFF' : '#797979', fontWeight: isSelected ? '700' : '400' },
                ]}>
                  {t(tabIcons[id]?.labelKey || '', currentLanguage)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function App() {
  const {
    showSplash, dismissSplash, currentTab, setTab,
    currentLanguage, currentTheme, currentEdition,
  } = useStore();

  const theme = themes[currentTheme as keyof typeof themes] || themes['Dark Void'];
  const derived = getDerivedColors(theme);
  const [showLoading, setShowLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.parallel([
      Animated.timing(drawerAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(overlayAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(drawerAnim, { toValue: -DRAWER_WIDTH, duration: 250, useNativeDriver: true }),
      Animated.timing(overlayAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setDrawerOpen(false));
  };

  const handleTabSelect = (tab: string) => {
    setTab(tab as any);
    closeDrawer();
  };

  if (showSplash) {
    if (!showLoading) {
      return <SplashScreen onEnter={() => setShowLoading(true)} />;
    }
    return <WelcomeLoadingScreen onComplete={dismissSplash} />;
  }

  const renderScreen = () => {
    switch (currentTab) {
      case 'TEXT': return <ContextReaderScreen />;
      case 'AUDIO': return <VoiceToMemeScreen />;
      case 'IMAGE': return <StatusRemixerScreen />;
      case 'GALLERY': return <MemeLibraryScreen />;
      case 'SETTINGS': return <SettingsScreen />;
      default: return <ContextReaderScreen />;
    }
  };

  return (
    <DimensionBackground theme={theme}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.root}>
        <MemeHeader onMenuClick={openDrawer} />
        <View style={styles.contentArea}>
          <Animated.View key={currentTab} style={{ flex: 1 }}>
            {renderScreen()}
          </Animated.View>
        </View>
        <MemeBottomNavigation selectedTab={currentTab} onSelect={(id) => setTab(id as any)} />

        {drawerOpen && (
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={closeDrawer}
          >
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: 'rgba(0,0,0,0.5)', opacity: overlayAnim },
              ]}
            />
          </TouchableOpacity>
        )}

        <Animated.View
          style={[
            styles.drawer,
            {
              backgroundColor: derived.cardBackground,
              borderRightColor: derived.borderColor,
              transform: [{ translateX: drawerAnim }],
            },
          ]}
        >
          <View style={styles.drawerContent}>
            <View style={styles.drawerHeader}>
              <View style={[styles.drawerLogo, { backgroundColor: theme.accentColor + '25', borderColor: theme.accentColor + '50' }]}>
                <Text style={{ fontSize: 20 }}>💡</Text>
              </View>
              <View>
                <Text style={[styles.drawerTitle, { color: derived.textColor }]}>MemeGen AI</Text>
                <Text style={[styles.drawerEdition, { color: derived.secondaryTextColor }]}>
                  Edition {currentEdition}
                </Text>
              </View>
            </View>

            <View style={[styles.drawerDivider, { backgroundColor: derived.borderColor }]} />

            {['TEXT', 'AUDIO', 'IMAGE', 'GALLERY', 'SETTINGS'].map((id) => {
              const isSelected = currentTab === id;
              return (
                <TouchableOpacity
                  key={id}
                  style={[
                    styles.drawerItem,
                    isSelected && {
                      backgroundColor: theme.accentColor + '25',
                      borderColor: theme.accentColor + '50',
                      borderWidth: 0.5,
                    },
                  ]}
                  onPress={() => handleTabSelect(id)}
                >
                  <Text style={{ fontSize: 20, width: 28 }}>{tabIcons[id]?.icon || '📄'}</Text>
                  <Text
                    style={[
                      styles.drawerItemText,
                      {
                        color: isSelected ? theme.accentColor : derived.secondaryTextColor,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {t(tabIcons[id]?.labelKey || '', currentLanguage)}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <View style={styles.drawerFooter} />
          </View>
        </Animated.View>
      </View>
    </DimensionBackground>
  );
}

const styles = StyleSheet.create({
  bgContainer: { flex: 1 },
  root: { flex: 1 },
  contentArea: { flex: 1, overflow: 'hidden' },
  headerContainer: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 8,
  },
  headerSubtitle: { fontSize: 11, fontWeight: '500', letterSpacing: 1 },
  aiBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  aiDot: { width: 8, height: 8, borderRadius: 4 },
  aiText: { fontSize: 10 },
  headerMain: { flexDirection: 'row', alignItems: 'center', marginTop: 6, paddingLeft: 4 },
  menuBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  menuIcon: { fontSize: 24 },
  headerLight: { fontSize: 28, fontWeight: '300', letterSpacing: -0.5 },
  headerBold: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  editionBadge: {
    marginLeft: 8,
    borderRadius: 6,
    borderWidth: 0.5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  editionText: { fontSize: 8, fontWeight: '700' },
  bottomNavOuter: {
    paddingBottom: 16,
    paddingHorizontal: 8,
    paddingTop: 4,
  },
  bottomNavPill: {
    borderRadius: 9999,
    borderWidth: 1,
    height: 56,
    paddingHorizontal: 4,
  },
  bottomNavInner: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  bottomTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    paddingVertical: 6,
    gap: 2,
  },
  bottomTabIcon: { fontSize: 16 },
  bottomTabText: { fontSize: 11 },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    zIndex: 101,
    elevation: 101,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    borderRightWidth: 1,
    overflow: 'hidden',
  },
  drawerContent: { flex: 1, padding: 24 },
  drawerHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  drawerLogo: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1,
  },
  drawerTitle: { fontSize: 18, fontWeight: '700' },
  drawerEdition: { fontSize: 12 },
  drawerDivider: { height: 1, marginBottom: 16 },
  drawerItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 12, gap: 12, marginBottom: 4,
  },
  drawerItemText: { fontSize: 14 },
  drawerFooter: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  drawerFooterText: { fontSize: 11 },
});
