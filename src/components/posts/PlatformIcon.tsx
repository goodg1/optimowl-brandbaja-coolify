import { PlatformType } from '@/types/database';
import { cn } from '@/lib/utils';

interface PlatformIconProps {
  platform: PlatformType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const platformConfig: Record<PlatformType, { label: string; color: string; icon: string }> = {
  facebook: { label: 'Facebook', color: 'bg-facebook', icon: 'f' },
  instagram: { label: 'Instagram', color: 'bg-instagram', icon: 'IG' },
  threads: { label: 'Threads', color: 'bg-threads', icon: '@' },
  linkedin: { label: 'LinkedIn', color: 'bg-linkedin', icon: 'in' },
  google_business: { label: 'Google', color: 'bg-google', icon: 'G' },
  x: { label: 'X', color: 'bg-foreground', icon: '𝕏' },
};

const sizeClasses = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
};

export function PlatformIcon({ platform, size = 'md', className }: PlatformIconProps) {
  const config = platformConfig[platform];
  
  return (
    <div 
      className={cn(
        'flex items-center justify-center rounded-lg text-white font-bold',
        config.color,
        sizeClasses[size],
        className
      )}
      title={config.label}
    >
      {config.icon}
    </div>
  );
}