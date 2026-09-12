/* oxlint-disable next/no-img-element -- Private authenticated images use blob URLs. */
'use client';
import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { errorText, fetchPrivateFile } from '@/lib/client';

const privateImageCache = new Map<string, Promise<Blob>>();

function cachedPrivateImage(path: string) {
  const existing = privateImageCache.get(path);
  if (existing) return existing;
  const pending = fetchPrivateFile(path)
    .then((response) => response.blob())
    .catch((error) => {
      privateImageCache.delete(path);
      throw error;
    });
  privateImageCache.set(path, pending);
  return pending;
}

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
    void cachedPrivateImage(path)
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
