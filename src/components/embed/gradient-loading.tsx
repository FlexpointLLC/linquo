"use client";
import { useSearchParams } from 'next/navigation';

export function GradientLoadingFallback() {
  const searchParams = useSearchParams();
  const colorParam = searchParams.get('color');
  
  // Use the color from URL parameter, fallback to white
  const gradientColor = colorParam || '#ffffff';
  
  return (
    <div 
      className="h-full w-full"
      style={{
        background: `linear-gradient(to bottom, ${gradientColor} 0%, white 100%)`
      }}
    />
  )
}
