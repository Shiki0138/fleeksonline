'use client';

import { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/handpose';
import Webcam from 'react-webcam';
import { useAIStore } from '@/store/aiStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Hand, Volume2, VolumeX } from 'lucide-react';

interface GestureControlProps {
  onGestureDetected?: (gesture: string) => void;
}

export default function GestureControl({ onGestureDetected }: GestureControlProps) {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [model, setModel] = useState<any>(null);
  const [isActive, setIsActive] = useState(false);
  const [lastGesture, setLastGesture] = useState<string>('');
  const [gestureConfidence, setGestureConfidence] = useState(0);
  
  const { setGesture, setModelLoaded, gesturesEnabled, learnUserBehavior } = useAIStore();

  useEffect(() => {
    if (gesturesEnabled) {
      loadHandposeModel();
    }
    return () => {
      if (model) {
        model.dispose();
      }
    };
  }, [gesturesEnabled]);

  const loadHandposeModel = async () => {
    try {
      await tf.ready();
      const loadedModel = await handpose.load();
      setModel(loadedModel);
      setModelLoaded('handpose', true);
      setIsActive(true);
    } catch (error) {
      console.error('Failed to load handpose model:', error);
    }
  };

  const detectGesture = (landmarks: any) => {
    if (!landmarks || landmarks.length === 0) return null;

    const hand = landmarks[0];
    const palmBase = hand[0];
    const thumbTip = hand[4];
    const indexTip = hand[8];
    const middleTip = hand[12];
    const ringTip = hand[16];
    const pinkyTip = hand[20];

    // Calculate distances and angles for gesture recognition
    const thumbIndexDist = Math.sqrt(
      Math.pow(thumbTip[0] - indexTip[0], 2) + 
      Math.pow(thumbTip[1] - indexTip[1], 2)
    );

    const indexMiddleDist = Math.sqrt(
      Math.pow(indexTip[0] - middleTip[0], 2) + 
      Math.pow(indexTip[1] - middleTip[1], 2)
    );

    // Gesture detection logic
    if (thumbIndexDist < 30) {
      return { gesture: 'pinch', confidence: 0.9 };
    }

    // Check if index finger is pointing up
    if (indexTip[1] < palmBase[1] - 50 && 
        middleTip[1] > palmBase[1] && 
        ringTip[1] > palmBase[1] && 
        pinkyTip[1] > palmBase[1]) {
      return { gesture: 'point-up', confidence: 0.85 };
    }

    // Check for peace sign
    if (indexTip[1] < palmBase[1] - 40 && 
        middleTip[1] < palmBase[1] - 40 && 
        ringTip[1] > palmBase[1] && 
        pinkyTip[1] > palmBase[1]) {
      return { gesture: 'peace', confidence: 0.8 };
    }

    // Check for thumbs up
    if (thumbTip[1] < palmBase[1] - 40 && 
        indexTip[1] > palmBase[1] && 
        middleTip[1] > palmBase[1]) {
      return { gesture: 'thumbs-up', confidence: 0.8 };
    }

    // Check for open palm
    if (indexTip[1] < palmBase[1] && 
        middleTip[1] < palmBase[1] && 
        ringTip[1] < palmBase[1] && 
        pinkyTip[1] < palmBase[1] && 
        indexMiddleDist > 20) {
      return { gesture: 'open-palm', confidence: 0.75 };
    }

    return null;
  };

  const detectHand = async () => {
    if (!isActive || !model || !webcamRef.current || !webcamRef.current.video) return;

    const video = webcamRef.current.video;
    if (video.readyState !== 4) return;

    const predictions = await model.estimateHands(video);
    
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        canvasRef.current.width = video.videoWidth;
        canvasRef.current.height = video.videoHeight;
        
        ctx.clearRect(0, 0, video.videoWidth, video.videoHeight);
        
        if (predictions.length > 0) {
          // Draw hand landmarks
          predictions.forEach((prediction: any) => {
            const landmarks = prediction.landmarks;
            
            // Draw connections
            const connections = [
              [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
              [0, 5], [5, 6], [6, 7], [7, 8], // Index
              [0, 9], [9, 10], [10, 11], [11, 12], // Middle
              [0, 13], [13, 14], [14, 15], [15, 16], // Ring
              [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
            ];
            
            ctx.strokeStyle = '#ff6b6b';
            ctx.lineWidth = 2;
            
            connections.forEach(([start, end]) => {
              ctx.beginPath();
              ctx.moveTo(landmarks[start][0], landmarks[start][1]);
              ctx.lineTo(landmarks[end][0], landmarks[end][1]);
              ctx.stroke();
            });
            
            // Draw points
            landmarks.forEach((landmark: number[]) => {
              ctx.beginPath();
              ctx.arc(landmark[0], landmark[1], 5, 0, 2 * Math.PI);
              ctx.fillStyle = '#4ecdc4';
              ctx.fill();
            });
          });
          
          // Detect gesture
          const gestureResult = detectGesture(predictions[0].landmarks);
          if (gestureResult) {
            setLastGesture(gestureResult.gesture);
            setGestureConfidence(gestureResult.confidence);
            setGesture(gestureResult.gesture);
            
            if (onGestureDetected) {
              onGestureDetected(gestureResult.gesture);
            }
            
            // Learn from gesture usage
            learnUserBehavior('gesture', { 
              type: gestureResult.gesture, 
              confidence: gestureResult.confidence,
              timestamp: Date.now() 
            });
          }
        }
      }
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      detectHand();
    }, 100);

    return () => clearInterval(interval);
  }, [model, isActive]);

  if (!gesturesEnabled) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative"
      >
        <div className="bg-black/80 backdrop-blur-lg rounded-2xl p-4 shadow-2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Hand className="w-5 h-5 text-white" />
              <span className="text-white text-sm font-medium">Gesture Control</span>
            </div>
            <button
              onClick={() => setIsActive(!isActive)}
              className="p-1 rounded-full hover:bg-white/20 transition"
            >
              {isActive ? (
                <Volume2 className="w-4 h-4 text-green-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-red-400" />
              )}
            </button>
          </div>
          
          <div className="relative w-48 h-36 rounded-lg overflow-hidden">
            <Webcam
              ref={webcamRef}
              audio={false}
              className="absolute inset-0 w-full h-full object-cover"
              videoConstraints={{
                width: 640,
                height: 480,
                facingMode: 'user',
              }}
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full"
            />
          </div>
          
          <AnimatePresence mode="wait">
            {lastGesture && (
              <motion.div
                key={lastGesture}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-2 text-center"
              >
                <p className="text-white text-sm font-medium capitalize">
                  {lastGesture.replace('-', ' ')}
                </p>
                <div className="w-full bg-white/20 rounded-full h-1 mt-1">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${gestureConfidence * 100}%` }}
                    className="bg-gradient-to-r from-green-400 to-blue-400 h-full rounded-full"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="absolute -top-2 -right-2">
          <div className="relative">
            <div className="absolute inset-0 bg-green-400 rounded-full animate-ping" />
            <div className="relative bg-green-400 rounded-full w-3 h-3" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}