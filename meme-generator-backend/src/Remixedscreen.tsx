import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import ViewShot from 'react-native-view-shot';
import { COLORS, FONTS } from '../theme/designSystem';

export default function RemixerScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [memeText, setMemeText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const viewShotRef = useRef<any>(null);

  // 1. Sélectionner une image dans la galerie
  const pickImage = () => {
    ImagePicker.openPicker({
      width: 400,
      height: 400,
      cropping: true,
    }).then(image => {
      setImageUri(image.path);
      setMemeText(null); // Reset le texte précédent
    }).catch(err => console.log("Sélection annulée", err));
  };

  // 2. Envoyer l'image au Backend (Binôme 1) pour recevoir le texte de l'IA
  const generateMemeText = async () => {
    if (!imageUri) return;
    setLoading(true);

    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'remix.jpg',
    } as any);

    try {
      const response = await fetch('http://IP_DU_BACKEND:3000/remix-image', {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = await response.json();
      
      // On s'attend à ce que le backend renvoie { text: "Le texte drôle ici" }
      setMemeText(data.text || "QUAND TU CODES EN CLI SANS EXPO !");
    } catch (error) {
      Alert.alert("Erreur", "Connexion au serveur backend impossible.");
      // Mode secours / Simulation pour J1/J2
      setMemeText("QUAND LE BACKEND NE RÉPOND PAS MAIS QUE TU DOIS AVANCER");
    } finally {
      setLoading(false);
    }
  };

  // 3. Capturer le conteneur fusionné (Image + Texte superposé)
  const saveMeme = async () => {
    if (!viewShotRef.current) return;
    
    try {
      const uri = await viewShotRef.current.capture();
      Alert.alert("Meme Sauvegardé !", `Le meme fusionné est disponible ici : ${uri}`);
      // Ici vous pourrez passer l'URI au module de partage ou à la galerie locale
    } catch (error) {
      console.error("Erreur de capture", error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Zone de prévisualisation et fusion */}
      <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }}>
        <View style={styles.previewContainer}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} />
          ) : (
            <View style={styles.placeholder}>
              <Text style={{ color: COLORS.textSecondary }}>Aucune image sélectionnée</Text>
            </View>
          )}

          {/* Superposition du texte de l'IA style "Meme" */}
          {memeText && (
            <View style={styles.textOverlayContainer}>
              <Text style={styles.memeText}>{memeText.toUpperCase()}</Text>
            </View>
          )}
        </View>
      </ViewShot>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.secondaryButton} onPress={pickImage}>
          <Text style={styles.buttonText}>📷 Choisir une Image</Text>
        </TouchableOpacity>

        {imageUri && !memeText && (
          <TouchableOpacity style={styles.primaryButton} onPress={generateMemeText} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>🤖 Analyser & Clasher</Text>}
          </TouchableOpacity>
        )}

        {memeText && (
          <TouchableOpacity style={styles.saveButton} onPress={saveMeme}>
            <Text style={styles.buttonText}>💾 Sauvegarder le Meme</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 20, alignItems: 'center' },
  previewContainer: { width: 340, height: 340, backgroundColor: COLORS.surface, borderRadius: 15, overflow: 'hidden', position: 'relative', elevation: 4 },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  textOverlayContainer: { position: 'absolute', bottom: 15, left: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 5 },
  memeText: { color: '#FFFFFF', fontSize: 20, fontFamily: FONTS.memeFont, textAlign: 'center', textShadowColor: '#000', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 1, fontWeight: '900' },
  actionsContainer: { width: '100%', marginTop: 30, gap: 12 },
  primaryButton: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 12, alignItems: 'center' },
  secondaryButton: { backgroundColor: COLORS.surface, padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  saveButton: { backgroundColor: COLORS.secondary, padding: 15, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
