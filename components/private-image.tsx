/* oxlint-disable next/no-img-element -- Private authenticated images use blob URLs. */
'use client';
import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { errorText, fetchPrivateFile } from '@/lib/client';

interface PrivateImageProps {
  path: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
}

export function PrivateImage(props: PrivateImageProps) {
  return <LoadedPrivateImage key={props.path} {...props} />;
}

function LoadedPrivateImage({
  path,
  alt,
  className,
  style,
}: PrivateImageProps) {
  const [src, setSrc] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    let objectUrl = '';
    const controller = new AbortController();
    void fetchPrivateFile(path, controller.signal)
      .then(async (response) => {
        if (!response.ok) throw new Error('Private file could not be loaded.');
        return response.blob();
      })
      .then((blob) => {
        if (!cancelled) {
          objectUrl = URL.createObjectURL(blob);
          setSrc(objectUrl);
        }
      })
      .catch((reason) => {
        if (!cancelled) setError(errorText(reason));
      });
    return () => {
      cancelled = true;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path]);
  if (error) return <p className="notice-error text-xs">{error}</p>;
  if (!src)
    return <div className="h-12 w-12 rounded-lg bg-slate-100" aria-label="Loading private image" />;
  return <img src={src} alt={alt} className={className} style={style} draggable={false} loading="lazy" />;
}
