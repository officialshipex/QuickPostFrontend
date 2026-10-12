import { useRef, useEffect } from 'react';

// Renders an ad image on a <canvas> so no src= URL is exposed in the DOM.
// Right-click "Save Image As" doesn't work on canvas elements.
// Optional `aspect` (width / height) crops the image to a slimmer frame; `position` picks the
// focal point (CSS object-position), e.g. 'center 60%'.
export function ProtectedAdImage({ src, aspect, position = 'center' }: { src: string; aspect?: number; position?: string }) {
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
      style={aspect
        ? { width: '100%', aspectRatio: String(aspect), objectFit: 'cover', objectPosition: position, display: 'block' }
        : { width: '100%', height: 'auto', display: 'block' }}
    />
  );
}
