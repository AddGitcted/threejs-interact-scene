"use client";

import React, { useEffect, useRef } from 'react';

interface GridPreviewProps {
  active: boolean;
}

export default function GridPreview({ active }: GridPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePosition = useRef<{ x: number, y: number }>({ x: 0, y: 0 });
  const isAnimating = useRef<boolean>(false);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const updateCanvasSize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mousePosition.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      
      if (!isAnimating.current) {
        isAnimating.current = true;
        animate();
      }
    };
    
    const animate = () => {
      if (!active) {
        isAnimating.current = false;
        return;
      }
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const gridSize = 20;
      const now = Date.now();
      const waveSpeed = 0.1;
      const maxWaveRadius = Math.max(canvas.width, canvas.height) * 0.5;
      
      ctx.strokeStyle = 'rgba(64, 128, 255, 0.3)';
      ctx.lineWidth = 1;
      
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        
        for (let y = 0; y < canvas.height; y += 2) {
          const dx = x - mousePosition.current.x;
          const dy = y - mousePosition.current.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          const offset = Math.sin(distance * waveSpeed - now * 0.005) * 
                         Math.exp(-distance / (maxWaveRadius * 0.5)) * 
                         10;
          
          ctx.lineTo(x + offset, y);
        }
        
        ctx.stroke();
      }
      
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        
        for (let x = 0; x < canvas.width; x += 2) {
          const dx = x - mousePosition.current.x;
          const dy = y - mousePosition.current.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          const offset = Math.sin(distance * waveSpeed - now * 0.005) * 
                        Math.exp(-distance / (maxWaveRadius * 0.5)) * 
                        10;
          
          ctx.lineTo(x, y + offset);
        }
        
        ctx.stroke();
      }
      
      ctx.beginPath();
      ctx.arc(mousePosition.current.x, mousePosition.current.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(64, 128, 255, 0.6)';
      ctx.fill();
      
      requestAnimationFrame(animate);
    };
    
    canvas.addEventListener('mousemove', handleMouseMove);
    
    if (active && !isAnimating.current) {
      isAnimating.current = true;
      animate();
    }
    
    mousePosition.current = {
      x: canvas.width / 2,
      y: canvas.height / 2
    };
    
    if (active && !isAnimating.current) {
      isAnimating.current = true;
      animate();
    }
    
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      isAnimating.current = false;
    };
  }, [active]);
  
  if (!active) return null;
  
  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 right-0 w-64 h-64 bg-black bg-opacity-25 border border-gray-500 rounded-lg m-4 z-20"
      style={{ top: '130px' }}
    />
  );
}