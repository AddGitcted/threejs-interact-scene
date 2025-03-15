import * as THREE from "three";
import { type SceneContext } from "./SceneInitializer";

export interface InteractionState {
  mouse: THREE.Vector2;
  raycaster: THREE.Raycaster;
  selectedObject: THREE.Object3D | null;
  previousSelectedObject: THREE.Object3D | null;
  objectVelocities: Map<string, THREE.Vector3>;
  originalPositions: Map<string, THREE.Vector3>;
  originalRotations: Map<string, THREE.Euler>;
  highlightObjects: THREE.Object3D[];
  impulseStrength: number;
  springStrength: number;
  damping: number;
  lastBounceTime: Map<string, number>;
  bounceCooldown: number;
}

export function initializeInteraction(context: SceneContext): InteractionState {
  const state: InteractionState = {
    mouse: new THREE.Vector2(),
    raycaster: new THREE.Raycaster(),
    selectedObject: null,
    previousSelectedObject: null,
    objectVelocities: new Map<string, THREE.Vector3>(),
    originalPositions: new Map<string, THREE.Vector3>(),
    originalRotations: new Map<string, THREE.Euler>(),
    highlightObjects: [],
    impulseStrength: 1,
    springStrength: 50.0, // Elastic return force
    damping: 0.95,
    lastBounceTime: new Map<string, number>(),
    bounceCooldown: 500
  };

  context.container.addEventListener("mousemove", (event) => {
    handleMouseMove(event, context.container, state.mouse);
  });

  return state;
}

export function handleMouseMove(
  event: MouseEvent,
  container: HTMLDivElement,
  mouse: THREE.Vector2
): void {
  const rect = container.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

export function updateInteractions(
  context: SceneContext,
  state: InteractionState,
  enableHighlight: boolean = false
): void {
  const deltaTime = context.clock.getDelta();

  state.raycaster.setFromCamera(state.mouse, context.camera);
  const intersects = state.raycaster.intersectObjects(
    context.scene.children,
    true
  );

  state.previousSelectedObject = state.selectedObject;
  state.selectedObject = intersects.length > 0 ? intersects[0].object : null;

  if (enableHighlight) {
    state.highlightObjects = state.selectedObject ? [state.selectedObject] : [];
  } else {
    state.highlightObjects = [];
  }

  if (
    state.selectedObject &&
    state.selectedObject !== state.previousSelectedObject
  ) {
    applyBounceEffect(state, intersects[0]);
  }

  updatePhysics(context.scene, state, deltaTime);
}

function applyBounceEffect(
  state: InteractionState,
  intersection: THREE.Intersection
): void {
  if (!state.selectedObject) return;

  if (
    state.selectedObject.userData &&
    state.selectedObject.userData.isStatic === true
  ) {
    // Do not apply the bump effect to static objects
    return;
  }
  const currentTime = Date.now();
  const objectId = state.selectedObject.uuid;
  const lastBounceTime = state.lastBounceTime.get(objectId) || 0;

  if (currentTime - lastBounceTime < state.bounceCooldown) {
    return;
  }

  state.lastBounceTime.set(objectId, currentTime);

  const intersectionPoint = intersection.point;

  // Calculate the direction of the force (from the intersection to the center of the object)
  const forceDirection = new THREE.Vector3()
    .subVectors(state.selectedObject.position, intersectionPoint)
    .normalize();

  const velocity = state.objectVelocities.get(state.selectedObject.uuid);

  if (velocity) {
    velocity.x += forceDirection.x * state.impulseStrength;
    velocity.y += forceDirection.y * state.impulseStrength;
    velocity.z += forceDirection.z * state.impulseStrength;
  }
}

function updatePhysics(
  scene: THREE.Scene,
  state: InteractionState,
  deltaTime: number
): void {
  scene.traverse((node) => {
    if (node instanceof THREE.Mesh) {
      if (node.userData && node.userData.isStatic === true) {
        return;
      }

      const originalPosition = state.originalPositions.get(node.uuid);
      const originalRotation = state.originalRotations.get(node.uuid);
      const velocity = state.objectVelocities.get(node.uuid);

      if (originalPosition && originalRotation && velocity) {
        node.position.x += velocity.x * deltaTime;
        node.position.y += velocity.y * deltaTime;
        node.position.z += velocity.z * deltaTime;

        velocity.multiplyScalar(state.damping);

        const direction = new THREE.Vector3().subVectors(
          originalPosition,
          node.position
        );

        velocity.x += direction.x * state.springStrength * deltaTime;
        velocity.y += direction.y * state.springStrength * deltaTime;
        velocity.z += direction.z * state.springStrength * deltaTime;

        node.rotation.x = originalRotation.x + velocity.z * 0.1;
        node.rotation.y = originalRotation.y + velocity.x * 0.1;
        node.rotation.z = originalRotation.z + velocity.y * 0.1;
      }
    }
  });
}

export function cleanupInteraction(context: SceneContext): void {
  context.container.removeEventListener("mousemove", (event) => {
    handleMouseMove(event, context.container, new THREE.Vector2());
  });
}
