import React from 'react';

export function TableLoader() {
  return (
    <div className="absolute inset-0 z-30 bg-white/60 backdrop-blur-[2px] flex items-center justify-center transition-all duration-300">
      <div className="relative w-16 h-16">
        {/* Outer rotating ring */}
        <div 
          className="absolute inset-0 rounded-full border-[3px] border-transparent"
          style={{
            borderTopColor: '#00A86B',
            borderRightColor: '#00A86B',
            animation: 'spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite',
          }}
        />
        {/* Middle counter-rotating ring */}
        <div 
          className="absolute inset-[5px] rounded-full border-[3px] border-transparent"
          style={{
            borderBottomColor: '#00A86B',
            borderLeftColor: '#00A86B',
            opacity: 0.5,
            animation: 'spin 0.8s cubic-bezier(0.5, 0, 0.5, 1) infinite reverse',
          }}
        />
        {/* Inner pulsing icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src="/icon-color.png"
            alt="icon"
            className="w-6 h-6 object-contain"
            style={{ animation: 'pulse 1.2s ease-in-out infinite' }}
          />
        </div>
      </div>
    </div>
  );
}
