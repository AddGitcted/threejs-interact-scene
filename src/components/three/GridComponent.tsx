"use client";

import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { initializeScene, type SceneContext } from "./SceneInitializer";
import { GridConfig } from "./GridConfig";

interface GridComponentProps {
  config?: typeof GridConfig;
}

export default function GridComponent({ config = GridConfig }: GridComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mousePosition = useRef<THREE.Vector2>(new THREE.Vector2(0, 0));
  const raycaster = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const sceneContextRef = useRef<SceneContext | null>(null);
  const gridPlaneRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const currentConfig = config;
    
    const sceneContext = initializeScene(containerRef.current);
    sceneContextRef.current = sceneContext;
    const { scene, camera, renderer, composer, clock } = sceneContext;

    scene.background = new THREE.Color(currentConfig.grid.baseColor);

    const { position, lookAt } = currentConfig.camera;
    camera.position.set(position.x, position.y, position.z);
    camera.lookAt(new THREE.Vector3(lookAt.x, lookAt.y, lookAt.z));

    const gridPlane = createGridPlane(currentConfig, camera);
    gridPlaneRef.current = gridPlane;
    scene.add(gridPlane);

    const cleanupMouseEvents = setupMouseEvents(containerRef.current, gridPlane);

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();
      updateGridMaterial(gridPlane, elapsedTime, camera);
      composer.render();
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cleanupMouseEvents();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      disposeGrid(gridPlane);
      renderer.dispose();
    };
  }, [config]);

  const createGridPlane = (config: typeof GridConfig, camera: THREE.Camera): THREE.Mesh => {
    const { size, subdivisions } = config.grid;
    const geometry = new THREE.PlaneGeometry(size, size, subdivisions, subdivisions);
    geometry.rotateX(-Math.PI / 2);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMousePosition: { value: new THREE.Vector2(0, 0) },
        uMouseRadius: { value: config.wave.mouseRadius },
        uMouseStrength: { value: config.wave.mouseStrength },
        uGridColor: { value: new THREE.Color(config.grid.color) },
        uBaseColor: { value: new THREE.Color(config.grid.baseColor) },
        uGridWidth: { value: config.grid.width },
        uCameraPosition: { value: camera.position },
        uFadeDistance: { value: config.grid.fadeDistance.end }
      },
      vertexShader: `
        uniform float uTime;
        uniform vec2 uMousePosition;
        uniform float uMouseRadius;
        uniform float uMouseStrength;
        uniform vec3 uCameraPosition;
        
        varying vec3 vWorldPosition;
        varying float vDistanceFromCamera;
        
        ${getNoiseFunction()}
        
        void main() {
          vWorldPosition = position;
          
          // Calculate distance to mouse
          float distanceToMouse = distance(position.xz, uMousePosition);
          
          // Wave deformation
          float deformation = 0.0;
          if (distanceToMouse < uMouseRadius) {
            float factor = 1.0 - distanceToMouse / uMouseRadius;
            deformation = sin(factor * 10.0 - uTime * uMouseStrength) * factor * uMouseStrength;
          }
          
          // Global noise wave
          float globalWave = snoise(vec3(position.xz * 0.1, uTime * 0.5)) * uMouseStrength * 0.3;
          
          vec3 pos = position;
          pos.y += deformation + globalWave;
          
          vDistanceFromCamera = distance(pos, uCameraPosition);
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uGridColor;
        uniform vec3 uBaseColor;
        uniform float uGridWidth;
        uniform float uFadeDistance;
        
        varying vec3 vWorldPosition;
        varying float vDistanceFromCamera;
        
        float grid(vec2 coord, float lineWidth) {
          vec2 grid = abs(fract(coord - 0.5) - 0.5);
          float line = min(grid.x, grid.y);
          return 1.0 - smoothstep(0.0, lineWidth, line);
        }
        
        void main() {
          // Grid pattern
          vec2 coord = vWorldPosition.xz;
          float gridPattern = grid(coord, uGridWidth * 0.03);
          
          // Distance-based fading
          float fade = 1.0 - smoothstep(uFadeDistance * 0.5, uFadeDistance, vDistanceFromCamera);
          fade = pow(fade, 3.0);
          
          // Color mixing
          vec3 color = mix(uBaseColor, uGridColor, gridPattern * fade);
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      extensions: {
        derivatives: true
      } as any
    });

    return new THREE.Mesh(geometry, material);
  };

  const setupMouseEvents = (container: HTMLElement, grid: THREE.Mesh) => {
    const onMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mousePosition.current.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
      updateMousePosition(grid);
    };

    container.addEventListener('mousemove', onMouseMove);
    return () => container.removeEventListener('mousemove', onMouseMove);
  };

  const updateMousePosition = (grid: THREE.Mesh) => {
    if (!sceneContextRef.current) return;
    
    const { camera } = sceneContextRef.current;
    raycaster.current.setFromCamera(mousePosition.current, camera);
    
    const intersects = raycaster.current.intersectObject(grid);
    if (intersects.length > 0) {
      const point = intersects[0].point;
      const material = grid.material as THREE.ShaderMaterial;
      material.uniforms.uMousePosition.value.set(point.x, point.z);
    }
  };

  const updateGridMaterial = (grid: THREE.Mesh, time: number, camera: THREE.Camera) => {
    const material = grid.material as THREE.ShaderMaterial;
    material.uniforms.uTime.value = time;
    material.uniforms.uCameraPosition.value.copy(camera.position);
  };

  const disposeGrid = (grid: THREE.Mesh) => {
    grid.geometry.dispose();
    if (grid.material instanceof THREE.ShaderMaterial) {
      grid.material.dispose();
    }
    sceneContextRef.current?.scene.remove(grid);
  };

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: '100%', 
        height: '100vh',
        position: 'relative',
        overflow: 'hidden'
      }}
    />
  );
}

function getNoiseFunction(): string {
  return `
  //
  // Description : Array and textureless GLSL 2D/3D/4D simplex 
  //               noise functions.
  //      Author : Ian McEwan, Ashima Arts.
  //  Maintainer : stegu
  //     Lastmod : 20110822 (ijm)
  //     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
  //               Distributed under the MIT License. See LICENSE file.
  //               https://github.com/ashima/webgl-noise
  //               https://github.com/stegu/webgl-noise
  // 

  vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }

  vec4 mod289(vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }

  vec4 permute(vec4 x) {
       return mod289(((x*34.0)+1.0)*x);
  }

  vec4 taylorInvSqrt(vec4 r)
  {
    return 1.79284291400159 - 0.85373472095314 * r;
  }

  float snoise(vec3 v)
    { 
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

  // First corner
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 =   v - i + dot(i, C.xxx) ;

  // Other corners
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );

    //   x0 = x0 - 0.0 + 0.0 * C.xxx;
    //   x1 = x0 - i1  + 1.0 * C.xxx;
    //   x2 = x0 - i2  + 2.0 * C.xxx;
    //   x3 = x0 - 1.0 + 3.0 * C.xxx;
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
    vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

  // Permutations
    i = mod289(i); 
    vec4 p = permute( permute( permute( 
               i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
             + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

  // Gradients: 7x7 points over a square, mapped onto an octahedron.
  // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
    float n_ = 0.142857142857; // 1.0/7.0
    vec3  ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );

    //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
    //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);

  //Normalise gradients
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

  // Mix final noise value
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                  dot(p2,x2), dot(p3,x3) ) );
  }
  `;
}