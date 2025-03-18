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
    
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);
    
    console.log("Creating grid plane");
    const gridPlane = createGridPlane();
    console.log("Grid plane created:", gridPlane);
    gridPlaneRef.current = gridPlane;
    scene.add(gridPlane);
    
    const cleanupMouseEvents = setupMouseEvents();
    
    const animate = () => {
      const elapsedTime = clock.getElapsedTime();
      
      if (gridPlane.material instanceof THREE.ShaderMaterial) {
        gridPlane.material.uniforms.uTime.value = elapsedTime;
      }
      
      composer.render();
      requestAnimationFrame(animate);
    };
    
    animate();
    
    console.log("Camera position:", camera.position);

    return () => {
      if (cleanupMouseEvents) cleanupMouseEvents();
      
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      gridPlane.geometry.dispose();
      if (gridPlane.material instanceof THREE.ShaderMaterial) {
        gridPlane.material.dispose();
      }
      scene.remove(gridPlane);
      renderer.dispose();
    };
  }, [config]);
  
  const createGridPlane = (): THREE.Mesh => {
    const { size, subdivisions } = config.grid;
    const geometry = new THREE.PlaneGeometry(size, size, subdivisions, subdivisions);
    geometry.rotateX(-Math.PI / 2); // horizontal
    
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uMousePosition: { value: new THREE.Vector2(0, 0) },
        uMouseRadius: { value: config.wave.mouseRadius },
        uMouseStrength: { value: config.wave.mouseStrength },
        uGridColor: { value: new THREE.Color(config.grid.color) },
        uBaseColor: { value: new THREE.Color(config.grid.baseColor) },
        uGridWidth: { value: config.grid.width },
        uGridScale: { value: 1.0 }
      },
      vertexShader: `
        uniform float uTime;
        uniform vec2 uMousePosition;
        uniform float uMouseRadius;
        uniform float uMouseStrength;
        
        varying vec3 vPosition;
        varying vec2 vUv;
        
        // Simplex noise function
        ${getNoiseFunction()}
        
        void main() {
          vUv = uv;
          vPosition = position;
          
          // calculate distance to mouse position
          vec2 mousePos = uMousePosition;
          float distanceToMouse = distance(position.xz, mousePos);
          
          // wave deformation based on mouse position
          float deformation = 0.0;
          if (distanceToMouse < uMouseRadius) {
            float factor = 1.0 - distanceToMouse / uMouseRadius;
            factor = smoothstep(0.0, 1.0, factor);
            
            deformation = sin(factor * 10.0 - uTime * uMouseStrength) * factor * uMouseStrength;
          }
          
          // shockwave
          float globalWave = snoise(vec3(position.x * uMouseRadius * 0.01, position.z * uMouseRadius * 0.01, uTime * 0.2)) * uMouseStrength * 0.3;
          
          vec3 deformedPosition = position;
          deformedPosition.y += deformation + globalWave * 0.5;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(deformedPosition, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uGridColor;
        uniform vec3 uBaseColor;
        uniform float uGridWidth;
        uniform float uGridScale;
        
        varying vec3 vPosition;
        varying vec2 vUv;
        
        float grid(vec2 coord, float lineWidth) {
          vec2 grid = abs(fract(coord - 0.5) - 0.5);
          float line = min(grid.x, grid.y);
          return 1.0 - smoothstep(0.0, lineWidth, line);
        }
        
        void main() {
          vec2 coord = vPosition.xz * uGridScale;
          float lineWidth = 0.03 * uGridWidth;
          
          float distanceFromCenter = length(vPosition.xz);
          float fadeOutFactor = smoothstep(40.0, 90.0, distanceFromCenter);
          
          float gridPattern = grid(coord, lineWidth);
          
          gridPattern = pow(gridPattern, 0.8);
          
          vec3 color = mix(uBaseColor, uGridColor, gridPattern);
          
          color = mix(color, uBaseColor, fadeOutFactor);
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0, 0);
    
    console.log("Grid material:", material);
    console.log("Grid mesh:", mesh);
    
    return mesh;
  };
  
  const setupMouseEvents = () => {
    if (!containerRef.current) return;
    
    const onMouseMove = (event: MouseEvent) => {
      const rect = containerRef.current!.getBoundingClientRect();
      mousePosition.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mousePosition.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      updateMousePosition();
    };
    
    //TODO : reset mouse position when mouse leaves the grid
    const onMouseLeave = () => {
      // Reset mouse position when mouse leaves the container
      if (gridPlaneRef.current && gridPlaneRef.current.material instanceof THREE.ShaderMaterial) {
        gridPlaneRef.current.material.uniforms.uMouseStrength.value = 0;
      }
    };
    
    const onMouseEnter = () => {
      if (gridPlaneRef.current && gridPlaneRef.current.material instanceof THREE.ShaderMaterial) {
        gridPlaneRef.current.material.uniforms.uMouseStrength.value = config.wave.mouseStrength;
      }
    };
    
    containerRef.current.addEventListener('mousemove', onMouseMove);
    containerRef.current.addEventListener('mouseleave', onMouseLeave);
    containerRef.current.addEventListener('mouseenter', onMouseEnter);
    
    return () => {
      containerRef.current?.removeEventListener('mousemove', onMouseMove);
      containerRef.current?.removeEventListener('mouseleave', onMouseLeave);
      containerRef.current?.removeEventListener('mouseenter', onMouseEnter);
    };
  };
  
  const updateMousePosition = () => {
    if (!sceneContextRef.current || !gridPlaneRef.current) return;
    
    const { camera } = sceneContextRef.current;
    
    raycaster.current.setFromCamera(mousePosition.current, camera);
    
    const intersects = raycaster.current.intersectObject(gridPlaneRef.current);
    
    if (intersects.length > 0 && 
        gridPlaneRef.current.material instanceof THREE.ShaderMaterial) {
      const point = intersects[0].point;
      gridPlaneRef.current.material.uniforms.uMousePosition.value.set(point.x, point.z);
    }
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