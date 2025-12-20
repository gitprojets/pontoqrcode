import { memo } from 'react';

interface SparkleParticlesProps {
  count?: number;
}

function SparkleParticlesComponent({ count = 20 }: SparkleParticlesProps) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Static gradient orbs */}
      <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white/10 blur-3xl animate-pulse" />
      <div 
        className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-white/5 blur-3xl animate-pulse" 
        style={{ animationDelay: '1s' }} 
      />
      <div 
        className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-white/5 blur-2xl animate-pulse" 
        style={{ animationDelay: '0.5s' }} 
      />
      
      {/* Sparkle particles */}
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="sparkle-particle"
          style={{
            '--delay': `${Math.random() * 5}s`,
            '--duration': `${3 + Math.random() * 4}s`,
            '--x-start': `${Math.random() * 100}%`,
            '--x-end': `${Math.random() * 100}%`,
            '--y-start': `${Math.random() * 100}%`,
            '--size': `${2 + Math.random() * 4}px`,
            '--opacity': `${0.3 + Math.random() * 0.7}`,
          } as React.CSSProperties}
        />
      ))}
      
      <style>{`
        .sparkle-particle {
          position: absolute;
          width: var(--size);
          height: var(--size);
          background: radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 70%);
          border-radius: 50%;
          left: var(--x-start);
          top: var(--y-start);
          opacity: 0;
          animation: sparkle var(--duration) var(--delay) infinite ease-in-out;
          box-shadow: 0 0 6px 2px rgba(255,255,255,0.3);
        }
        
        @keyframes sparkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0) translateY(0);
          }
          10% {
            opacity: var(--opacity);
            transform: scale(1) translateY(0);
          }
          50% {
            opacity: var(--opacity);
            transform: scale(1.2) translateY(-20px);
          }
          90% {
            opacity: var(--opacity);
            transform: scale(1) translateY(-40px);
          }
        }
      `}</style>
    </div>
  );
}

// Memoize to prevent re-renders
export const SparkleParticles = memo(SparkleParticlesComponent);