'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text3D, useTexture } from '@react-three/drei';
import * as THREE from 'three';

function FloatingIcons({ count = 20 }) {
  const ref = useRef<THREE.Group>(null);
  
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.1;
    }
  });

  const icons = [
    { text: '📈', color: '#4ade80' }, // Growth
    { text: '💡', color: '#60a5fa' }, // Innovation
    { text: '📊', color: '#f472b6' }, // Analytics
    { text: '💰', color: '#fbbf24' }, // Investment
    { text: '🌐', color: '#818cf8' }, // Global
  ];

  return (
    <group ref={ref}>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const radius = 5 + Math.random() * 5;
        const x = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;
        const y = (Math.random() - 0.5) * 4;
        const icon = icons[Math.floor(Math.random() * icons.length)];
        
        return (
          <group key={i} position={[x, y, z]}>
            <Text3D
              font="/fonts/helvetiker_regular.typeface.json"
              size={0.5}
              height={0.1}
              curveSegments={12}
              bevelEnabled
              bevelThickness={0.02}
              bevelSize={0.02}
              bevelOffset={0}
              bevelSegments={5}
            >
              {icon.text}
              <meshStandardMaterial color={icon.color} />
            </Text3D>
          </group>
        );
      })}
    </group>
  );
}

function CentralSphere() {
  const ref = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.2;
    }
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1.5, 32, 32]} />
      <meshStandardMaterial 
        color="#3b82f6" 
        metalness={0.8}
        roughness={0.2}
        envMapIntensity={1}
      />
    </mesh>
  );
}

export function InvestmentVisualization() {
  return (
    <div className="w-full h-[600px] bg-gradient-to-b from-gray-900 to-black rounded-xl overflow-hidden">
      <Canvas camera={{ position: [0, 0, 15], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <CentralSphere />
        <FloatingIcons count={30} />
        
        <OrbitControls 
          enableZoom={true}
          enablePan={false}
          minDistance={5}
          maxDistance={20}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}
