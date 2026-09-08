'use client';
import { useState } from 'react';
import { useData } from './data-provider';
import { api, errorText } from '@/lib/client';
import type { ImportRow } from '@/lib/import-xlsx';
export function ImportMembers() {
  const { members, refresh } = useData();
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const valid = rows.filter((row) => !row.errors.length);
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
      <h2 className="font-semibold">Import XLSX</h2>
      <p className="text-sm text-slate-600">
        First worksheet only. Required: first_name, last_name, email,
        membership_type, aws_sbg_id, date_issued, valid_until. Officers also
        require team and position. Photos are uploaded during review.
      </p>
      <label className="field">
        Membership spreadsheet
        <input
          type="file"
          accept=".xlsx"
          disabled={!!busy}
          onChange={async (event) => {
            const file = event.target.files?.[0];
            setRows([]);
            setError('');
            setMessage('');
            if (!file) return;
            setBusy('Validating spreadsheet…');
            try {
              if (!file.name.toLowerCase().endsWith('.xlsx'))
                throw new Error('Choose an XLSX file.');
              const { parseXlsx } = await import('@/lib/import-xlsx');
              setRows(
                await parseXlsx(
                  await file.arrayBuffer(),
                  members.map((member) => member.aws_sbg_id),
                ),
              );
            } catch (error) {
              setError(errorText(error));
            } finally {
              setBusy('');
              event.target.value = '';
            }
          }}
        />
      </label>
      {!!rows.length && (
        <>
          <p>
            {rows.length} total · {valid.length} valid ·{' '}
            {rows.length - valid.length} invalid
          </p>
          <details open={rows.some((row) => row.errors.length > 0)}>
            <summary className="cursor-pointer font-medium">
              Row validation details
            </summary>
            <div className="max-h-64 overflow-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>ID</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.row}>
                      <td>{row.row}</td>
                      <td>{row.member.aws_sbg_id}</td>
                      <td>{row.errors.join('; ') || 'Valid'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
          <p className="text-sm">
            Only valid rows will be imported. Invalid rows remain in this report
            for correction; nothing has been saved yet.
          </p>
          <button
            className="btn-primary"
            disabled={!!busy || !valid.length}
            onClick={async () => {
              setBusy('Importing members…');
              setError('');
              try {
                const result = await api<{ imported: number }>(
                  'members/import',
                  {
                    method: 'POST',
                    body: JSON.stringify({
                      members: valid.map((row) => row.member),
                    }),
                  },
                );
                await refresh();
                setMessage(`${result.imported} members imported as Draft.`);
                setRows([]);
              } catch (error) {
                setError(errorText(error));
              } finally {
                setBusy('');
              }
            }}
          >
            Confirm import of {valid.length} valid rows
          </button>
        </>
      )}
      {busy && <output className="block">{busy}</output>}
      {error && (
        <p role="alert" className="notice-error">
          {error}
        </p>
      )}
      {message && <output className="notice block">{message}</output>}
    </section>
  );
}
