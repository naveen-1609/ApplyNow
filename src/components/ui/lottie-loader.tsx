import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface LottieLoaderProps {
  size?: number;
  className?: string;
  onError?: () => void;
}

export function LottieLoader({ size = 200, className = '', onError }: LottieLoaderProps) {
  const [hasError, setHasError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  // Timeout to show fallback if Lottie takes too long to load
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        console.warn('Lottie animation taking too long to load, showing fallback');
        setHasError(true);
      }
    }, 3000); // 3 second timeout

    return () => clearTimeout(timer);
  }, [isLoading]);

  // Fallback component if Lottie fails to load or times out
  if (hasError) {
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
          console.log('Lottie animation loaded successfully');
          setIsLoading(false);
        }}
        onError={(error) => {
          console.error('Lottie animation failed to load:', error);
          setHasError(true);
          onError?.();
        }}
      />
    </div>
  );
}

// Full screen loading component
export function FullScreenLottieLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <LottieLoader size={300} />
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground">Loading...</h2>
          <p className="text-sm text-muted-foreground">Please wait while we prepare your dashboard</p>
        </div>
      </div>
    </div>
  );
}

// Compact loading component for smaller spaces
export function CompactLottieLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <LottieLoader size={120} />
    </div>
  );
}
