import * as THREE from 'three';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { type SceneContext } from './SceneInitializer';

export interface VisualEffectsConfig {
  outlineEnabled: boolean;
  outlineColor: string;
  outlineThickness: number;
  outlineStrength: number;
  outlineGlow: number;
}

export interface VisualEffectsContext {
  outlinePass: OutlinePass | null;
  config: VisualEffectsConfig;
}

export function setupVisualEffects(
  context: SceneContext,
  config: Partial<VisualEffectsConfig> = {}
): VisualEffectsContext {
  const effectsConfig: VisualEffectsConfig = {
    outlineEnabled: config.outlineEnabled ?? true,
    outlineColor: config.outlineColor ?? '#ffffff',
    outlineThickness: config.outlineThickness ?? 1,
    outlineStrength: config.outlineStrength ?? 3,
    outlineGlow: config.outlineGlow ?? 0.5
  };
  
  let outlinePass: OutlinePass | null = null;
  
  if (effectsConfig.outlineEnabled) {
    outlinePass = createOutlinePass(context, effectsConfig);
    context.composer.addPass(outlinePass);
  }
  
  return {
    outlinePass,
    config: effectsConfig
  };
}

function createOutlinePass(
  context: SceneContext,
  config: VisualEffectsConfig
): OutlinePass {
  const outlinePass = new OutlinePass(
    new THREE.Vector2(context.container.clientWidth, context.container.clientHeight),
    context.scene,
    context.camera
  );
  
  outlinePass.edgeStrength = config.outlineStrength;
  outlinePass.edgeGlow = config.outlineGlow;
  outlinePass.edgeThickness = config.outlineThickness;
  outlinePass.visibleEdgeColor.set(config.outlineColor);
  outlinePass.hiddenEdgeColor.set('#190a05');
  
  return outlinePass;
}

export function updateVisualEffects(
  effects: VisualEffectsContext,
  highlightObjects: THREE.Object3D[],
  enabled: boolean = true
): void {
  if (!effects.outlinePass || !effects.config.outlineEnabled || !enabled) {
    if (effects.outlinePass) {
      effects.outlinePass.selectedObjects = [];
    }
    return;
  }
  
  effects.outlinePass.selectedObjects = highlightObjects;
}

export function toggleOutlineEffect(effects: VisualEffectsContext, enabled: boolean): void {
  if (effects.outlinePass) {
    effects.config.outlineEnabled = enabled;
  }
}

export function updateEffectConfig(
  context: SceneContext,
  effects: VisualEffectsContext,
  newConfig: Partial<VisualEffectsConfig>
): void {
  Object.assign(effects.config, newConfig);
  
  if (effects.outlinePass) {
    if (newConfig.outlineStrength !== undefined) {
      effects.outlinePass.edgeStrength = newConfig.outlineStrength;
    }
    
    if (newConfig.outlineGlow !== undefined) {
      effects.outlinePass.edgeGlow = newConfig.outlineGlow;
    }
    
    if (newConfig.outlineThickness !== undefined) {
      effects.outlinePass.edgeThickness = newConfig.outlineThickness;
    }
    
    if (newConfig.outlineColor !== undefined) {
      effects.outlinePass.visibleEdgeColor.set(newConfig.outlineColor);
    }
  }
}