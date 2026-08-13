import React from 'react';

interface AuraRobotCanvasProps {
  RiveComponent: React.ComponentType<any>;
  glowColor: string;
  size?: number;
  className?: string;
}

export const AuraRobotCanvas: React.FC<AuraRobotCanvasProps> = ({
  RiveComponent,
  glowColor,
  size = 280,
  className = '',
}) => {
  return (
    <div
      className={`relative flex items-center justify-center transition-all duration-300 ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      {/* Dynamic Aura Glow Soft Background (Clean Gradient, No Outer Line Borders) */}
      <div
        className="absolute inset-2 rounded-full transition-all duration-500 opacity-40 blur-2xl pointer-events-none"
        style={{
          backgroundColor: glowColor,
        }}
      />

      {/* Rive Robot Canvas Core - 100% Transparent Container */}
      <div className="relative z-10 w-full h-full bg-transparent overflow-hidden">
        {RiveComponent ? (
          <RiveComponent className="w-full h-full bg-transparent" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
            Loading Aura Robot...
          </div>
        )}
      </div>
    </div>
  );
};
