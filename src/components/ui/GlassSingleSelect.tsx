import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

interface GlassSingleSelectProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function GlassSingleSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  className = '',
}: GlassSingleSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full h-10 px-3 rounded-xl border border-white/40 bg-white/30 backdrop-blur-md text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#00A86B]/30 focus:border-[#00A86B]/50 font-semibold flex items-center justify-between shadow-[0_4px_12px_rgba(0,0,0,0.02)] transition-all hover:bg-white/50"
        type="button"
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white/70 backdrop-blur-2xl border border-white/50 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] overflow-hidden z-[120] animate-in fade-in zoom-in-95 duration-200">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 pointer-events-none" />
          <div className="max-h-60 overflow-y-auto py-1 relative z-10">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center justify-between transition-colors ${
                    isSelected 
                      ? 'text-[#00A86B] bg-[#00A86B]/10' 
                      : 'text-slate-700 hover:bg-white/60'
                  }`}
                  type="button"
                >
                  <div className="flex items-center gap-2">
                    {option.icon && <span>{option.icon}</span>}
                    {option.label}
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
