'use client';

import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Text, Box, Plane, useTexture, PerspectiveCamera, Float, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { useAIStore } from '@/store/aiStore';

interface VideoCardProps {
  position: [number, number, number];
  rotation: [number, number, number];
  videoUrl: string;
  title: string;
  onClick: () => void;
}

function VideoCard({ position, rotation, videoUrl, title, onClick }: VideoCardProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [video] = useState(() => {
    const vid = document.createElement('video');
    vid.src = videoUrl;
    vid.crossOrigin = 'anonymous';
    vid.loop = true;
    vid.muted = true;
    vid.play();
    return vid;
  });

  const videoTexture = new THREE.VideoTexture(video);
  videoTexture.minFilter = THREE.LinearFilter;
  videoTexture.magFilter = THREE.LinearFilter;

  useFrame((state) => {
    if (meshRef.current && hovered) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.1;
      meshRef.current.scale.x = THREE.MathUtils.lerp(meshRef.current.scale.x, 1.1, 0.1);
      meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, 1.1, 0.1);
    } else if (meshRef.current) {
      meshRef.current.scale.x = THREE.MathUtils.lerp(meshRef.current.scale.x, 1, 0.1);
      meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, 1, 0.1);
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
      <group position={position} rotation={rotation}>
        <Box
          ref={meshRef}
          args={[3, 4, 0.1]}
          onClick={onClick}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <meshBasicMaterial map={videoTexture} side={THREE.DoubleSide} />
        </Box>
        <Text
          position={[0, -2.5, 0]}
          fontSize={0.3}
          color={hovered ? '#ff6b6b' : '#ffffff'}
          anchorX="center"
          anchorY="middle"
        >
          {title}
        </Text>
      </group>
    </Float>
  );
}

interface Video {
  id: string;
  url: string;
  title: string;
  category: string;
}

export default function VideoGallery3D() {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const { gestureDetected, learnUserBehavior } = useAIStore();
  const [videos] = useState<Video[]>([
    { id: '1', url: '/videos/tutorial1.mp4', title: 'Glow Makeup Tutorial', category: 'tutorials' },
    { id: '2', url: '/videos/review1.mp4', title: 'Product Review: Serum', category: 'reviews' },
    { id: '3', url: '/videos/tips1.mp4', title: 'Skincare Tips', category: 'tips' },
    { id: '4', url: '/videos/tutorial2.mp4', title: 'Eye Makeup Guide', category: 'tutorials' },
    { id: '5', url: '/videos/review2.mp4', title: 'Foundation Test', category: 'reviews' },
    { id: '6', url: '/videos/tips2.mp4', title: 'Morning Routine', category: 'tips' },
  ]);

  // Handle gesture navigation
  useEffect(() => {
    if (gestureDetected === 'swipe-left') {
      // Navigate to next video
      const currentIndex = videos.findIndex(v => v.id === selectedVideo?.id);
      if (currentIndex < videos.length - 1) {
        setSelectedVideo(videos[currentIndex + 1]);
      }
    } else if (gestureDetected === 'swipe-right') {
      // Navigate to previous video
      const currentIndex = videos.findIndex(v => v.id === selectedVideo?.id);
      if (currentIndex > 0) {
        setSelectedVideo(videos[currentIndex - 1]);
      }
    }
  }, [gestureDetected, videos, selectedVideo]);

  const handleVideoClick = (video: Video) => {
    setSelectedVideo(video);
    learnUserBehavior('video-click', { videoId: video.id, category: video.category });
  };

  const positions: [number, number, number][] = [
    [-4, 2, 0],
    [0, 2, -2],
    [4, 2, 0],
    [-4, -2, 0],
    [0, -2, -2],
    [4, -2, 0],
  ];

  const rotations: [number, number, number][] = [
    [0, 0.3, 0],
    [0, 0, 0],
    [0, -0.3, 0],
    [0, 0.3, 0],
    [0, 0, 0],
    [0, -0.3, 0],
  ];

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-red-900">
      <Canvas className="w-full h-full">
        <PerspectiveCamera makeDefault position={[0, 0, 10]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <spotLight position={[-10, -10, -10]} angle={0.15} penumbra={1} intensity={0.5} />
        
        <Environment preset="sunset" />
        
        {videos.map((video, index) => (
          <VideoCard
            key={video.id}
            position={positions[index]}
            rotation={rotations[index]}
            videoUrl={video.url}
            title={video.title}
            onClick={() => handleVideoClick(video)}
          />
        ))}
        
        <OrbitControls
          enablePan={false}
          maxDistance={15}
          minDistance={5}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 3}
        />
        
        <EffectComposer>
          <Bloom luminanceThreshold={0.6} luminanceSmoothing={0.9} height={300} />
          <ChromaticAberration offset={[0.002, 0.002]} />
        </EffectComposer>
      </Canvas>

      {selectedVideo && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="absolute inset-0 bg-black/90 flex items-center justify-center z-50"
          onClick={() => setSelectedVideo(null)}
        >
          <div className="relative w-[90%] max-w-4xl aspect-video">
            <video
              src={selectedVideo.url}
              controls
              autoPlay
              className="w-full h-full rounded-lg shadow-2xl"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedVideo(null);
              }}
              className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}