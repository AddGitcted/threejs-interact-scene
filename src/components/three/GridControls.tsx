"use client";

import React, { useState } from 'react';
import { GridConfig } from './GridConfig';

interface GridControlsProps {
  onConfigChange: (newConfig: any) => void;
  initialConfig?: typeof GridConfig;
}

export default function GridControls({ onConfigChange, initialConfig = GridConfig }: GridControlsProps) {
  const [config, setConfig] = useState(initialConfig);
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (section: string, property: string, value: any) => {
    const newConfig = {
      ...config,
      [section]: {
        ...config[section as keyof typeof config],
        [property]: value
      }
    };
    
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  return (
    <div className="fixed top-4 left-4 z-10">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
      >
        {isOpen ? 'Hide Controls' : 'Show Controls'}
      </button>
      
      {isOpen && (
        <div className="mt-2 p-4 bg-gray-800 bg-opacity-80 text-white rounded-md max-h-[80vh] overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">Grid Settings</h2>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Grid Appearance</h3>
            
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                Grid Color:
                <input
                  type="color"
                  value={config.grid.color}
                  onChange={(e) => handleChange('grid', 'color', e.target.value)}
                  className="mt-1 block w-full rounded"
                />
              </label>
              
              <label className="block">
                Base Color:
                <input
                  type="color"
                  value={config.grid.baseColor}
                  onChange={(e) => handleChange('grid', 'baseColor', e.target.value)}
                  className="mt-1 block w-full rounded"
                />
              </label>
              
              <label className="block">
                Grid Width:
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.1"
                  value={config.grid.width}
                  onChange={(e) => handleChange('grid', 'width', parseFloat(e.target.value))}
                  className="mt-1 block w-full"
                />
                {config.grid.width.toFixed(1)}
              </label>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Wave Effects</h3>
            
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                Mouse Radius:
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="0.5"
                  value={config.wave.mouseRadius}
                  onChange={(e) => handleChange('wave', 'mouseRadius', parseFloat(e.target.value))}
                  className="mt-1 block w-full"
                />
                {config.wave.mouseRadius.toFixed(1)}
              </label>
              
              <label className="block">
                Wave Strength:
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={config.wave.mouseStrength}
                  onChange={(e) => handleChange('wave', 'mouseStrength', parseFloat(e.target.value))}
                  className="mt-1 block w-full"
                />
                {config.wave.mouseStrength.toFixed(1)}
              </label>
              
              <label className="block">
                Wave Speed:
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={config.wave.speed}
                  onChange={(e) => handleChange('wave', 'speed', parseFloat(e.target.value))}
                  className="mt-1 block w-full"
                />
                {config.wave.speed.toFixed(1)}
              </label>
            </div>
          </div>
          
          <button
            onClick={() => {
              setConfig(GridConfig);
              onConfigChange(GridConfig);
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
          >
            Reset to Defaults
          </button>
        </div>
      )}
    </div>
  );
}