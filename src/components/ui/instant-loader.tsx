import React from 'react';

interface InstantLoaderProps {
  size?: number;
  className?: string;
}

export function InstantLoader({ size = 200, className = '' }: InstantLoaderProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div 
        className="rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin"
        style={{
          width: size,
          height: size,
        }}
      />
    </div>
  );
}

// Full screen loading component with instant display
export function FullScreenInstantLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <InstantLoader size={120} />
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground">Loading...</h2>
          <p className="text-sm text-muted-foreground">Please wait while we prepare your dashboard</p>
        </div>
      </div>
    </div>
  );
}

// Compact loading component for smaller spaces
export function CompactInstantLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <InstantLoader size={40} />
    </div>
  );
}
