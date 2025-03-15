import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { type SceneContext } from './SceneInitializer';

export interface ModelData {
  originalPositions: Map<string, THREE.Vector3>;
  originalRotations: Map<string, THREE.Euler>;
  model: THREE.Group;
}

export async function loadModel(
  modelPath: string,
  context: SceneContext,
  storageMap: {
    positions: Map<string, THREE.Vector3>;
    rotations: Map<string, THREE.Euler>;
    velocities: Map<string, THREE.Vector3>;
  }
): Promise<ModelData> {
  return new Promise((resolve, reject) => {
    const dracoLoader = new DRACOLoader();

    // TODO: use local file instead of cdn for prod
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);
    
    loader.load(
      modelPath,
      (gltf) => {
        const model = gltf.scene;
        
        identifyStaticObjects(model);
        
        optimizeModel(
          model, 
          storageMap.positions, 
          storageMap.rotations, 
          storageMap.velocities
        );
        
        centerModel(model);
        
        context.scene.add(model);
                
        resolve({
          originalPositions: storageMap.positions,
          originalRotations: storageMap.rotations,
          model
        });
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
      },
      (error) => {
        console.error('Error while loading:', error);
        reject(error);
      }
    );
  });
}

function identifyStaticObjects(model: THREE.Group): void {
  model.traverse((node) => {
    const isStatic = 
      node.name.toLowerCase().includes('floor') || 
      node.name.toLowerCase().includes('wall')
      // node.name.toLowerCase().includes('ground') || 
      // node.name.toLowerCase().includes('sol') ||
      // node.name.toLowerCase().includes('plane') ||
      
      // (node instanceof THREE.Mesh && node.position.y < 0.1 && 
      //  node.geometry.boundingBox?.max.y - node.geometry.boundingBox?.min.y < 0.5);
      
    if (isStatic && node instanceof THREE.Mesh) {
      node.userData.isStatic = true;
    }
  });
}

function optimizeModel(
  model: THREE.Group,
  positions: Map<string, THREE.Vector3>,
  rotations: Map<string, THREE.Euler>,
  velocities: Map<string, THREE.Vector3>
): void {
  model.traverse((node) => {
    if (node instanceof THREE.Mesh) {
      node.castShadow = true;
      node.receiveShadow = true;
      
      positions.set(node.uuid, node.position.clone());
      rotations.set(node.uuid, node.rotation.clone());
      velocities.set(node.uuid, new THREE.Vector3(0, 0, 0));
      
      optimizeMaterials(node);
    }
  });
}

function optimizeMaterials(mesh: THREE.Mesh): void {
  if (!mesh.material) return;
  
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  
  materials.forEach(material => {
    if (material instanceof THREE.MeshStandardMaterial) {
      material.roughness = material.roughness !== undefined ? material.roughness * 0.8 : 0.6;
      material.metalness = material.metalness !== undefined ? material.metalness : 0.2;
      
      if (material.map) material.map.colorSpace = THREE.SRGBColorSpace;
      if (material.emissiveMap) material.emissiveMap.colorSpace = THREE.SRGBColorSpace;
      
      if (material.color) {
        const color = material.color.getHSL({h: 0, s: 0, l: 0});
        material.color.setHSL(color.h, color.s, Math.min(color.l * 1.2, 1.0));
      }
    } else if (material instanceof THREE.MeshPhysicalMaterial) {
      material.roughness = material.roughness !== undefined ? material.roughness * 0.8 : 0.6;
      material.metalness = material.metalness !== undefined ? material.metalness : 0.2;
      
      if (material.map) material.map.colorSpace = THREE.SRGBColorSpace;
      if (material.emissiveMap) material.emissiveMap.colorSpace = THREE.SRGBColorSpace;
      
      if (material.color) {
        const color = material.color.getHSL({h: 0, s: 0, l: 0});
        material.color.setHSL(color.h, color.s, Math.min(color.l * 1.2, 1.0));
      }
    } else if (material instanceof THREE.MeshLambertMaterial || 
               material instanceof THREE.MeshPhongMaterial) {
      if (material.map) material.map.colorSpace = THREE.SRGBColorSpace;
      if ('emissiveMap' in material && material.emissiveMap) {
        material.emissiveMap.colorSpace = THREE.SRGBColorSpace;
      }
      
      if (material.color) {
        const color = material.color.getHSL({h: 0, s: 0, l: 0});
        material.color.setHSL(color.h, color.s, Math.min(color.l * 1.2, 1.0));
      }
    } else if (material instanceof THREE.MeshBasicMaterial) {
      if (material.map) material.map.colorSpace = THREE.SRGBColorSpace;
      
      if (material.color) {
        const color = material.color.getHSL({h: 0, s: 0, l: 0});
        material.color.setHSL(color.h, color.s, Math.min(color.l * 1.2, 1.0));
      }
    }
  });
}

function centerModel(model: THREE.Group): void {
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  
  model.position.x = -center.x;
  model.position.z = -center.z;
  model.position.y = -center.y;
}