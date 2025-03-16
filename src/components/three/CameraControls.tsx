"use client";
 
import React, { useState, useEffect } from 'react';

interface CameraControlsProps {
  sceneRef: React.MutableRefObject<any>;
}

const CameraControls: React.FC<CameraControlsProps> = ({ sceneRef }) => {
  const [cameraPosition, setCameraPosition] = useState({
    x: -4.40, y: -10.300, z: -87.50
  });
  const [cameraRotation, setCameraRotation] = useState({
    x: 0, y: -180, z: 0
  });

  const updateCamera = () => {
    if (!sceneRef.current || !sceneRef.current.camera) return;
    
    sceneRef.current.camera.position.set(
      cameraPosition.x,
      cameraPosition.y,
      cameraPosition.z
    );
    
    const degToRad = Math.PI / 180;
    const rotX = cameraRotation.x * degToRad;
    const rotY = cameraRotation.y * degToRad;
    const rotZ = cameraRotation.z * degToRad;
    
    sceneRef.current.camera.rotation.order = 'XYZ';
    sceneRef.current.camera.rotation.set(rotX, rotY, rotZ);
    
    console.log("Camera position:", cameraPosition);
    console.log("Camera rotation (degrees):", cameraRotation);
    console.log("Camera rotation (radians):", { x: rotX, y: rotY, z: rotZ });
  };

  useEffect(() => {
    updateCamera();
  }, [cameraPosition, cameraRotation]);

  useEffect(() => {
    const timer = setTimeout(() => {
      updateCamera();
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const applyConversionSystem = (system: string) => {
    switch(system) {
      case 'direct':
        updateCamera();
        break;
      case 'blender-to-three':
        setCameraPosition({
          x: cameraPosition.x,
          y: cameraPosition.z,
          z: -cameraPosition.y
        });
        setCameraRotation({
          x: cameraRotation.x - 90,
          y: -cameraRotation.z,
          z: cameraRotation.y
        });
        break;
      case 'reset':
        setCameraPosition({ x: 23.6, y: 22.7, z: 2.98 });
        setCameraRotation({ x: 81, y: -2.3, z: 144 });
        break;
    }
  };

  return (
    <div className="fixed top-4 right-4 z-10 bg-black bg-opacity-70 text-white p-4 rounded max-h-[90vh] overflow-y-auto" style={{ width: '320px' }}>
      <h3 className="font-bold mb-3 text-lg">Contrôles de caméra</h3>
      
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-medium mb-2">Position</h4>
          
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs">X</label>
              <span className="text-xs bg-gray-800 px-2 py-1 rounded">{cameraPosition.x.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="-200"
              max="50"
              step="0.1"
              value={cameraPosition.x}
              onChange={(e) => setCameraPosition({
                ...cameraPosition,
                x: parseFloat(e.target.value)
              })}
              className="w-full accent-blue-500"
            />
          </div>
          
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs">Y</label>
              <span className="text-xs bg-gray-800 px-2 py-1 rounded">{cameraPosition.y.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="-200"
              max="50"
              step="0.1"
              value={cameraPosition.y}
              onChange={(e) => setCameraPosition({
                ...cameraPosition,
                y: parseFloat(e.target.value)
              })}
              className="w-full accent-blue-500"
            />
          </div>
          
          <div className="mb-1">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs">Z</label>
              <span className="text-xs bg-gray-800 px-2 py-1 rounded">{cameraPosition.z.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="-200"
              max="50"
              step="0.1"
              value={cameraPosition.z}
              onChange={(e) => setCameraPosition({
                ...cameraPosition,
                z: parseFloat(e.target.value)
              })}
              className="w-full accent-blue-500"
            />
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium mb-2">Rotation (degrés)</h4>
          
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs">X</label>
              <span className="text-xs bg-gray-800 px-2 py-1 rounded">{cameraRotation.x.toFixed(1)}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              step="1"
              value={cameraRotation.x}
              onChange={(e) => setCameraRotation({
                ...cameraRotation,
                x: parseFloat(e.target.value)
              })}
              className="w-full accent-green-500"
            />
          </div>
          
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs">Y</label>
              <span className="text-xs bg-gray-800 px-2 py-1 rounded">{cameraRotation.y.toFixed(1)}°</span>
            </div>
            <input
              type="range"
              min="-180"
              max="180"
              step="1"
              value={cameraRotation.y}
              onChange={(e) => setCameraRotation({
                ...cameraRotation,
                y: parseFloat(e.target.value)
              })}
              className="w-full accent-green-500"
            />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs">Z</label>
              <span className="text-xs bg-gray-800 px-2 py-1 rounded">{cameraRotation.z.toFixed(1)}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              step="1"
              value={cameraRotation.z}
              onChange={(e) => setCameraRotation({
                ...cameraRotation,
                z: parseFloat(e.target.value)
              })}
              className="w-full accent-green-500"
            />
          </div>
        </div>
        
        <div className="space-y-2 pt-2">
          <h4 className="text-sm font-medium mb-1">Systèmes de conversion</h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => applyConversionSystem('blender-to-three')}
              className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-sm"
            >
              Convertir Blender → Three.js
            </button>
            <button
              onClick={() => applyConversionSystem('reset')}
              className="bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded text-sm"
            >
              Réinitialiser
            </button>
          </div>
          
          <button
            onClick={() => {
              const positionCode = `camera.position.set(${cameraPosition.x.toFixed(2)}, ${cameraPosition.y.toFixed(2)}, ${cameraPosition.z.toFixed(2)});`;
              const rotXRad = (cameraRotation.x * Math.PI/180).toFixed(4);
              const rotYRad = (cameraRotation.y * Math.PI/180).toFixed(4);
              const rotZRad = (cameraRotation.z * Math.PI/180).toFixed(4);
              const rotationCode = `camera.rotation.set(${rotXRad}, ${rotYRad}, ${rotZRad});`;
              
              console.log("Code pour positionner la caméra:");
              console.log(positionCode);
              console.log("camera.rotation.order = 'XYZ';");
              console.log(rotationCode);
              
            }}
            className="w-full bg-green-600 hover:bg-green-700 px-2 py-2 rounded mt-2 text-sm"
          >
            Générer code dans la console
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraControls;