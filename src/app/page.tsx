"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  initializeScene,
  disposeScene,
  loadModel,
  initializeInteraction,
  updateInteractions,
  cleanupInteraction,
  setupVisualEffects,
  updateVisualEffects,
  initializeAnimations,
  playAnimation,
  stopAnimation,
  pauseAnimation,
  resumeAnimation,
  updateAnimations,
  listAnimations,
} from '../components/three';
import CameraControls from '../components/three/CameraControls';

export default function Home() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [highlightEnabled, setHighlightEnabled] = useState(false);
  const [staticObjectsEnabled, setStaticObjectsEnabled] = useState(true);
  
  const [availableAnimations, setAvailableAnimations] = useState<string[]>([]);
  const [currentAnimation, setCurrentAnimation] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  
  const sceneRef = useRef<any>(null); 
  const modelRef = useRef<THREE.Group | null>(null);
  const animationContextRef = useRef<any>(null);
  const [bgColor, setBgColor] = useState("#6b6b6b");

  useEffect(() => {
    if (!mountRef.current) return;

    let interactionState: any;
    let effectsContext: any;
    let animationFrameId: number;

    const initialize = async () => {
      if (!mountRef.current) return;
      
      sceneRef.current = initializeScene(mountRef.current);
      sceneRef.current.scene.background = new THREE.Color(bgColor);

      effectsContext = setupVisualEffects(sceneRef.current, {
        outlineEnabled: highlightEnabled,
        outlineColor: '#ffffff',
        outlineStrength: 3,
        outlineGlow: 0.5
      });
      
      interactionState = initializeInteraction(sceneRef.current);
      
      const modelData = await loadModel('/fantasy_Low_poly_scene_.glb', sceneRef.current, {
        positions: interactionState.originalPositions,
        rotations: interactionState.originalRotations,
        velocities: interactionState.objectVelocities
      });
      
      modelRef.current = modelData.model;
      
      if (modelData.mixer && modelData.actions) {
        animationContextRef.current = initializeAnimations(
          modelData.mixer,
          modelData.actions
        );
        
        const animations = listAnimations(animationContextRef.current);
        setAvailableAnimations(animations);
        
        if (animations.length > 0) {
          setCurrentAnimation(animations[0]);
          console.log("Animations disponibles:", animations);
        }
      }
      
      applyStaticObjectsState(modelData.model, staticObjectsEnabled);
      
      const animate = () => {
        const deltaTime = sceneRef.current.clock.getDelta();
        
        updateInteractions(sceneRef.current, interactionState);
        
        updateVisualEffects(effectsContext, interactionState.highlightObjects, highlightEnabled);
        
        if (animationContextRef.current) {
          updateAnimations(animationContextRef.current, deltaTime);
        }
        
        sceneRef.current.composer.render();
        animationFrameId = requestAnimationFrame(animate);
      };
      
      animate();
    };
    
    initialize().catch(console.error);
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      
      if (sceneRef.current) {
        cleanupInteraction(sceneRef.current);
        disposeScene(sceneRef.current);
        sceneRef.current = null;
        modelRef.current = null;
        animationContextRef.current = null;
      }
    };
  }, [highlightEnabled]);
  
  useEffect(() => {
    if (modelRef.current) {
      applyStaticObjectsState(modelRef.current, staticObjectsEnabled);
    }
  }, [staticObjectsEnabled]);
  
  const handlePlayAnimation = () => {
    if (animationContextRef.current && currentAnimation) {
      playAnimation(animationContextRef.current, currentAnimation);
      setIsPlaying(true);
    }
  };
  
  const handlePauseAnimation = () => {
    if (animationContextRef.current) {
      pauseAnimation(animationContextRef.current);
      setIsPlaying(false);
    }
  };
  
  const handleResumeAnimation = () => {
    if (animationContextRef.current) {
      resumeAnimation(animationContextRef.current);
      setIsPlaying(true);
    }
  };
  
  const handleStopAnimation = () => {
    if (animationContextRef.current) {
      stopAnimation(animationContextRef.current);
      setIsPlaying(false);
    }
  };

  const applyStaticObjectsState = (model: THREE.Group, isStatic: boolean) => {
    model.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        const isFloor = 
          node.name.toLowerCase().includes('floor') || 
          node.name.toLowerCase().includes('wall');
          
        if (isFloor) {
          node.userData.isStatic = isStatic;
          console.log(`Objet ${node.name || 'sans nom'} défini comme ${isStatic ? 'statique' : 'dynamique'}`);
        }
      }
    });
  };

  return (
    <main>
      <div className="fixed top-4 left-4 z-10 bg-black bg-opacity-50 text-white p-4 rounded">
        <div className="flex flex-col space-y-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={highlightEnabled}
              onChange={(e) => setHighlightEnabled(e.target.checked)}
            />
            <span>Afficher le contour</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={staticObjectsEnabled}
              onChange={(e) => setStaticObjectsEnabled(e.target.checked)}
            />
            <span>Sol statique (sans effet)</span>
          </label>
          
          {/* Contrôles d'animation */}
          {availableAnimations.length > 0 && (
            <div className="mt-4">
              <h3 className="font-bold mb-2">Animations</h3>
              
              <div className="mb-2">
                <label htmlFor="animation-select" className="mr-2">Animation:</label>
                <select
                  id="animation-select"
                  value={currentAnimation}
                  onChange={(e) => setCurrentAnimation(e.target.value)}
                  className="bg-gray-700 text-white p-1 rounded w-full"
                >
                  {availableAnimations.map((anim) => (
                    <option key={anim} value={anim}>
                      {anim}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={handlePlayAnimation}
                  className="bg-blue-500 hover:bg-blue-600 px-2 py-1 rounded"
                >
                  Play
                </button>
                {isPlaying ? (
                  <button
                    onClick={handlePauseAnimation}
                    className="bg-yellow-500 hover:bg-yellow-600 px-2 py-1 rounded"
                  >
                    Pause
                  </button>
                ) : (
                  <button
                    onClick={handleResumeAnimation}
                    className="bg-green-500 hover:bg-green-600 px-2 py-1 rounded"
                  >
                    Resume
                  </button>
                )}
                <button
                  onClick={handleStopAnimation}
                  className="bg-red-500 hover:bg-red-600 px-2 py-1 rounded"
                >
                  Stop
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <CameraControls sceneRef={sceneRef} />
      
      <div ref={mountRef} style={{ width: '100vw', height: '100vh' }} />
    </main>
  );
}