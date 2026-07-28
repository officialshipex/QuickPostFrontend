import { useEffect, useRef, useState } from 'react';

interface TruncatedTextProps {
  text: string;
  maxLength: number;
  className?: string;
  tooltipClassName?: string;
  /** Which side of the container the tooltip aligns to. Use 'right' when the element sits near the right edge of a table so the tooltip doesn't bleed into the next column. */
  tooltipAlign?: 'left' | 'right';
}

export function TruncatedText({ text, maxLength, className = '', tooltipClassName = '', tooltipAlign = 'left' }: TruncatedTextProps) {
  const [tapOpen, setTapOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Hover doesn't fire on touch devices, so tapping toggles the tooltip there too.
  // Any tap outside closes it.
  useEffect(() => {
    if (!tapOpen) return;
    const handleOutside = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setTapOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleOutside);
    return () => document.removeEventListener('pointerdown', handleOutside);
  }, [tapOpen]);

  if (!text || text.length <= maxLength) {
    return <div className={`truncate ${className}`}>{text}</div>;
  }

  const truncated = text.slice(0, maxLength) + '...';

  return (
    <div
      ref={containerRef}
      className={`relative group/tooltip w-max ${className}`}
      onClick={(e) => { e.stopPropagation(); setTapOpen(v => !v); }}
    >
      <div className="truncate cursor-default">{truncated}</div>
      <div className={`absolute ${tooltipAlign === 'right' ? 'right-0' : 'left-0'} bottom-full mb-2 transition-all duration-200 z-[60] ${
        tapOpen
          ? 'opacity-100 visible translate-y-0'
          : 'opacity-0 invisible translate-y-1 group-hover/tooltip:opacity-100 group-hover/tooltip:visible group-hover/tooltip:translate-y-0'
      }`}>
        <div className={`bg-slate-800 text-white text-[11px] font-normal tracking-normal py-1.5 px-3 rounded-md shadow-xl whitespace-nowrap ${tooltipClassName}`}>
          {text}
        </div>
        <div className={`w-2.5 h-2.5 bg-slate-800 rotate-45 absolute -bottom-1 ${tooltipAlign === 'right' ? 'right-4' : 'left-4'}`}></div>
      </div>
    </div>
  );
}
