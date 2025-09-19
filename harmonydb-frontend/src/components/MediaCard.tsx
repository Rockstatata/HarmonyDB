import { useEffect, useRef, useState } from 'react';

export type MediaCardProps = {
  variant?: 'artist' | 'media';
  mediaType?: 'album' | 'song';
  inArtistPage?: boolean;
  title: string; // Album/song name or Artist name
  subtitle?: string; // Artist name or album/song name depending on variant
  releaseDate?: string; // ISO or friendly date string
  imageSrc: string;
  onClick?: () => void;
  className?: string;
  imageOverlay?: boolean;
};

function getYear(dateStr?: string) {
  if (!dateStr) return undefined;
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return String(d.getFullYear());
  // fallback if passed as 'YYYY-MM-DD' or 'YYYY'
  const m = dateStr.match(/(\d{4})/);
  return m ? m[1] : undefined;
}

export default function MediaCard({
  variant = 'media',
  mediaType = 'album',
  inArtistPage = false,
  title,
  subtitle,
  releaseDate,
  imageSrc,
  onClick,
  className = ''
  , imageOverlay = true
}: MediaCardProps) {
  const [accent, setAccent] = useState('rgba(226,62,87,0.85)');
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Compute a simple average color from the image to use as an accent
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    if (!img.complete) {
      const onLoad = () => computeAccent(img);
      img.addEventListener('load', onLoad);
      return () => img.removeEventListener('load', onLoad);
    }
    computeAccent(img);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageSrc]);

  function computeAccent(img: HTMLImageElement) {
    try {
      const canvas = document.createElement('canvas');
      const w = (canvas.width = Math.min(32, img.naturalWidth));
      const h = (canvas.height = Math.min(32, img.naturalHeight));
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;
      let r = 0,
        g = 0,
        b = 0,
        count = 0;
      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha === 0) continue;
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count++;
      }
      if (count === 0) return;
      r = Math.round(r / count);
      g = Math.round(g / count);
      b = Math.round(b / count);
      setAccent(`rgba(${r}, ${g}, ${b}, 0.9)`);
    } catch (e) {
      // ignore - keep default accent
    }
  }

  const year = getYear(releaseDate);

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (!onClick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  }

  return (
    <div
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`group w-64 sm:w-64 md:w-72 rounded-3xl overflow-hidden shadow-2xl bg-transparent cursor-pointer border border-white/10 backdrop-blur-sm flex flex-col h-[320px] transform transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-105 hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 ${className}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{ borderRadius: 24}}
    >
      <div className="relative w-full overflow-hidden rounded-t-3xl h-72">
        <img
          ref={imgRef}
          src={imageSrc}
          alt={title}
          className="w-full h-full object-cover block"
          style={{ borderRadius: 24 }}
        />

        {/* accent strip + soft glow */}
        <div
          aria-hidden
          className="absolute left-0 top-0 bottom-0 w-1/12 group-hover:w-2/12 transition-all duration-300 ease-out"
          style={{
            background: `linear-gradient(180deg, ${accent}, rgba(0,0,0,0.05))`,
            mixBlendMode: 'screen',
            
          }}
        />
        {/* subtle image darken on hover for contrast */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-30 transition-opacity duration-300"
          style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.0), rgba(0,0,0,0.45))',    
            borderRadius: 24
          }}
        />
        {imageOverlay && (
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, rgba(0,0,0,0.0), rgba(0,0,0,0.45))`,
              borderRadius: 24
            }}
          />
        )}
      </div>

      {/* Bottom info area - semi-transparent with rounded bottom corners */}
      <div className="p-4 bg-transparent backdrop-blur-sm rounded-b-3xl flex-1 flex flex-col justify-center">
        {inArtistPage ? (
          // When inside an artist page, simplify layout:
          // - artist variant: show artist name only
          // - media variant: show title, mediaType label, and year (no subtitle)
          variant === 'artist' ? (
            <div className="text-xl md:text-2xl font-poppins font-semibold text-white leading-tight">{title}</div>
          ) : (
            <>
              <div className="text-xl md:text-2xl font-poppins font-semibold text-white leading-tight">{title}</div>
              <div className="mt-3 text-sm text-gray-300">
                <div className="font-poppins font-medium text-gray-200">{mediaType === 'song' ? 'Song' : 'Album'}</div>
                {year && <div className="mt-1 text-xs text-gray-400">{year}</div>}
              </div>
            </>
          )
        ) : (
          // Default behavior (not in artist page): keep previous layouts
          variant === 'artist' ? (
            <>
              <div className="text-xl md:text-2xl font-poppins font-semibold text-white leading-tight">
                {title}
              </div>

              <div className="mt-3 text-sm text-gray-300">
                {year && (
                  <div className="mt-1 text-xs text-gray-400">{year}</div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="text-xl md:text-2xl font-poppins font-semibold text-white leading-tight">
                {title}
              </div>
              {subtitle && (
                <div className="mt-2 text-sm text-gray-300 font-poppins">{subtitle}</div>
              )}
            </>
          )
        )}
      </div>
    </div>
  );
}
