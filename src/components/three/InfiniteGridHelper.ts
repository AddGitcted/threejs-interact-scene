import * as THREE from 'three';

export class InfiniteGridHelper extends THREE.Mesh {
  constructor(
    size1: number = 10,
    size2: number = 100,
    color: THREE.Color = new THREE.Color('white'),
    distance: number = 8000,
    axes: string = 'xzy'
  ) {
    const planeAxes = axes.substring(0, 2);
    
    const geometry = new THREE.PlaneGeometry(2, 2, 1, 1);
    const material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      transparent: true,
      uniforms: {
        uSize1: { value: size1 },
        uSize2: { value: size2 },
        uColor: { value: color },
        uDistance: { value: distance },
        uCameraPosition: { value: new THREE.Vector3() }
      },
      vertexShader: `
        varying vec3 worldPosition;
        uniform float uDistance;
        
        void main() {
          vec3 pos = position.${axes} * uDistance;
          pos.${planeAxes} += cameraPosition.${planeAxes};
          worldPosition = pos;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 worldPosition;
        uniform float uSize1;
        uniform float uSize2;
        uniform vec3 uColor;
        uniform float uDistance;
        uniform vec3 uCameraPosition;

        float getGrid(float size) {
          vec2 r = worldPosition.${planeAxes} / size;
          vec2 grid = abs(fract(r - 0.5) - 0.5) / fwidth(r);
          float line = min(grid.x, grid.y);
          return 1.0 - min(line, 1.0);
        }

        void main() {
          float distanceFromCamera = length(worldPosition.${planeAxes} - uCameraPosition.${planeAxes});
          float d = 1.0 - clamp(distanceFromCamera / uDistance, 0.0, 1.0);
          float fadeFactor = pow(d, 3.0);

          float g1 = getGrid(uSize1);
          float g2 = getGrid(uSize2);
          
          vec3 color = uColor.rgb;
          float alpha = mix(g2, g1, g1) * fadeFactor;
          
          gl_FragColor = vec4(color, alpha);
          if (gl_FragColor.a <= 0.0) discard;
        }
      `,
      defines: {
        USE_UV: ""
      },
      extensions: {
        derivatives: true
      } as { [key: string]: boolean }
    });

    super(geometry, material);
    this.frustumCulled = false;
  }

  updateCameraPosition(camera: THREE.Camera) {
    (this.material as THREE.ShaderMaterial).uniforms.uCameraPosition.value.copy(camera.position);
  }
}