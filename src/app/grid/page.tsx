"use client";

import React, { useState } from "react";
import Link from "next/link";
import { GridConfig as initialGridConfig } from '../../components/three/GridConfig';
import GridComponent from '../../components/three/GridComponent';
import GridControls from "../../components/three/GridControls";
import GridPreview from "../../components/three/GridPreview";

export default function GridPage() {
  const [gridConfig, setGridConfig] = useState(initialGridConfig);
  const [showPreview, setShowPreview] = useState(true);
  
  const handleConfigChange = (newConfig: typeof initialGridConfig) => {
    setGridConfig(newConfig);
  };
  
  return (
    <main className="relative w-full h-screen overflow-hidden">
      <div className="fixed top-4 right-4 z-10">
        <Link 
          href="/" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md inline-block"
        >
          Back
        </Link>
      </div>
      
      <GridControls 
        onConfigChange={handleConfigChange}
        initialConfig={gridConfig}
      />
      
      <GridComponent config={gridConfig} />
      
      <GridPreview active={showPreview} />
      
      <div className="fixed bottom-4 left-4 z-10 text-white bg-black bg-opacity-50 p-4 rounded flex flex-col gap-2">
        <button 
          onClick={() => setShowPreview(!showPreview)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded-md text-sm"
        >
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </button>
      </div>
    </main>
  );
}