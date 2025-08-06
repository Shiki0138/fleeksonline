import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  voiceEnabled: boolean;
  gesturesEnabled: boolean;
  arEnabled: boolean;
  beautyPresets: string[];
  favoriteProducts: string[];
  skinTone: string;
  faceShape: string;
}

interface AIState {
  // User preferences learned by AI
  preferences: UserPreferences;
  
  // AI models loading state
  modelsLoaded: {
    handpose: boolean;
    facemesh: boolean;
    speechCommands: boolean;
  };
  
  // Real-time AI features
  gestureDetected: string | null;
  voiceCommand: string | null;
  faceDetected: boolean;
  beautyScore: number;
  
  // AR/3D state
  arMode: boolean;
  selectedFilter: string | null;
  
  // Actions
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  setModelLoaded: (model: keyof AIState['modelsLoaded'], loaded: boolean) => void;
  setGesture: (gesture: string | null) => void;
  setVoiceCommand: (command: string | null) => void;
  setFaceDetected: (detected: boolean) => void;
  setBeautyScore: (score: number) => void;
  toggleARMode: () => void;
  setSelectedFilter: (filter: string | null) => void;
  
  // AI learning
  learnUserBehavior: (action: string, data: any) => void;
  predictUserIntent: () => string | null;
}

export const useAIStore = create<AIState>()(
  persist(
    (set, get) => ({
      preferences: {
        theme: 'auto',
        language: 'en',
        voiceEnabled: true,
        gesturesEnabled: true,
        arEnabled: true,
        beautyPresets: [],
        favoriteProducts: [],
        skinTone: '',
        faceShape: '',
      },
      
      modelsLoaded: {
        handpose: false,
        facemesh: false,
        speechCommands: false,
      },
      
      gestureDetected: null,
      voiceCommand: null,
      faceDetected: false,
      beautyScore: 0,
      arMode: false,
      selectedFilter: null,
      
      updatePreferences: (prefs) =>
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        })),
      
      setModelLoaded: (model, loaded) =>
        set((state) => ({
          modelsLoaded: { ...state.modelsLoaded, [model]: loaded },
        })),
      
      setGesture: (gesture) => set({ gestureDetected: gesture }),
      
      setVoiceCommand: (command) => set({ voiceCommand: command }),
      
      setFaceDetected: (detected) => set({ faceDetected: detected }),
      
      setBeautyScore: (score) => set({ beautyScore: score }),
      
      toggleARMode: () => set((state) => ({ arMode: !state.arMode })),
      
      setSelectedFilter: (filter) => set({ selectedFilter: filter }),
      
      learnUserBehavior: (action, data) => {
        // AI learning logic - store patterns in IndexedDB
        const patterns = localStorage.getItem('userPatterns') || '[]';
        const parsedPatterns = JSON.parse(patterns);
        parsedPatterns.push({ action, data, timestamp: Date.now() });
        
        // Keep only last 100 patterns
        if (parsedPatterns.length > 100) {
          parsedPatterns.shift();
        }
        
        localStorage.setItem('userPatterns', JSON.stringify(parsedPatterns));
      },
      
      predictUserIntent: () => {
        // Simple AI prediction based on patterns
        const patterns = localStorage.getItem('userPatterns') || '[]';
        const parsedPatterns = JSON.parse(patterns);
        
        if (parsedPatterns.length < 10) return null;
        
        // Analyze recent actions to predict intent
        const recentActions = parsedPatterns.slice(-10);
        const actionCounts = recentActions.reduce((acc: any, curr: any) => {
          acc[curr.action] = (acc[curr.action] || 0) + 1;
          return acc;
        }, {});
        
        // Return most frequent action as prediction
        const mostFrequent = Object.entries(actionCounts)
          .sort(([, a]: any, [, b]: any) => b - a)[0];
        
        return mostFrequent ? mostFrequent[0] : null;
      },
    }),
    {
      name: 'fleeks-ai-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);