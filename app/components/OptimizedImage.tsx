import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { handleImageError, getValidImageUrl, optimizeCloudinaryUrl, PLACEHOLDER_IMAGE } from '@/lib/imageUtils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  onClick?: () => void;
  sizes?: string;
  fill?: boolean;
  quality?: number;
  fallbackToProxy?: boolean;
}

export default function OptimizedImage({ 
  src, 
  alt, 
  width = 400, 
  height = 400, 
  className = '', 
  priority = false,
  onClick,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  fill = false,
  quality = 80,
  fallbackToProxy = true
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [currentSrc, setCurrentSrc] = useState(getValidImageUrl(src));
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    const failedSrc = target.src;
    
    console.warn(`OptimizedImage failed to load (attempt ${retryCount + 1}): ${failedSrc}`);
    
    // Prevent infinite retry loop
    if (retryCount >= 2) {
      console.log('Max retries reached, showing error state');
      setIsLoading(false);
      setHasError(true);
      return;
    }
    
    // Try our image proxy for Cloudinary images
    if (fallbackToProxy && failedSrc.includes('cloudinary.com') && !failedSrc.includes('/api/image-proxy')) {
      const proxyParams = new URLSearchParams();
      proxyParams.set('url', src);
      if (width) proxyParams.set('w', width.toString());
      proxyParams.set('q', quality.toString());
      
      const proxyUrl = `/api/image-proxy?${proxyParams.toString()}`;
      console.log(`Trying image proxy: ${proxyUrl}`);
      
      setCurrentSrc(proxyUrl);
      setRetryCount(prev => prev + 1);
      return;
    }
    
    // Try direct Cloudinary optimization
    if (failedSrc.includes('cloudinary.com') && retryCount === 0) {
      const optimizedUrl = optimizeCloudinaryUrl(src, {
        width: width || 800,
        quality,
        format: 'webp',
        fallback: true
      });
      
      if (optimizedUrl !== failedSrc) {
        console.log(`Trying optimized Cloudinary URL: ${optimizedUrl}`);
        setCurrentSrc(optimizedUrl);
        setRetryCount(prev => prev + 1);
        return;
      }
    }
    
    // Final fallback
    console.log('Using placeholder as final fallback');
    setCurrentSrc(PLACEHOLDER_IMAGE);
    setIsLoading(false);
  };

  if (hasError) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-500 text-sm">Image not found</span>
      </div>
    );
  }

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`} onClick={onClick}>
      {isLoading && isInView && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center"
          style={fill ? {} : { width, height }}
        >
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      {isInView && (
        fill ? (
          <Image
            src={currentSrc}
            alt={alt}
            fill
            className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${onClick ? 'cursor-pointer hover:opacity-90' : ''}`}
            onLoad={handleLoad}
            onError={handleError}
            priority={priority}
            sizes={sizes}
            quality={quality}
            placeholder="blur"
            blurDataURL={PLACEHOLDER_IMAGE}
          />
        ) : (
          <Image
            src={currentSrc}
            alt={alt}
            width={width}
            height={height}
            className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${onClick ? 'cursor-pointer hover:opacity-90' : ''}`}
            onLoad={handleLoad}
            onError={handleError}
            priority={priority}
            sizes={sizes}
            quality={quality}
            placeholder="blur"
            blurDataURL={PLACEHOLDER_IMAGE}
          />
        )
      )}
    </div>
  );
}
