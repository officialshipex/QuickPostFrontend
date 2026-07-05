import React from 'react';

interface TruncatedTextProps {
  text: string;
  maxLength: number;
  className?: string;
  tooltipClassName?: string;
}

export function TruncatedText({ text, maxLength, className = '', tooltipClassName = '' }: TruncatedTextProps) {
  if (!text || text.length <= maxLength) {
    return <div className={`truncate ${className}`}>{text}</div>;
  }

  const truncated = text.slice(0, maxLength) + '...';
  
  return (
    <div className={`relative group/tooltip w-max ${className}`}>
      <div className="truncate cursor-default">{truncated}</div>
      <div className="absolute left-0 bottom-full mb-2 opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible translate-y-1 group-hover/tooltip:translate-y-0 transition-all duration-200 z-[60]">
        <div className={`bg-slate-800 text-white text-[11px] font-normal tracking-normal py-1.5 px-3 rounded-md shadow-xl whitespace-nowrap ${tooltipClassName}`}>
          {text}
        </div>
        <div className="w-2.5 h-2.5 bg-slate-800 rotate-45 absolute -bottom-1 left-4"></div>
      </div>
    </div>
  );
}
