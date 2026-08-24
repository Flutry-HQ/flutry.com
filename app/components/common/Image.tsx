import pkg from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

const { LazyLoadImage } = pkg;

interface ImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'avif' | 'webp' | 'jpeg' | 'png';
  loading?: 'lazy' | 'eager';
  sizes?: string;
  wrapperClassName?: string;
}

const BREAKPOINTS = [320, 480, 640, 768, 1024, 1280, 1600, 1920];

export default function Image({
  src,
  alt,
  className,
  width,
  height,
  quality = 80,
  format,
  loading = 'lazy',
  sizes = '100vw',
  wrapperClassName,
}: ImageProps) {
  const build = (w: number) => {
    const params = new URLSearchParams({
      src,
      w: String(w),
      q: String(quality),
    });

    if (format) {
      params.set('format', format);
    }

    return `/image?${params.toString()}`;
  };

  const srcSet = BREAKPOINTS.map((w) => `${build(w)} ${w}w`).join(', ');

  const imageSrc = build(width ?? 1024);

  if (loading === 'eager') {
    return (
      <img
        src={imageSrc}
        srcSet={srcSet}
        sizes={sizes}
        width={width}
        height={height}
        alt={alt}
        className={className}
        decoding="async"
        loading="eager"
        fetchPriority="high"
      />
    );
  }

  return (
    <LazyLoadImage
      src={imageSrc}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      width={width}
      height={height}
      className={className}
      effect="blur"
      threshold={250}
      decoding="async"
      loading="lazy"
      wrapperClassName={wrapperClassName}
      visibleByDefault={false}
      useIntersectionObserver
      wrapperProps={{
        style: {
          display: 'block',
        },
      }}
    />
  );
}
