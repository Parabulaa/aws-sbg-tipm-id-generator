/* oxlint-disable next/no-img-element -- Private authenticated images use blob URLs. */
'use client';
import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { errorText, fetchPrivateBlob } from '@/lib/client';

interface PrivateImageProps {
  path: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
}

export function PrivateImage(props: PrivateImageProps) {
  if (props.path.startsWith('/')) {
    return <img src={props.path} alt={props.alt} className={props.className} style={props.style} draggable={false} loading="lazy" />;
  }
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
    void fetchPrivateBlob(path)
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
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path]);
  if (error) return <p className="notice-error text-xs">{error}</p>;
  if (!src)
    return (
      <div
        className="h-12 w-12 rounded-lg bg-slate-100"
        aria-label="Loading private image"
      />
    );
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      draggable={false}
      loading="lazy"
    />
  );
}
