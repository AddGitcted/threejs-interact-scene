import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';

export interface SceneContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  composer: EffectComposer;
  container: HTMLDivElement;
  clock: THREE.Clock;
  controls?: {
    zoom: {
      minDistance: number;
      maxDistance: number;
      zoomSpeed: number;
    },
    orbit: {
      enabled: boolean;
      rotationSpeed: number;
      state: {
        isDragging: boolean;
        previousMouseX: number;
        previousMouseY: number;
        spherical: THREE.Spherical;
      }
    }
  };
}

export function initializeScene(container: HTMLDivElement): SceneContext {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);

  const camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  
  camera.position.set(23.6, 2.98, -22.7);
  
  camera.rotation.order = 'XYZ';
  
  const degToRad = Math.PI / 180;
  camera.rotation.set(
    81 * degToRad,  // X: 81°
    -2.3 * degToRad, // Y: -2.3°
    144 * degToRad   // Z: 144°
  );

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance"
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  
  container.appendChild(renderer.domElement);

  setupLights(scene);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const clock = new THREE.Clock();

  const controls = {
    zoom: {
      minDistance: 2,
      maxDistance: 20,
      zoomSpeed: 0.5 
    },
    orbit: {
      enabled: true,
      rotationSpeed: 1.0,
      state: {
        isDragging: false,
        previousMouseX: 0,
        previousMouseY: 0,
        spherical: new THREE.Spherical().setFromVector3(
          camera.position.clone().sub(new THREE.Vector3(0, 0, 0))
        )
      }
    }
  };

  window.addEventListener('resize', () => handleResize(container, camera, renderer, composer));
  
  setupMouseWheelZoom(container, camera, controls.zoom, controls.orbit);
  
  if (controls.orbit.enabled) {
    setupOrbitControls(container, camera, controls.orbit);
  }

  return { scene, camera, renderer, composer, container, clock, controls };
}

function setupMouseWheelZoom(
  container: HTMLDivElement, 
  camera: THREE.PerspectiveCamera,
  zoomControls: { minDistance: number; maxDistance: number; zoomSpeed: number },
  orbitControls?: {
    state: { spherical: THREE.Spherical }
  }
): void {
  container.addEventListener('wheel', (event) => {
    event.preventDefault();
    
    const zoomDelta = event.deltaY * zoomControls.zoomSpeed * 0.01;

    const zoomDirection = new THREE.Vector3(0, 0, 0).sub(camera.position).normalize();
    
    const newPosition = camera.position.clone().addScaledVector(zoomDirection, -zoomDelta);
    
    const distanceToOrigin = newPosition.distanceTo(new THREE.Vector3(0, 0, 0));
    
    if (distanceToOrigin >= zoomControls.minDistance && 
        distanceToOrigin <= zoomControls.maxDistance) {
      camera.position.copy(newPosition);
      
      if (orbitControls) {
        orbitControls.state.spherical.radius = distanceToOrigin;
      }
    }
  }, { passive: false });
}

function setupOrbitControls(
  container: HTMLDivElement,
  camera: THREE.PerspectiveCamera,
  orbitControls: {
    enabled: boolean;
    rotationSpeed: number;
    state: {
      isDragging: boolean;
      previousMouseX: number;
      previousMouseY: number;
      spherical: THREE.Spherical;
    }
  }
): void {
  // camera reference point
  const target = new THREE.Vector3(0, 0, 0);
  
  container.addEventListener('mousedown', (event) => {
    if (event.button === 0) {
      orbitControls.state.spherical.radius = camera.position.distanceTo(target);
      
      const direction = new THREE.Vector3().subVectors(camera.position, target).normalize();
      
      orbitControls.state.spherical.phi = Math.acos(direction.y);
      
      orbitControls.state.spherical.theta = Math.atan2(direction.x, direction.z);
      
      orbitControls.state.isDragging = true;
      orbitControls.state.previousMouseX = event.clientX;
      orbitControls.state.previousMouseY = event.clientY;
    }
  });
  
  const handleMouseUp = () => {
    orbitControls.state.isDragging = false;
  };
  
  container.addEventListener('mouseup', handleMouseUp);
  container.addEventListener('mouseleave', handleMouseUp);
  
  container.addEventListener('mousemove', (event) => {
    if (!orbitControls.state.isDragging) return;
    
    const deltaX = event.clientX - orbitControls.state.previousMouseX;
    const deltaY = event.clientY - orbitControls.state.previousMouseY;
    
    orbitControls.state.previousMouseX = event.clientX;
    orbitControls.state.previousMouseY = event.clientY;
    
    const rotateHorizontal = -deltaX * orbitControls.rotationSpeed * 0.01;
    const rotateVertical = -deltaY * orbitControls.rotationSpeed * 0.01;
    
    orbitControls.state.spherical.theta += rotateHorizontal;
    
    orbitControls.state.spherical.phi = Math.max(
      0.1,
      Math.min(
        Math.PI - 0.1,
        orbitControls.state.spherical.phi + rotateVertical
      )
    );
    
    const sinPhiRadius = Math.sin(orbitControls.state.spherical.phi) * orbitControls.state.spherical.radius;
    
    camera.position.x = target.x + sinPhiRadius * Math.sin(orbitControls.state.spherical.theta);
    camera.position.z = target.z + sinPhiRadius * Math.cos(orbitControls.state.spherical.theta);
    camera.position.y = target.y + Math.cos(orbitControls.state.spherical.phi) * orbitControls.state.spherical.radius;
    
    camera.lookAt(target);
  });
}

function setupLights(scene: THREE.Scene): void {
  scene.add(new THREE.AmbientLight(0xffffff, 1.0));
  
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
  dirLight.position.set(5, 10, 7.5);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 50;
  dirLight.shadow.bias = -0.0001;
  scene.add(dirLight);
  
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.8);
  fillLight.position.set(-5, 3, -5);
  scene.add(fillLight);
  
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
  scene.add(hemiLight);
}

function handleResize(
  container: HTMLDivElement,
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
  composer: EffectComposer
): void {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  
  renderer.setSize(container.clientWidth, container.clientHeight);
  composer.setSize(container.clientWidth, container.clientHeight);
}

export function disposeScene(context: SceneContext): void {
  if (context.container && context.renderer.domElement) {
    context.container.removeEventListener('wheel', () => {});
    context.container.removeEventListener('mousedown', () => {});
    context.container.removeEventListener('mouseup', () => {});
    context.container.removeEventListener('mousemove', () => {});
    context.container.removeEventListener('mouseleave', () => {});
    
    context.container.removeChild(context.renderer.domElement);
  }
  
  context.renderer.dispose();
  context.scene.clear();
}