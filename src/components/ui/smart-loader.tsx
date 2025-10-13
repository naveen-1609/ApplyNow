import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface SmartLoaderProps {
  size?: number;
  className?: string;
}

export function SmartLoader({ size = 200, className = '' }: SmartLoaderProps) {
  const [showLottie, setShowLottie] = React.useState(true);
  const [lottieLoaded, setLottieLoaded] = React.useState(false);

  // Fallback to simple spinner if Lottie doesn't load within 1.5 seconds
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (!lottieLoaded) {
        console.log('Lottie taking too long, showing fallback spinner');
        setShowLottie(false);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [lottieLoaded]);

  // Simple CSS spinner fallback
  const SimpleSpinner = () => (
    <div 
      className="animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"
      style={{
        width: size,
        height: size,
      }}
    />
  );

  if (!showLottie) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <SimpleSpinner />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <DotLottieReact
        src="/world-animation.lottie"
        loop
        autoplay
        style={{
          width: size,
          height: size,
        }}
        onLoad={() => {
          console.log('Lottie loaded successfully!');
          setLottieLoaded(true);
        }}
        onError={(error) => {
          console.error('Lottie failed to load:', error);
          setShowLottie(false);
        }}
      />
    </div>
  );
}

// Full screen loading component
export function FullScreenSmartLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <SmartLoader size={300} />
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground">Loading...</h2>
          <p className="text-sm text-muted-foreground">Please wait while we prepare your dashboard</p>
        </div>
      </div>
    </div>
  );
}

// Compact loading component for smaller spaces
export function CompactSmartLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <SmartLoader size={120} />
    </div>
  );
}
