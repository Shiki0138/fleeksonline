'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Camera, Mic, Hand, Brain, Zap, Shield, Globe } from 'lucide-react';
import AdaptiveUI from '@/components/AdaptiveUI';
import { useAIStore } from '@/store/aiStore';

// Dynamic imports for better performance
const VideoGallery3D = dynamic(() => import('@/components/VideoGallery3D'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-screen bg-black">
    <div className="animate-pulse text-white">Loading 3D Gallery...</div>
  </div>
});

const ARBeautySimulation = dynamic(() => import('@/components/ARBeautySimulation'), { 
  ssr: false 
});

const GestureControl = dynamic(() => import('@/components/GestureControl'), { 
  ssr: false 
});

const VoiceCommand = dynamic(() => import('@/components/VoiceCommand'), { 
  ssr: false 
});

export default function Home() {
  const [activeSection, setActiveSection] = useState<'home' | 'gallery' | 'ar'>('home');
  const [mounted, setMounted] = useState(false);
  const { preferences, updatePreferences, learnUserBehavior } = useAIStore();

  useEffect(() => {
    setMounted(true);
    
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        console.log('Service Worker registered:', registration);
      });
    }

    // Request notification permission for personalized updates
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const features = [
    {
      icon: Camera,
      title: 'AR Beauty Try-On',
      description: 'Try makeup and skincare products in real-time with AI-powered AR',
      color: 'from-pink-500 to-rose-500',
    },
    {
      icon: Hand,
      title: 'Gesture Control',
      description: 'Navigate with intuitive hand gestures detected by AI',
      color: 'from-purple-500 to-indigo-500',
    },
    {
      icon: Mic,
      title: 'Voice Commands',
      description: 'Control the app with natural voice commands',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Brain,
      title: 'Adaptive UI',
      description: 'UI that learns and adapts to your preferences',
      color: 'from-emerald-500 to-teal-500',
    },
    {
      icon: Zap,
      title: 'Offline AI',
      description: 'AI features work even without internet connection',
      color: 'from-yellow-500 to-orange-500',
    },
    {
      icon: Globe,
      title: 'Real-time Translation',
      description: 'AI translates content in real-time for global users',
      color: 'from-red-500 to-pink-500',
    },
  ];

  if (!mounted) return null;

  return (
    <AdaptiveUI>
      {/* AI Control Components */}
      <GestureControl onGestureDetected={(gesture) => {
        console.log('Gesture detected:', gesture);
        if (gesture === 'swipe-left' && activeSection === 'home') {
          setActiveSection('gallery');
        } else if (gesture === 'swipe-right' && activeSection === 'gallery') {
          setActiveSection('home');
        }
      }} />
      
      <VoiceCommand onCommandDetected={(command) => {
        console.log('Voice command:', command);
        if (command === 'show gallery') {
          setActiveSection('gallery');
        } else if (command === 'go home') {
          setActiveSection('home');
        } else if (command === 'open camera') {
          setActiveSection('ar');
        }
      }} />

      <AnimatePresence mode="wait">
        {activeSection === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900"
          >
            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>

              <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center justify-center space-x-2 mb-6"
                >
                  <Sparkles className="w-8 h-8 text-yellow-400" />
                  <span className="text-yellow-400 font-medium">AI-Powered Beauty Platform</span>
                </motion.div>

                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-6xl md:text-8xl font-bold text-white mb-6"
                >
                  Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">Fleeks</span>
                </motion.h1>

                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-xl md:text-2xl text-white/80 mb-12"
                >
                  Experience beauty through AI with AR try-ons, gesture control, and personalized recommendations
                </motion.p>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6"
                >
                  <button
                    onClick={() => setActiveSection('gallery')}
                    className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-full hover:shadow-2xl hover:scale-105 transition-all duration-300"
                  >
                    Explore 3D Gallery
                  </button>
                  <button
                    onClick={() => setActiveSection('ar')}
                    className="px-8 py-4 bg-white/10 backdrop-blur text-white font-semibold rounded-full border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300"
                  >
                    Try AR Beauty
                  </button>
                </motion.div>
              </div>

              {/* Floating particles effect */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ 
                      x: Math.random() * window.innerWidth,
                      y: window.innerHeight + 50 
                    }}
                    animate={{ 
                      y: -50,
                      x: Math.random() * window.innerWidth
                    }}
                    transition={{
                      duration: Math.random() * 10 + 10,
                      repeat: Infinity,
                      delay: Math.random() * 5
                    }}
                    className={`absolute w-2 h-2 rounded-full ${
                      i % 3 === 0 ? 'bg-pink-400' : i % 3 === 1 ? 'bg-purple-400' : 'bg-blue-400'
                    } opacity-50`}
                  />
                ))}
              </div>
            </section>

            {/* Features Grid */}
            <section className="py-20 px-6">
              <div className="max-w-7xl mx-auto">
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  className="text-4xl md:text-5xl font-bold text-white text-center mb-16"
                >
                  AI-Enhanced Features
                </motion.h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {features.map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ y: 20, opacity: 0 }}
                      whileInView={{ y: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                      className="relative group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
                      <div className="relative bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:border-white/40 transition-all duration-300">
                        <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6`}>
                          <feature.icon className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                        <p className="text-white/70">{feature.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* PWA Install Banner */}
            <motion.section
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              className="py-20 px-6"
            >
              <div className="max-w-4xl mx-auto bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-12 text-center">
                <Shield className="w-16 h-16 text-white mx-auto mb-6" />
                <h3 className="text-3xl font-bold text-white mb-4">
                  Install Fleeks for the Best Experience
                </h3>
                <p className="text-white/90 text-lg mb-8">
                  Get offline access, push notifications, and native app performance
                </p>
                <button
                  onClick={() => {
                    // PWA install prompt would go here
                    learnUserBehavior('pwa-install-click', { timestamp: Date.now() });
                  }}
                  className="px-8 py-4 bg-white text-purple-600 font-semibold rounded-full hover:scale-105 transition-transform"
                >
                  Install App
                </button>
              </div>
            </motion.section>
          </motion.div>
        )}

        {activeSection === 'gallery' && (
          <motion.div
            key="gallery"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              onClick={() => setActiveSection('home')}
              className="fixed top-4 right-4 z-50 px-4 py-2 bg-black/50 backdrop-blur text-white rounded-full hover:bg-black/70 transition"
            >
              Back to Home
            </button>
            <VideoGallery3D />
          </motion.div>
        )}

        {activeSection === 'ar' && (
          <motion.div
            key="ar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900 py-20"
          >
            <button
              onClick={() => setActiveSection('home')}
              className="fixed top-4 right-4 z-50 px-4 py-2 bg-black/50 backdrop-blur text-white rounded-full hover:bg-black/70 transition"
            >
              Back to Home
            </button>
            <div className="container mx-auto px-6">
              <h2 className="text-4xl font-bold text-white text-center mb-12">AR Beauty Try-On</h2>
              <ARBeautySimulation />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdaptiveUI>
  );
}