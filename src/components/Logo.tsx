import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function Logo({ className, size = 'md', showText = true }: LogoProps) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Adinkra-inspired logo symbol */}
      <div
        className={cn(
          'relative flex items-center justify-center rounded-xl gradient-primary shadow-glow',
          sizes[size]
        )}
      >
        <svg
          viewBox="0 0 40 40"
          className="w-3/4 h-3/4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Nkyinkyim symbol - representing initiative and dynamism */}
          <path
            d="M8 20 C8 12, 16 12, 16 20 C16 28, 24 28, 24 20 C24 12, 32 12, 32 20"
            className="text-primary-foreground"
          />
          <circle cx="8" cy="20" r="2" className="fill-current text-primary-foreground" />
          <circle cx="32" cy="20" r="2" className="fill-current text-primary-foreground" />
        </svg>
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={cn('font-display font-bold text-foreground leading-tight', textSizes[size])}>
            Nkyinkyim
          </span>
          <span className="text-xs font-medium text-muted-foreground tracking-wider uppercase">
            Museum Clock-In
          </span>
        </div>
      )}
    </div>
  );
}
