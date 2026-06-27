# MemeGen AI - React Native CLI Version

Ce dossier contient la réécriture complète et optimisée en **React Native CLI (TypeScript)** du projet Android d'origine. Toutes les fonctionnalités, interfaces modernes (Dark Mode, cartes glassmorphisme), animations et la logique intelligente de l'API Gemini y sont reproduites à l'identique pour assurer une continuité parfaite de votre développement !

## 🚀 Fonctionnalités Incluses

- **Analyseur de Contexte (Meme Studio)** : Saisie libre d'une situation de vie, analyse intelligente via Gemini 3.5 Flash et suggestions de mèmes (Haut/Bas).
- **Stickers IA de Situation** : Suggestions d'émojis et de phrases ultra-courtes en argot local.
- **Générateur de requêtes GIF** : Traduction intelligente des contextes en requêtes anglaises hautement précises et rigolotes pour Giphy.
- **Personnalisation des légendes en direct** : TextInputs interactifs pour ajuster et personnaliser les textes de mèmes suggérés directement sous la preview en temps réel.
- **Multi-langues instantané** : Support complet FR/EN.

---

## 🛠️ Instructions d'Installation et de Lancement

### 1. Prérequis
Assurez-vous que votre environnement de développement React Native CLI est configuré sur votre machine locale (Node.js, JDK, Android Studio SDK, et Xcode pour iOS).
Consultez la [documentation officielle de React Native](https://reactnative.dev/docs/environment-setup) si nécessaire.

### 2. Cloner ou Extraire ce projet
Extrayez le contenu de ce dossier `react_native_project` sur votre machine locale.

### 3. Installer les dépendances
Ouvrez votre terminal dans le dossier racine du projet React Native et exécutez :
```bash
npm install
# ou
yarn install
```

*(Si vous développez pour iOS, installez également les CocoaPods :)*
```bash
cd ios && pod install && cd ..
```

### 4. Configurer la Clé API Gemini
Pour que l'intelligence artificielle fonctionne :
1. Obtenez une clé API Gemini gratuite sur [Google AI Studio](https://aistudio.google.com/).
2. Dans l'application mobile, le composant utilise `AsyncStorage` pour stocker de façon sécurisée votre clé API localement. Vous pouvez configurer un écran de saisie rapide ou l'écrire directement par défaut dans le code de `GeminiClient.ts` pour vos tests de prototypes !

### 5. Lancer l'application
- **Pour Android** :
  ```bash
  npx react-native run-android
  ```
- **Pour iOS** :
  ```bash
  npx react-native run-ios
  ```
