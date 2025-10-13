import React from 'react';
import { LottieLoader } from './lottie-loader';
import { SimpleLoader } from './simple-loader';

interface HybridLoaderProps {
  size?: number;
  className?: string;
  preferLottie?: boolean;
}

export function HybridLoader({ size = 200, className = '', preferLottie = true }: HybridLoaderProps) {
  const [useLottie, setUseLottie] = React.useState(preferLottie);
  const [lottieError, setLottieError] = React.useState(false);

  // If Lottie fails, switch to simple loader
  React.useEffect(() => {
    if (lottieError) {
      console.log('Switching to simple loader due to Lottie error');
      setUseLottie(false);
    }
  }, [lottieError]);

  // Try Lottie first, but have a timeout fallback
  React.useEffect(() => {
    if (useLottie) {
      const timer = setTimeout(() => {
        if (useLottie) {
          console.log('Lottie timeout, switching to simple loader');
          setUseLottie(false);
        }
      }, 2000); // 2 second timeout

      return () => clearTimeout(timer);
    }
  }, [useLottie]);

  if (useLottie && !lottieError) {
    return (
      <LottieLoader 
        size={size} 
        className={className}
        onError={() => setLottieError(true)}
      />
    );
  }

  return <SimpleLoader size={size} className={className} />;
}

// Full screen loading component
export function FullScreenHybridLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <HybridLoader size={300} />
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground">Loading...</h2>
          <p className="text-sm text-muted-foreground">Please wait while we prepare your dashboard</p>
        </div>
      </div>
    </div>
  );
}

// Compact loading component for smaller spaces
export function CompactHybridLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <HybridLoader size={120} />
    </div>
  );
}
