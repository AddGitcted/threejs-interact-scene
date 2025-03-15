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
  updateVisualEffects
} from '../components/three';

export default function Home() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [highlightEnabled, setHighlightEnabled] = useState(false);
  const [staticObjectsEnabled, setStaticObjectsEnabled] = useState(true);
  
  // Références pour garder les objets entre les rendus
  const sceneRef = useRef<any>(null);
  const modelRef = useRef<THREE.Group | null>(null);

  // Effet principal pour l'initialisation de la scène
  useEffect(() => {
    if (!mountRef.current) return;

    let interactionState: any;
    let effectsContext: any;
    let animationFrameId: number;

    const initialize = async () => {
      if (!mountRef.current) return;
      
      // Initialiser la scène
      sceneRef.current = initializeScene(mountRef.current);
      
      // Configurer les effets visuels
      effectsContext = setupVisualEffects(sceneRef.current, {
        outlineEnabled: highlightEnabled,
        outlineColor: '#ffffff',
        outlineStrength: 3,
        outlineGlow: 0.5
      });
      
      // Configurer l'interaction
      interactionState = initializeInteraction(sceneRef.current);
      
      // Charger le modèle 3D
      const modelData = await loadModel('/scene.glb', sceneRef.current, {
        positions: interactionState.originalPositions,
        rotations: interactionState.originalRotations,
        velocities: interactionState.objectVelocities
      });
      
      // Stocker le modèle dans la référence
      modelRef.current = modelData.model;
      
      // Appliquer les états statiques
      applyStaticObjectsState(modelData.model, staticObjectsEnabled);
      
      // Boucle d'animation
      const animate = () => {
        updateInteractions(sceneRef.current, interactionState);
        updateVisualEffects(effectsContext, interactionState.highlightObjects, highlightEnabled);
        sceneRef.current.composer.render();
        animationFrameId = requestAnimationFrame(animate);
      };
      
      animate();
    };
    
    initialize().catch(console.error);
    
    // Nettoyage
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      
      if (sceneRef.current) {
        cleanupInteraction(sceneRef.current);
        disposeScene(sceneRef.current);
        sceneRef.current = null;
        modelRef.current = null;
      }
    };
  }, [highlightEnabled]);
  
  // Effet pour mettre à jour les objets statiques
  useEffect(() => {
    if (modelRef.current) {
      applyStaticObjectsState(modelRef.current, staticObjectsEnabled);
    }
  }, [staticObjectsEnabled]);

  // Fonction pour identifier et marquer les objets statiques
  const applyStaticObjectsState = (model: THREE.Group, isStatic: boolean) => {
    model.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        const isFloor = 
          node.name.toLowerCase().includes('floor')
           ||
          // node.name.toLowerCase().includes('ground') || 
          // node.name.toLowerCase().includes('sol') ||
          // node.name.toLowerCase().includes('plane') 
          node.name.toLowerCase().includes('wall') 
          // node.position.y <= 0.1; // Position basse
          
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
        </div>
      </div>
      <div ref={mountRef} style={{ width: '100vw', height: '100vh' }} />
    </main>
  );
}