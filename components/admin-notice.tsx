'use client';

import { useEffect } from 'react';

export type AdminNoticeState = { type: 'success' | 'error'; message: string } | null;

export function AdminNotice({
  notice,
  onDismiss,
  successTitle = 'Saved',
}: {
  notice: AdminNoticeState;
  onDismiss: () => void;
  successTitle?: string;
}) {
  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(onDismiss, notice.type === 'success' ? 2800 : 5000);
    return () => window.clearTimeout(timeout);
  }, [notice, onDismiss]);

  if (!notice) return null;
  return (
    <output className={`app-toast-${notice.type}`}>
      <strong>{notice.type === 'success' ? successTitle : 'Action needed'}</strong>
      <span>{notice.message}</span>
    </output>
  );
}
