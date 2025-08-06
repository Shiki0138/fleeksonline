# Fleeks AI-Powered Frontend

An immersive, AI-enhanced beauty platform with cutting-edge web technologies.

## 🚀 Features

### 🎮 3D Video Gallery
- **Three.js & React Three Fiber** powered 3D environment
- Interactive video cards with hover effects
- WebGL shaders for stunning visuals
- Gesture-controlled navigation

### 🤚 AI Gesture Control
- **TensorFlow.js HandPose** model for real-time hand tracking
- Supports multiple gestures:
  - Pinch - Select items
  - Swipe - Navigate gallery
  - Open Palm - Pause/Play
  - Peace Sign - Toggle filters
  - Thumbs Up - Like content

### 🎤 Voice Commands
- Web Speech API integration
- Natural language processing
- Supported commands:
  - "Show products" - Browse catalog
  - "Next/Previous page" - Navigation
  - "Open camera" - Launch AR mode
  - "Search beauty" - Voice search
  - Custom command training

### 📸 AR Beauty Simulation
- **MediaPipe Face Mesh** for accurate face tracking
- Real-time makeup try-on
- Multiple beauty filters:
  - Natural Glow
  - Glamour Night
  - Fresh Morning
  - Bold Lips
- Beauty score calculation
- Photo capture functionality

### 🧠 Adaptive UI
- AI learns user preferences
- Personalized recommendations
- Usage pattern analysis
- Dynamic content prioritization
- Predictive actions based on behavior

### 📱 PWA Capabilities
- Fully offline functionality
- Background sync
- Push notifications
- App-like experience
- IndexedDB for data persistence

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **3D Graphics**: Three.js, React Three Fiber, Drei
- **AI/ML**: TensorFlow.js, MediaPipe
- **State Management**: Zustand with persistence
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **UI Components**: Radix UI
- **PWA**: Workbox, Service Workers
- **Database**: IndexedDB (idb wrapper)

## 📦 Installation

```bash
cd frontend
npm install
```

## 🏃‍♂️ Running the App

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

## 🎨 Project Structure

```
frontend/
├── src/
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   │   ├── VideoGallery3D.tsx
│   │   ├── GestureControl.tsx
│   │   ├── VoiceCommand.tsx
│   │   ├── ARBeautySimulation.tsx
│   │   └── AdaptiveUI.tsx
│   ├── store/           # Zustand stores
│   ├── lib/             # Utilities & helpers
│   └── styles/          # Global styles
├── public/
│   ├── manifest.json    # PWA manifest
│   ├── sw.js           # Service worker
│   └── offline.html    # Offline fallback
└── package.json
```

## 🤖 AI Features Configuration

### Gesture Control
The gesture control system can be customized in `GestureControl.tsx`:
- Adjust detection sensitivity
- Add custom gestures
- Modify visual feedback

### Voice Commands
Extend voice commands in `VoiceCommand.tsx`:
- Add new command phrases
- Customize language settings
- Adjust confidence thresholds

### AR Filters
Create new beauty filters in `ARBeautySimulation.tsx`:
- Define color overlays
- Adjust smoothing effects
- Add new facial features

## 📱 PWA Features

### Offline Capabilities
- Cached AI models for offline use
- Local data storage with IndexedDB
- Background sync when reconnected
- Offline page with available features

### Installation
Users can install the app:
1. Visit the site in a supported browser
2. Click the install prompt
3. App icon appears on home screen

## 🔐 Privacy & Security

- All AI processing happens locally
- No data sent to external servers
- Camera/microphone permissions required
- User data encrypted in IndexedDB

## 🚀 Performance Optimizations

- Dynamic imports for code splitting
- WebGL optimization for 3D rendering
- Efficient state management
- Service worker caching strategies
- Lazy loading for heavy components

## 📈 Future Enhancements

- [ ] Multi-language support
- [ ] Social sharing features
- [ ] AI model fine-tuning
- [ ] Collaborative AR sessions
- [ ] Voice shopping assistant
- [ ] Personalized AI avatars

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is part of the Fleeks beauty platform.