import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { COLORS } from '../theme/designSystem';

export default function HomeScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🚀 MULTI-MEME</Text>
      <Text style={styles.subtitle}>Générez des memes par Texte, Voix ou Image en 1 clic.</Text>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.navigate('Remixer')}
      >
        <Text style={styles.buttonText}>LANCER LE STUDIO DE REMIX 🎨</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center', padding: 20 },
  logo: { fontSize: 36, fontWeight: '900', color: COLORS.primary, letterSpacing: 2, marginBottom: 10 },
  subtitle: { fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 40, lineHeight: 24 },
  button: { backgroundColor: COLORS.primary, paddingHorizontal: 30, paddingVertical: 18, borderRadius: 30, elevation: 5 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
});
