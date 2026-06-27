import { create } from 'zustand';
import type { Language, Edition, MemeEntity, StatusSubMode, GifMood, VideoEffect, FilterType, StickerStyle, VideoConfig, DrawingPoint } from '../types';

export interface MemeState {
  showSplash: boolean;
  currentTab: 'TEXT' | 'AUDIO' | 'IMAGE' | 'GALLERY' | 'SETTINGS';
  currentLanguage: Language;
  currentEdition: Edition;
  currentTheme: string;
  isSafeSearchEnabled: boolean;
  isSoundEnabled: boolean;
  savedMemes: MemeEntity[];

  contextInput: string;
  textTopSuggestion: string;
  textBottomSuggestion: string;
  isLoadingTextMeme: boolean;
  selectedPresetBgIndex: number;
  aiBgBitmap: string | null;
  imagePrompt: string;
  isGeneratingImage: boolean;

  isRecording: boolean;
  recordedAudioPath: string | null;
  audioTranscript: string;
  audioMemeTop: string;
  audioMemeBottom: string;
  isLoadingAudioMeme: boolean;

  statusImagePath: string | null;
  statusTopText: string;
  statusBottomText: string;
  isAnalyzingStatusImage: boolean;
  statusSubMode: StatusSubMode;
  showImageEditor: boolean;

  brightness: number;
  contrast: number;
  currentFilter: FilterType;
  drawingPoints: DrawingPoint[];
  drawingColor: string;
  isDrawingMode: boolean;

  stickerEmoji: string;
  stickerText: string;
  isGeneratingSticker: boolean;
  stickerShape: 'Circle' | 'Rounded' | 'Star';
  stickerAnimationSpeed: number;
  stickerTextPosition: 'bottom' | 'top' | 'left' | 'right';

  gifQuery: string;
  selectedGifMood: GifMood;
  isSearchingGif: boolean;
  gifPlaybackSpeed: number;

  videoTitle: string;
  videoPunchline: string;
  videoZoomSpeed: number;
  isGeneratingVideo: boolean;
  videoEffect: VideoEffect;
  videoIsPlaying: boolean;

  readyToUseEmojis: string[];

  dismissSplash: () => void;
  setTab: (tab: 'TEXT' | 'AUDIO' | 'IMAGE' | 'GALLERY' | 'SETTINGS') => void;
  setLanguage: (lang: Language) => void;
  setEdition: (edition: Edition) => void;
  setTheme: (theme: string) => void;
  setSafeSearch: (v: boolean) => void;
  setSoundEnabled: (v: boolean) => void;
  setSavedMemes: (memes: MemeEntity[]) => void;
  addSavedMeme: (meme: MemeEntity) => void;
  removeSavedMeme: (id: number) => void;

  setContextInput: (v: string) => void;
  setTextTopSuggestion: (v: string) => void;
  setTextBottomSuggestion: (v: string) => void;
  setIsLoadingTextMeme: (v: boolean) => void;
  setSelectedPresetBgIndex: (v: number) => void;
  setAiBgBitmap: (v: string | null) => void;
  setImagePrompt: (v: string) => void;
  setIsGeneratingImage: (v: boolean) => void;

  setIsRecording: (v: boolean) => void;
  setRecordedAudioPath: (v: string | null) => void;
  setAudioTranscript: (v: string) => void;
  setAudioMemeTop: (v: string) => void;
  setAudioMemeBottom: (v: string) => void;
  setIsLoadingAudioMeme: (v: boolean) => void;

  setStatusImagePath: (v: string | null) => void;
  setStatusTopText: (v: string) => void;
  setStatusBottomText: (v: string) => void;
  setIsAnalyzingStatusImage: (v: boolean) => void;
  setStatusSubMode: (v: StatusSubMode) => void;
  setShowImageEditor: (v: boolean) => void;

  setBrightness: (v: number) => void;
  setContrast: (v: number) => void;
  setCurrentFilter: (v: FilterType) => void;
  setDrawingPoints: (v: DrawingPoint[]) => void;
  setDrawingColor: (v: string) => void;
  setIsDrawingMode: (v: boolean) => void;

