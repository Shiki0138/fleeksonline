'use client';

import { useEffect, useRef, useState } from 'react';
import * as facemesh from '@mediapipe/face_mesh';
import * as drawingUtils from '@mediapipe/drawing_utils';
import * as cameraUtils from '@mediapipe/camera_utils';
import Webcam from 'react-webcam';
import { useAIStore } from '@/store/aiStore';
import { motion } from 'framer-motion';
import { Palette, Sparkles, Camera, CameraOff, Download } from 'lucide-react';

interface BeautyFilter {
  id: string;
  name: string;
  type: 'makeup' | 'skincare' | 'hair';
  effects: {
    lipColor?: string;
    eyeshadowColor?: string;
    blushColor?: string;
    skinSmoothing?: number;
    glowIntensity?: number;
    hairColor?: string;
  };
}

export default function ARBeautySimulation() {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [faceMesh, setFaceMesh] = useState<any>(null);
  const [selectedFilter, setSelectedFilter] = useState<BeautyFilter | null>(null);
  
  const { 
    arEnabled, 
    setFaceDetected, 
    setBeautyScore, 
    learnUserBehavior,
    updatePreferences 
  } = useAIStore();

  const filters: BeautyFilter[] = [
    {
      id: 'natural-glow',
      name: 'Natural Glow',
      type: 'makeup',
      effects: {
        lipColor: 'rgba(255, 182, 193, 0.6)',
        blushColor: 'rgba(255, 192, 203, 0.4)',
        skinSmoothing: 0.3,
        glowIntensity: 0.5
      }
    },
    {
      id: 'glamour-night',
      name: 'Glamour Night',
      type: 'makeup',
      effects: {
        lipColor: 'rgba(139, 0, 0, 0.8)',
        eyeshadowColor: 'rgba(75, 0, 130, 0.6)',
        blushColor: 'rgba(255, 20, 147, 0.5)',
        glowIntensity: 0.7
      }
    },
    {
      id: 'fresh-morning',
      name: 'Fresh Morning',
      type: 'skincare',
      effects: {
        skinSmoothing: 0.6,
        glowIntensity: 0.4,
        lipColor: 'rgba(255, 218, 185, 0.3)'
      }
    },
    {
      id: 'bold-lips',
      name: 'Bold Lips',
      type: 'makeup',
      effects: {
        lipColor: 'rgba(220, 20, 60, 0.9)',
        glowIntensity: 0.3
      }
    }
  ];

  useEffect(() => {
    if (arEnabled) {
      initializeFaceMesh();
    }
    return () => {
      if (faceMesh) {
        faceMesh.close();
      }
    };
  }, [arEnabled]);

  const initializeFaceMesh = () => {
    const mesh = new facemesh.FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      }
    });

    mesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    mesh.onResults(onFaceMeshResults);
    setFaceMesh(mesh);
    setIsActive(true);
  };

  const onFaceMeshResults = (results: any) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = results.image.width;
    canvas.height = results.image.height;

    // Draw the original image
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      setFaceDetected(true);
      
      const landmarks = results.multiFaceLandmarks[0];
      
      // Apply beauty filter if selected
      if (selectedFilter) {
        applyBeautyFilter(ctx, landmarks, selectedFilter.effects);
      }

      // Calculate and update beauty score based on facial symmetry
      const beautyScore = calculateBeautyScore(landmarks);
      setBeautyScore(beautyScore);

      // Draw face mesh for debugging (optional)
      if (false) { // Set to true to see mesh
        drawingUtils.drawConnectors(
          ctx, landmarks, facemesh.FACEMESH_FACE_OVAL,
          { color: '#C0C0C070', lineWidth: 1 }
        );
      }
    } else {
      setFaceDetected(false);
    }

    ctx.restore();
  };

  const applyBeautyFilter = (ctx: CanvasRenderingContext2D, landmarks: any, effects: any) => {
    // Lip makeup
    if (effects.lipColor) {
      applyLipColor(ctx, landmarks, effects.lipColor);
    }

    // Blush
    if (effects.blushColor) {
      applyBlush(ctx, landmarks, effects.blushColor);
    }

    // Eyeshadow
    if (effects.eyeshadowColor) {
      applyEyeshadow(ctx, landmarks, effects.eyeshadowColor);
    }

    // Skin smoothing and glow
    if (effects.skinSmoothing || effects.glowIntensity) {
      applySkinEffects(ctx, landmarks, effects.skinSmoothing || 0, effects.glowIntensity || 0);
    }
  };

  const applyLipColor = (ctx: CanvasRenderingContext2D, landmarks: any, color: string) => {
    // Upper lip indices
    const upperLipIndices = [61, 84, 17, 314, 405, 291, 308, 324, 318];
    // Lower lip indices
    const lowerLipIndices = [78, 95, 88, 178, 87, 14, 317, 402, 318];

    ctx.fillStyle = color;
    ctx.beginPath();

    // Draw upper lip
    upperLipIndices.forEach((index, i) => {
      const point = landmarks[index];
      const x = point.x * ctx.canvas.width;
      const y = point.y * ctx.canvas.height;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    // Draw lower lip
    lowerLipIndices.forEach((index) => {
      const point = landmarks[index];
      const x = point.x * ctx.canvas.width;
      const y = point.y * ctx.canvas.height;
      ctx.lineTo(x, y);
    });

    ctx.closePath();
    ctx.fill();
  };

  const applyBlush = (ctx: CanvasRenderingContext2D, landmarks: any, color: string) => {
    // Cheek indices
    const leftCheekIndices = [35, 31, 48, 115, 131, 102, 36];
    const rightCheekIndices = [361, 345, 352, 280, 330, 266];

    ctx.fillStyle = color;

    // Apply gradient blush effect
    [leftCheekIndices, rightCheekIndices].forEach(cheekIndices => {
      const centerX = cheekIndices.reduce((sum, idx) => sum + landmarks[idx].x * ctx.canvas.width, 0) / cheekIndices.length;
      const centerY = cheekIndices.reduce((sum, idx) => sum + landmarks[idx].y * ctx.canvas.height, 0) / cheekIndices.length;

      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 30);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  const applyEyeshadow = (ctx: CanvasRenderingContext2D, landmarks: any, color: string) => {
    // Eyelid indices
    const leftEyeIndices = [33, 7, 163, 144, 145, 153, 154, 155, 133];
    const rightEyeIndices = [362, 382, 381, 380, 374, 373, 390, 249, 263];

    ctx.fillStyle = color;

    [leftEyeIndices, rightEyeIndices].forEach(eyeIndices => {
      ctx.beginPath();
      eyeIndices.forEach((index, i) => {
        const point = landmarks[index];
        const x = point.x * ctx.canvas.width;
        const y = point.y * ctx.canvas.height;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.closePath();
      ctx.fill();
    });
  };

  const applySkinEffects = (ctx: CanvasRenderingContext2D, landmarks: any, smoothing: number, glow: number) => {
    // Apply subtle blur for skin smoothing
    ctx.filter = `blur(${smoothing * 2}px)`;
    
    // Add glow overlay
    if (glow > 0) {
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = `rgba(255, 240, 200, ${glow * 0.2})`;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.globalCompositeOperation = 'source-over';
    }
    
    ctx.filter = 'none';
  };

  const calculateBeautyScore = (landmarks: any): number => {
    // Simple beauty score based on facial symmetry
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const nose = landmarks[1];
    const leftMouth = landmarks[61];
    const rightMouth = landmarks[291];

    // Calculate symmetry
    const eyeSymmetry = 1 - Math.abs(leftEye.y - rightEye.y);
    const mouthSymmetry = 1 - Math.abs(leftMouth.y - rightMouth.y);
    
    // Golden ratio calculations (simplified)
    const eyeDistance = Math.abs(leftEye.x - rightEye.x);
    const faceWidth = Math.abs(landmarks[356].x - landmarks[127].x);
    const goldenRatio = eyeDistance / faceWidth;
    const goldenScore = 1 - Math.abs(goldenRatio - 0.618);

    // Combine scores
    const totalScore = (eyeSymmetry + mouthSymmetry + goldenScore) / 3;
    return Math.min(Math.max(totalScore * 100, 0), 100);
  };

  const handleCameraStream = async () => {
    if (!webcamRef.current || !webcamRef.current.video || !faceMesh) return;

    const video = webcamRef.current.video;
    if (video.readyState === 4) {
      await faceMesh.send({ image: video });
    }
  };

  useEffect(() => {
    if (isActive) {
      const interval = setInterval(handleCameraStream, 100);
      return () => clearInterval(interval);
    }
  }, [isActive, faceMesh]);

  const handleFilterSelect = (filter: BeautyFilter) => {
    setSelectedFilter(filter);
    learnUserBehavior('ar-filter-select', { 
      filterId: filter.id, 
      filterType: filter.type 
    });
    updatePreferences({ 
      beautyPresets: [...new Set([filter.id])] 
    });
  };

  const capturePhoto = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = `fleeks-beauty-${Date.now()}.png`;
      link.href = canvasRef.current.toDataURL();
      link.click();
    }
  };

  if (!arEnabled) return null;

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 backdrop-blur-lg rounded-3xl p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-6 h-6 text-pink-400" />
            <h2 className="text-2xl font-bold text-white">AR Beauty Try-On</h2>
          </div>
          <button
            onClick={() => setIsActive(!isActive)}
            className={`p-3 rounded-full transition ${
              isActive 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {isActive ? (
              <CameraOff className="w-5 h-5 text-white" />
            ) : (
              <Camera className="w-5 h-5 text-white" />
            )}
          </button>
        </div>

        <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/50">
          <Webcam
            ref={webcamRef}
            audio={false}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ visibility: 'hidden' }}
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          {!isActive && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-white/70 text-lg">Click camera to start AR experience</p>
            </div>
          )}
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Beauty Filters</h3>
            <button
              onClick={capturePhoto}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition"
              disabled={!isActive}
            >
              <Download className="w-4 h-4 text-white" />
              <span className="text-white text-sm">Capture</span>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => handleFilterSelect(filter)}
                className={`p-4 rounded-xl transition transform hover:scale-105 ${
                  selectedFilter?.id === filter.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-white/10 hover:bg-white/20 text-white/80'
                }`}
              >
                <Palette className="w-6 h-6 mx-auto mb-2" />
                <p className="text-sm font-medium">{filter.name}</p>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}