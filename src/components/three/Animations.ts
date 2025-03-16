import * as THREE from 'three';

export interface AnimationContext {
  mixer: THREE.AnimationMixer;
  actions: Map<string, THREE.AnimationAction>;
  activeAction: THREE.AnimationAction | null;
}

export function initializeAnimations(
  mixer: THREE.AnimationMixer,
  actions: Map<string, THREE.AnimationAction>
): AnimationContext {
  return {
    mixer,
    actions,
    activeAction: null
  };
}

export function playAnimation(
  context: AnimationContext,
  name: string,
  loopMode: THREE.AnimationActionLoopStyles = THREE.LoopRepeat,
  fadeInTime: number = 0.5
): void {
  const action = context.actions.get(name);
  
  if (!action) {
    console.warn(`Animation '${name}' not found`);
    return;
  }
  
  if (context.activeAction && context.activeAction !== action) {
    context.activeAction.fadeOut(fadeInTime);
  }
  
  action.reset()
        .setLoop(loopMode, Infinity)
        .fadeIn(fadeInTime)
        .play();
  
  context.activeAction = action;
}

export function stopAnimation(
  context: AnimationContext,
  fadeOutTime: number = 0.5
): void {
  if (context.activeAction) {
    context.activeAction.fadeOut(fadeOutTime);
    context.activeAction = null;
  }
}

export function pauseAnimation(context: AnimationContext): void {
  if (context.activeAction) {
    context.activeAction.paused = true;
  }
}

export function resumeAnimation(context: AnimationContext): void {
  if (context.activeAction) {
    context.activeAction.paused = false;
  }
}

export function updateAnimations(context: AnimationContext, deltaTime: number): void {
  if (context.mixer) {
    context.mixer.update(deltaTime);
  }
}

export function listAnimations(context: AnimationContext): string[] {
  return Array.from(context.actions.keys());
}