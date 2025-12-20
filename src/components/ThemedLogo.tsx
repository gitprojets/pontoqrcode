import logoMain from '@/assets/logo-main.png';

interface ThemedLogoProps {
  className?: string;
  alt?: string;
}

export function ThemedLogo({ className = '', alt = 'FrequênciaQR' }: ThemedLogoProps) {
  return (
    <img 
      src={logoMain} 
      alt={alt} 
      className={className}
    />
  );
}