  setStickerEmoji: (v: string) => void;
  setStickerText: (v: string) => void;
  setIsGeneratingSticker: (v: boolean) => void;
  setStickerShape: (v: 'Circle' | 'Rounded' | 'Star') => void;
  setStickerAnimationSpeed: (v: number) => void;
  setStickerTextPosition: (v: 'bottom' | 'top' | 'left' | 'right') => void;

  setGifQuery: (v: string) => void;
  setSelectedGifMood: (v: GifMood) => void;
  setIsSearchingGif: (v: boolean) => void;
  setGifPlaybackSpeed: (v: number) => void;

  setVideoTitle: (v: string) => void;
  setVideoPunchline: (v: string) => void;
  setVideoZoomSpeed: (v: number) => void;
  setIsGeneratingVideo: (v: boolean) => void;
  setVideoEffect: (v: VideoEffect) => void;
  setVideoIsPlaying: (v: boolean) => void;

  setReadyToUseEmojis: (v: string[]) => void;
  addReadyToUseEmoji: (emoji: string) => void;
  editReadyToUseEmoji: (old: string, next: string) => void;
  deleteReadyToUseEmoji: (emoji: string) => void;
  clearStickerOutput: () => void;
  clearGifOutput: () => void;
  clearVideoOutput: () => void;
}

