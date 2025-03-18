
export const GridConfig = {
    grid: {
      size: 30,
      subdivisions: 100,
      color: '#4080ff',
      baseColor: '#000010',
      width: 1.0,
      fadeDistance: {
        start: 20,
        end: 40
      }
    },
    
    wave: {
      mouseRadius: 10.0,
      mouseStrength: 1.5,
      speed: 5.0,
      globalNoiseScale: 0.05,
      globalNoiseStrength: 0.5
    },
    
    infiniteGrid: {
      enabled: false,
      size1: 10,
      size2: 100,
      color: '#4080ff',
      distance: 8000
    },

    camera: {
      position: { x: 0, y: 0, z: 10 },
      lookAt: { x: 0, y: 0, z: 0 },
      fov: 60,
      near: 0.1,
      far: 1000
    }
  };