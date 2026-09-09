'use client';
import { useState } from 'react';
import { useData } from './data-provider';
import { api, errorText } from '@/lib/client';
import { categories } from '@/lib/domain';
import type { Category } from '@/lib/domain';
import type { ImportRow } from '@/lib/import-xlsx';

export function ImportMembers() {
  const { members, refresh } = useData();
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [classification, setClassification] = useState<Category>('Member');
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const valid = rows.filter((row) => !row.errors.length);
  const duplicates = rows.filter((row) => row.duplicate).length;
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="font-semibold">Import membership XLSX</h2>
      <p className="text-sm text-slate-600">
        First worksheet only. Required columns: Full Name, T.I.P. Email, Student
        ID number, Department/Program, and Year Level. Photos are added manually
        during review; AWS SBG IDs are assigned automatically.
      </p>
      <label className="field max-w-xs">
        Classification for this batch
        <select
          value={classification}
          onChange={(event) => {
            setClassification(event.target.value as Category);
            setRows([]);
            setMessage('Choose the spreadsheet again for this classification.');
          }}
        >
          {categories.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
      </label>
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
                  members,
                  classification,
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
          <div className="grid gap-2 sm:grid-cols-5">
            {[
              ['Total rows', rows.length],
              ['Valid rows', valid.length],
              ['Invalid rows', rows.length - valid.length],
              ['Duplicate rows', duplicates],
              ['IDs to be assigned', valid.length],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-lg font-semibold">{value}</p>
              </div>
            ))}
          </div>
          <details open={rows.some((row) => row.errors.length > 0)}>
            <summary className="cursor-pointer font-medium">
              Row validation details
            </summary>
            <div className="max-h-64 overflow-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Member</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.row}>
                      <td>{row.row}</td>
                      <td>{row.member.full_name}</td>
                      <td>
                        {row.errors.join('; ') || 'Valid — ID will be assigned'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
          <p className="text-sm">
            Invalid or duplicate rows are never saved. Correct the spreadsheet
            before importing so the batch remains complete and predictable.
          </p>
          <button
            className="btn-primary"
            disabled={!!busy || valid.length !== rows.length}
            onClick={async () => {
              setBusy('Assigning IDs and importing members…');
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
                setMessage(
                  `${result.imported} members imported as Draft with assigned AWS SBG IDs.`,
                );
                setRows([]);
              } catch (error) {
                setError(errorText(error));
              } finally {
                setBusy('');
              }
            }}
          >
            Confirm import of {valid.length} rows
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
