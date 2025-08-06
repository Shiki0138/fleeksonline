'use client';

import { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as speechCommands from '@tensorflow-models/speech-commands';
import { useAIStore } from '@/store/aiStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2 } from 'lucide-react';

interface VoiceCommandProps {
  onCommandDetected?: (command: string) => void;
}

const customCommands = [
  'show products',
  'next page',
  'previous page',
  'search beauty',
  'open cart',
  'filter price',
  'sort popular',
  'zoom in',
  'zoom out',
  'play video',
  'pause video',
  'show reviews',
];

export default function VoiceCommand({ onCommandDetected }: VoiceCommandProps) {
  const [model, setModel] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState<string>('');
  const [confidence, setConfidence] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { setVoiceCommand, setModelLoaded, voiceEnabled, learnUserBehavior } = useAIStore();
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (voiceEnabled) {
      initializeSpeechRecognition();
    }
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [voiceEnabled]);

  const initializeSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsListening(true);
        setModelLoaded('speechCommands', true);
      };
      
      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript.toLowerCase().trim();
        const confidence = event.results[current][0].confidence;
        
        setIsProcessing(true);
        
        // Check if transcript matches any custom command
        const matchedCommand = customCommands.find(cmd => 
          transcript.includes(cmd.toLowerCase()) || 
          calculateSimilarity(transcript, cmd) > 0.7
        );
        
        if (matchedCommand) {
          setLastCommand(matchedCommand);
          setConfidence(confidence);
          setVoiceCommand(matchedCommand);
          
          if (onCommandDetected) {
            onCommandDetected(matchedCommand);
          }
          
          // Learn from voice command usage
          learnUserBehavior('voice-command', {
            command: matchedCommand,
            transcript: transcript,
            confidence: confidence,
            timestamp: Date.now()
          });
          
          // Provide audio feedback
          playFeedbackSound();
        }
        
        setIsProcessing(false);
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setIsProcessing(false);
      };
      
      recognition.onend = () => {
        if (isListening) {
          recognition.start();
        }
      };
      
      recognitionRef.current = recognition;
    }
  };

  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = (a: string, b: string): number => {
      const matrix: number[][] = [];
      
      for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
      }
      
      for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
      }
      
      for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
          if (b.charAt(i - 1) === a.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1];
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1
            );
          }
        }
      }
      
      return matrix[b.length][a.length];
    };
    
    return (longer.length - editDistance(longer, shorter)) / longer.length;
  };

  const playFeedbackSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  if (!voiceEnabled) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative"
      >
        <div className="bg-black/80 backdrop-blur-lg rounded-2xl p-4 shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Volume2 className="w-5 h-5 text-white" />
              <span className="text-white text-sm font-medium">Voice Control</span>
            </div>
            <button
              onClick={toggleListening}
              className={`p-2 rounded-full transition ${
                isListening 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              {isListening ? (
                <Mic className="w-4 h-4 text-white" />
              ) : (
                <MicOff className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                isListening ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
              }`} />
              <span className="text-white/70 text-xs">
                {isListening ? 'Listening...' : 'Click mic to start'}
              </span>
            </div>
            
            <AnimatePresence mode="wait">
              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center space-x-2"
                >
                  <div className="flex space-x-1">
                    <div className="w-1 h-3 bg-blue-400 animate-bounce" />
                    <div className="w-1 h-3 bg-blue-400 animate-bounce delay-75" />
                    <div className="w-1 h-3 bg-blue-400 animate-bounce delay-150" />
                  </div>
                  <span className="text-white/50 text-xs">Processing...</span>
                </motion.div>
              )}
            </AnimatePresence>
            
            <AnimatePresence mode="wait">
              {lastCommand && !isProcessing && (
                <motion.div
                  key={lastCommand}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white/10 rounded-lg p-2"
                >
                  <p className="text-white text-sm font-medium">
                    "{lastCommand}"
                  </p>
                  <div className="w-full bg-white/20 rounded-full h-1 mt-1">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${confidence * 100}%` }}
                      className="bg-gradient-to-r from-purple-400 to-pink-400 h-full rounded-full"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="mt-3 text-white/50 text-xs">
            <p>Try saying:</p>
            <p className="italic">"Show products" or "Next page"</p>
          </div>
        </div>
        
        {isListening && (
          <div className="absolute -top-2 -right-2">
            <div className="relative">
              <div className="absolute inset-0 bg-red-400 rounded-full animate-ping" />
              <div className="relative bg-red-400 rounded-full w-3 h-3" />
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}