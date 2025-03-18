
export const GridConfig = {
    grid: {
      size: 100,
      subdivisions: 100,
      color: '#4080ff',
      baseColor: '#000010',
      width: 1.0, // thickness of grid lines
      fadeDistance: {
        start: 40,
        end: 90
      }
    },
    
    wave: {
      mouseRadius: 10.0,
      mouseStrength: 1.5,
      speed: 5.0,
      globalNoiseScale: 0.05,
      globalNoiseStrength: 0.5
    },
    
    camera: {
      position: { x: 0, y: 15, z: 20 },
      lookAt: { x: 0, y: 0, z: 0 },
      fov: 60,
      near: 0.1,
      far: 1000
    }
  };