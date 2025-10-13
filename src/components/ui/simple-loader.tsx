import React from 'react';

interface SimpleLoaderProps {
  size?: number;
  className?: string;
}

export function SimpleLoader({ size = 200, className = '' }: SimpleLoaderProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div 
        className="animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"
        style={{
          width: size,
          height: size,
        }}
      />
    </div>
  );
}

// Full screen loading component
export function FullScreenSimpleLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <SimpleLoader size={300} />
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground">Loading...</h2>
          <p className="text-sm text-muted-foreground">Please wait while we prepare your dashboard</p>
        </div>
      </div>
    </div>
  );
}

// Compact loading component for smaller spaces
export function CompactSimpleLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <SimpleLoader size={120} />
    </div>
  );
}
