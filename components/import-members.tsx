'use client';
import { useState } from 'react';
import { useData } from './data-provider';
import { api, errorText } from '@/lib/client';
import { categories } from '@/lib/domain';
import type { Category } from '@/lib/domain';
import type { ImportRow } from '@/lib/import-xlsx';

export function ImportMembers({ onImported, embedded = false }: { onImported?: (count: number) => void; embedded?: boolean }) {
  const { members, refresh } = useData();
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [classification, setClassification] = useState<Category>('Member');
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const valid = rows.filter((row) => !row.errors.length);
  const duplicates = rows.filter((row) => row.duplicate).length;
  const invalid = rows.filter(
    (row) => row.errors.length > 0 && !row.duplicate,
  ).length;
  return (
    <section className={embedded ? 'space-y-3' : 'space-y-3 rounded-xl border border-slate-200 bg-white p-4'}>
      <div className="import-members-heading flex flex-wrap items-baseline justify-between gap-2"><h2 className="font-semibold">Import XLSX</h2><p className="text-xs text-slate-500">Required: name, TIP email, student ID, program and year level</p></div>
      <div className="import-members-fields grid gap-3 md:grid-cols-[14rem_1fr]">
      <label className="field">
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
      </div>
      {!!rows.length && (
        <>
          <div className="import-summary-grid grid gap-2 sm:grid-cols-5">
            {[
              ['Total rows', rows.length],
              ['Valid rows', valid.length],
              ['Invalid rows', invalid],
              ['Duplicate rows', duplicates],
              ['IDs to be assigned', valid.length],
            ].map(([label, value]) => (
              <div key={label} className="import-summary-card rounded-xl p-3">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-lg font-semibold">{value}</p>
              </div>
            ))}
          </div>
          <details className="import-validation" open={rows.some((row) => row.errors.length > 0)}>
            <summary className="cursor-pointer font-medium">
              Row validation details
            </summary>
            <div className="max-h-64 overflow-auto">
              <table className="data-table import-validation-table">
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
                      <td className={row.duplicate ? 'import-row-duplicate' : row.errors.length ? 'import-row-invalid' : 'import-row-valid'}>
                        {row.duplicate
                          ? `Skipped — ${row.errors.join('; ')}`
                          : row.errors.join('; ') || 'Ready — ID will be assigned'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
          <p className="import-guidance text-sm">
            {valid.length
              ? `${valid.length} new ${valid.length === 1 ? 'record is' : 'records are'} ready to import. ${duplicates ? `${duplicates} duplicate ${duplicates === 1 ? 'row will' : 'rows will'} be skipped. ` : ''}${invalid ? `${invalid} invalid ${invalid === 1 ? 'row also needs' : 'rows also need'} correction.` : ''}`
              : duplicates && !invalid
                ? 'No new records found. Every row already exists, so nothing will be imported.'
                : 'No rows are ready to import. Correct the invalid rows and choose the spreadsheet again.'}
          </p>
          {valid.length > 0 && <button
            className="btn-primary import-confirm-button"
            disabled={!!busy}
            onClick={async () => {
              setBusy('Assigning IDs and importing members…');
              setError('');
              try {
                const result = await api<{ imported: number; skippedDuplicates?: number }>(
                  'members/import',
                  {
                    method: 'POST',
                    body: JSON.stringify({
                      members: valid.map((row) => row.member),
                    }),
                  },
                );
                await refresh();
                const skipped = duplicates + (result.skippedDuplicates ?? 0);
                setMessage(`${result.imported} ${result.imported === 1 ? 'member' : 'members'} imported as Draft with assigned AWS SBG IDs.${skipped ? ` ${skipped} duplicate ${skipped === 1 ? 'row was' : 'rows were'} skipped.` : ''}`);
                onImported?.(result.imported);
                setRows([]);
              } catch (error) {
                setError(errorText(error));
              } finally {
                setBusy('');
              }
            }}
          >
            Confirm import of {valid.length} rows
          </button>}
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
