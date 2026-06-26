import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Text } from 'react-native';
import { COLORS } from '../theme/designSystem';

// Import des écrans (à remplacer par les vrais fichiers des binômes)
import HomeScreen from '../screens/HomeScreen';
import RemixerScreen from '../screens/RemixerScreen';
const ContextReaderMock = () => <Text style={{color: '#fff'}}>Écran Binôme 2</Text>;
const VoiceToMemeMock = () => <Text style={{color: '#fff'}}>Écran Binôme 3</Text>;

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.background, borderBottomWidth: 0 },
          headerTitleStyle: { color: COLORS.textPrimary, fontWeight: 'bold' },
          tabBarStyle: { backgroundColor: COLORS.surface, borderTopWidth: 0, height: 60, paddingBottom: 8 },
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textSecondary,
        }}
      >
        <Tab.Screen name="Accueil" component={HomeScreen} options={{ tabBarLabel: '🏠 Home' }} />
        <Tab.Screen name="Context" component={ContextReaderMock} options={{ tabBarLabel: '📝 Texte' }} />
        <Tab.Screen name="Voice" component={VoiceToMemeMock} options={{ tabBarLabel: '🎙️ Voice' }} />
        <Tab.Screen name="Remixer" component={RemixerScreen} options={{ tabBarLabel: '🎨 Remix' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
