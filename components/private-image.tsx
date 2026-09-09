/* oxlint-disable next/no-img-element -- Private authenticated images use blob URLs. */
'use client';
import { useEffect, useState } from 'react';
import { errorText, fileUrl } from '@/lib/client';
import { getAccessToken } from '@/lib/supabase/client';

export function PrivateImage({
  path,
  alt,
  className,
}: {
  path: string;
  alt: string;
  className?: string;
}) {
  const [src, setSrc] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    let objectUrl = '';
    void getAccessToken()
      .then((token) =>
        fetch(fileUrl(path), {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }),
      )
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
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path]);
  if (error) return <p className="notice-error text-xs">{error}</p>;
  if (!src)
    return <div className="h-12 w-12 rounded-lg bg-slate-100" aria-label="Loading private image" />;
  return <img src={src} alt={alt} className={className} loading="lazy" />;
}