export const useStore = create<MemeState>((set) => ({
  showSplash: true,
  currentTab: 'TEXT',
  currentLanguage: 'FR',
  currentEdition: 'Standard',
  currentTheme: 'Dark Void',
  isSafeSearchEnabled: true,
  isSoundEnabled: false,
  savedMemes: [],

  contextInput: '',
  textTopSuggestion: '',
  textBottomSuggestion: '',
  isLoadingTextMeme: false,
  selectedPresetBgIndex: 0,
  aiBgBitmap: null,
  imagePrompt: '',
  isGeneratingImage: false,

  isRecording: false,
  recordedAudioPath: null,
  audioTranscript: '',
  audioMemeTop: '',
  audioMemeBottom: '',
  isLoadingAudioMeme: false,

  statusImagePath: null,
  statusTopText: '',
  statusBottomText: '',
  isAnalyzingStatusImage: false,
  statusSubMode: 'PHOTO_REMIXER',
  showImageEditor: false,

  brightness: 1.0,
  contrast: 1.0,
  currentFilter: 'Original',
  drawingPoints: [],
  drawingColor: '#FF0000',
  isDrawingMode: false,

  stickerEmoji: '😂',
  stickerText: '',
  isGeneratingSticker: false,
  stickerShape: 'Rounded',
  stickerAnimationSpeed: 1.0,
  stickerTextPosition: 'bottom',

  gifQuery: '',
  selectedGifMood: 'LOL',
  isSearchingGif: false,
  gifPlaybackSpeed: 1.0,

  videoTitle: '',
  videoPunchline: '',
  videoZoomSpeed: 1,
  isGeneratingVideo: false,
  videoEffect: 'Neon Pulse',
  videoIsPlaying: true,

  readyToUseEmojis: ['😂', '😱', '😡', '🕺', '💀', '🔥', '🤔', '🤡', '🤖', '🚀', '👀', '🎉', '🤯', '👽', '👾', '💩', '🎯', '🌟'],

  dismissSplash: () => set({ showSplash: false }),
  setTab: (tab) => set({ currentTab: tab }),
  setLanguage: (lang) => set({ currentLanguage: lang }),
  setEdition: (edition) => set({ currentEdition: edition }),
  setTheme: (theme) => set({ currentTheme: theme }),
  setSafeSearch: (v) => set({ isSafeSearchEnabled: v }),
  setSoundEnabled: (v) => set({ isSoundEnabled: v }),
  setSavedMemes: (memes) => set({ savedMemes: memes }),
  addSavedMeme: (meme) => set((s) => ({ savedMemes: [meme, ...s.savedMemes] })),
  removeSavedMeme: (id) => set((s) => ({ savedMemes: s.savedMemes.filter((m) => m.id !== id) })),

  setContextInput: (v) => set({ contextInput: v }),
  setTextTopSuggestion: (v) => set({ textTopSuggestion: v }),
  setTextBottomSuggestion: (v) => set({ textBottomSuggestion: v }),
  setIsLoadingTextMeme: (v) => set({ isLoadingTextMeme: v }),
  setSelectedPresetBgIndex: (v) => set({ selectedPresetBgIndex: v, aiBgBitmap: null }),
  setAiBgBitmap: (v) => set({ aiBgBitmap: v }),
  setImagePrompt: (v) => set({ imagePrompt: v }),
  setIsGeneratingImage: (v) => set({ isGeneratingImage: v }),

  setIsRecording: (v) => set({ isRecording: v }),
  setRecordedAudioPath: (v) => set({ recordedAudioPath: v }),
  setAudioTranscript: (v) => set({ audioTranscript: v }),
  setAudioMemeTop: (v) => set({ audioMemeTop: v }),
  setAudioMemeBottom: (v) => set({ audioMemeBottom: v }),
  setIsLoadingAudioMeme: (v) => set({ isLoadingAudioMeme: v }),

  setStatusImagePath: (v) => set({ statusImagePath: v }),
  setStatusTopText: (v) => set({ statusTopText: v }),
  setStatusBottomText: (v) => set({ statusBottomText: v }),
  setIsAnalyzingStatusImage: (v) => set({ isAnalyzingStatusImage: v }),
  setStatusSubMode: (v) => set({ statusSubMode: v }),
  setShowImageEditor: (v) => set({ showImageEditor: v }),

  setBrightness: (v) => set({ brightness: v }),
  setContrast: (v) => set({ contrast: v }),
  setCurrentFilter: (v) => set({ currentFilter: v }),
  setDrawingPoints: (v) => set({ drawingPoints: v }),
  setDrawingColor: (v) => set({ drawingColor: v }),
  setIsDrawingMode: (v) => set({ isDrawingMode: v }),

  setStickerEmoji: (v) => set({ stickerEmoji: v }),
  setStickerText: (v) => set({ stickerText: v }),
  setIsGeneratingSticker: (v) => set({ isGeneratingSticker: v }),
  setStickerShape: (v) => set({ stickerShape: v }),
  setStickerAnimationSpeed: (v) => set({ stickerAnimationSpeed: v }),
  setStickerTextPosition: (v) => set({ stickerTextPosition: v }),

  setGifQuery: (v) => set({ gifQuery: v }),
  setSelectedGifMood: (v) => set({ selectedGifMood: v }),
  setIsSearchingGif: (v) => set({ isSearchingGif: v }),
  setGifPlaybackSpeed: (v) => set({ gifPlaybackSpeed: v }),

  setVideoTitle: (v) => set({ videoTitle: v }),
  setVideoPunchline: (v) => set({ videoPunchline: v }),
  setVideoZoomSpeed: (v) => set({ videoZoomSpeed: v }),
  setIsGeneratingVideo: (v) => set({ isGeneratingVideo: v }),
  setVideoEffect: (v) => set({ videoEffect: v }),
  setVideoIsPlaying: (v) => set({ videoIsPlaying: v }),

  setReadyToUseEmojis: (v) => set({ readyToUseEmojis: v }),
  addReadyToUseEmoji: (emoji) => set((s) => {
    const trimmed = emoji.trim();
    if (!trimmed || s.readyToUseEmojis.includes(trimmed)) return s;
    return { readyToUseEmojis: [...s.readyToUseEmojis, trimmed] };
  }),
  editReadyToUseEmoji: (old, next) => set((s) => {
    const trimmed = next.trim();
    if (!trimmed) return s;
    return { readyToUseEmojis: s.readyToUseEmojis.map((e) => (e === old ? trimmed : e)) };
  }),
  deleteReadyToUseEmoji: (emoji) => set((s) => ({
    readyToUseEmojis: s.readyToUseEmojis.filter((e) => e !== emoji),
  })),
  clearStickerOutput: () => set({ stickerEmoji: '❓', stickerText: '' }),
  clearGifOutput: () => set({ gifQuery: '', selectedGifMood: 'LOL' }),
  clearVideoOutput: () => set({ videoTitle: '', videoPunchline: '' }),
}));
