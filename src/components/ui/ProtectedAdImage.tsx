import { useRef, useEffect } from 'react';

// Renders an ad image on a <canvas> so no src= URL is exposed in the DOM.
// Right-click "Save Image As" doesn't work on canvas elements.
export function ProtectedAdImage({ src }: { src: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const img = new Image();
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d')?.drawImage(img, 0, 0);
    };
    img.src = src;
  }, [src]);
  return (
    <canvas
      ref={canvasRef}
      onContextMenu={e => e.preventDefault()}
      style={{ width: '100%', height: 'auto', display: 'block' }}
    />
  );
}
