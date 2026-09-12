'use client';
import { useState } from 'react';
import { useData } from './data-provider';
import { errorText } from '@/lib/client';
import type { Generation } from '@/lib/domain';
export function GenerationControls({
  selectedIds,
  filteredIds,
  buttonClassName = '',
  onNotify,
}: {
  selectedIds?: string[];
  filteredIds?: string[];
  buttonClassName?: string;
  onNotify?: (message: string, type?: 'success' | 'error') => void;
}) {
  const { members, colors, templates, refresh } = useData();
  const [progress, setProgress] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [generated, setGenerated] = useState<Generation[]>([]);
  async function run(ids?: string[]) {
    const ready = members.filter(
      (member) =>
        member.status === 'Ready' && (!ids || ids.includes(member.id)),
    );
    if (!ready.length) {
      setError(
        'No Ready members in this selection. Review and confirm members first.',
      );
      return;
    }
    setBusy(true);
    setError('');
    setGenerated([]);
    const results: Generation[] = [];
    const failures: string[] = [];
    try {
      const { generateMember } = await import('@/lib/export-id');
      for (let i = 0; i < ready.length; i++) {
        setProgress(`Generating IDs — ${i + 1} / ${ready.length}`);
        try {
          results.push(await generateMember(ready[i], templates, colors));
        } catch (error) {
          failures.push(`${ready[i].aws_sbg_id}: ${errorText(error)}`);
        }
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
      setGenerated(results);
      await refresh();
      setProgress(`${results.length} generated; ${failures.length} failed.`);
      if (results.length) onNotify?.('IDs generated');
      if (failures.length) setError(failures.join('\n'));
    } catch (error) {
      const message = errorText(error);
      setError(message);
      onNotify?.(message, 'error');
    } finally {
      setBusy(false);
    }
  }
  const embedded = !!buttonClassName;
  return (
    <div className={embedded ? 'contents' : 'space-y-3'}>
      <div className={embedded ? 'contents' : 'flex flex-wrap gap-2'}>
        {selectedIds && (
          <button
            className={`btn-primary ${buttonClassName}`}
            disabled={busy || !selectedIds.length}
            onClick={() => void run(selectedIds)}
          >
            {busy ? 'Generating...' : 'Generate Selected'}
          </button>
        )}
        {filteredIds && (
          <button
            className={`btn ${buttonClassName}`}
            disabled={busy || !filteredIds.length}
            onClick={() => void run(filteredIds)}
          >
            {busy ? 'Generating...' : 'Generate Ready in Filter'}
          </button>
        )}
        <button
          className={`btn ${buttonClassName}`}
          disabled={
            busy || !members.some((member) => member.status === 'Ready')
          }
          onClick={() => void run()}
        >
          {busy ? 'Generating...' : 'Generate All Ready'}
        </button>
        {!!generated.length && (
          <button
            className={`btn ${buttonClassName}`}
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const { exportZip } = await import('@/lib/export-id');
                await exportZip(generated, setProgress);
                setProgress('ZIP downloaded.');
              } catch (error) {
                setError(errorText(error));
              } finally {
                setBusy(false);
              }
            }}
          >
            Download batch ZIP
          </button>
        )}
      </div>
      {!embedded && (
        <p className="text-sm text-slate-500">
          Only Ready records are generated. Use membership and team filters to
          produce category or team batches.
        </p>
      )}
      {progress && <output className={`${embedded ? 'col-span-full' : ''} block`}>{progress}</output>}
      {error && (
        <p role="alert" className={`notice-error whitespace-pre-line ${embedded ? 'col-span-full' : ''}`}>
          {error}
        </p>
      )}
    </div>
  );
}
