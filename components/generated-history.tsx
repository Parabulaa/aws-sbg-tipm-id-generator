/* oxlint-disable next/no-img-element -- Authenticated generated files use blob URLs. */
'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Ellipsis,
  Eye,
  FileBadge2,
  FileDown,
  RefreshCw,
  Search,
  UserRound,
  X,
  XCircle,
} from 'lucide-react';
import { useData } from './data-provider';
import { displayName, safeFilename } from '@/lib/domain';
import type { Generation } from '@/lib/domain';
import { api, errorText } from '@/lib/client';
import { PrivateImage } from './private-image';

type StatusFilter = '' | 'Active' | 'Expired';
type PreviewSide = 'front' | 'back' | null;

function isExpired(record: Generation) {
  const validUntil = record.member.valid_until;
  return (
    !!validUntil && new Date(`${validUntil}T23:59:59`).getTime() < Date.now()
  );
}
function statusOf(record: Generation) {
  return isExpired(record) ? 'Expired' : 'Active';
}
function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function GeneratedHistory() {
  const { generations, loading } = useData();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<StatusFilter>('');
  const [selected, setSelected] = useState<string[]>([]);
  const [detailsId, setDetailsId] = useState<string | null>();
  const [preview, setPreview] = useState<PreviewSide>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const records = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return generations.filter((record) => {
      const matchesSearch =
        !needle ||
        [
          displayName(record.member),
          record.member.aws_sbg_id,
          record.member.program,
        ]
          .join(' ')
          .toLowerCase()
          .includes(needle);
      return (
        matchesSearch &&
        (!category || record.member.membership_type === category) &&
        (!status || statusOf(record) === status)
      );
    });
  }, [category, generations, query, status]);
  const activeCount = generations.filter((record) => !isExpired(record)).length;
  const expiredCount = generations.length - activeCount;
  const pageCount = Math.max(1, Math.ceil(records.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible = records.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const resolvedDetailsId =
    detailsId === undefined ? generations[0]?.id : detailsId;
  const details = generations.find((record) => record.id === resolvedDetailsId);

  async function action(fn: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setBusy(false);
    }
  }
  async function download(record: Generation, file: string, path?: string) {
    if (!path) throw new Error(`${file} is not available for this ID.`);
    const { downloadFile } = await import('@/lib/export-id');
    await downloadFile(path, `${safeFilename(record.member)}_${file}`);
    await api(`generations/${record.id}/download`, {
      method: 'POST',
      body: JSON.stringify({ file }),
    });
  }
  async function downloadZip() {
    const targets = selected.length
      ? generations.filter((record) => selected.includes(record.id))
      : records;
    if (!targets.length)
      throw new Error('No generated IDs are available to download.');
    const { exportZip } = await import('@/lib/export-id');
    await exportZip(targets, setProgress);
    setProgress(
      `ZIP downloaded for ${targets.length} ${targets.length === 1 ? 'ID' : 'IDs'}.`,
    );
  }

  if (loading) return <GeneratedHistorySkeleton />;

  return (
    <div className={`generated-archive ${details ? 'has-details' : ''}`}>
      <section className="generated-main-column">
        <div className="generated-metrics" aria-label="Generated ID totals">
          <Metric
            icon={<FileBadge2 />}
            label="Generated"
            value={generations.length}
            note="Total IDs created"
            tone="cyan"
          />
          <Metric
            icon={<UserRound />}
            label="Active"
            value={activeCount}
            note="Currently valid IDs"
            tone="green"
          />
          <Metric
            icon={<XCircle />}
            label="Expired"
            value={expiredCount}
            note="Past validity date"
            tone="red"
          />
        </div>
        <section
          className="generated-toolbar"
          aria-label="Generated ID filters"
        >
          <label className="generated-search">
            <Search className="size-4" />
            <span className="sr-only">Search generated IDs</span>
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search generated IDs..."
            />
          </label>
          <select
            aria-label="All Types"
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All Types</option>
            <option>Officer</option>
            <option>Associate</option>
            <option>Member</option>
          </select>
          <select
            aria-label="All Statuses"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as StatusFilter);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option>Active</option>
            <option>Expired</option>
          </select>
          <button
            className="btn-primary generated-zip-button"
            disabled={busy || !records.length}
            onClick={() => void action(downloadZip)}
          >
            <Download className="size-4" /> Download ZIP
          </button>
        </section>
        {progress && (
          <output className="generated-notice block">{progress}</output>
        )}
        {error && (
          <p className="notice-error" role="alert">
            {error}
          </p>
        )}
        <section className="generated-table-card">
          <div className="generated-table-scroll">
            <table className="generated-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      aria-label="Select all IDs on this page"
                      checked={
                        !!visible.length &&
                        visible.every((record) => selected.includes(record.id))
                      }
                      onChange={(event) =>
                        setSelected(
                          event.target.checked
                            ? [
                                ...new Set([
                                  ...selected,
                                  ...visible.map((record) => record.id),
                                ]),
                              ]
                            : selected.filter(
                                (id) =>
                                  !visible.some((record) => record.id === id),
                              ),
                        )
                      }
                    />
                  </th>
                  <th>Member</th>
                  <th>ID Number</th>
                  <th>Type</th>
                  <th>Generated</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((record) => {
                  const memberName = displayName(record.member);
                  const recordStatus = statusOf(record);
                  return (
                    <tr
                      key={record.id}
                      className={details?.id === record.id ? 'is-selected' : ''}
                    >
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`Select ${memberName}`}
                          checked={selected.includes(record.id)}
                          onChange={(event) =>
                            setSelected(
                              event.target.checked
                                ? [...selected, record.id]
                                : selected.filter((id) => id !== record.id),
                            )
                          }
                        />
                      </td>
                      <td aria-label={`Member details for ${memberName}`}>
                        <div className="generated-member">
                          <span className="generated-avatar" aria-hidden="true">
                            {initials(memberName)}
                          </span>
                          <span>
                            <strong>{memberName}</strong>
                            <small>
                              {record.member.program || 'No program'} •{' '}
                              {record.member.year_level || 'No year level'}
                            </small>
                          </span>
                        </div>
                      </td>
                      <td className="generated-id-number">
                        {record.member.aws_sbg_id}
                      </td>
                      <td>
                        <span
                          className={`generated-type type-${record.member.membership_type.toLowerCase()}`}
                        >
                          {record.member.membership_type}
                        </span>
                      </td>
                      <td>
                        {new Date(record.generated_at).toLocaleDateString(
                          'en-US',
                          { month: 'short', day: 'numeric', year: 'numeric' },
                        )}
                      </td>
                      <td>
                        <span
                          className={`generated-status status-${recordStatus.toLowerCase()}`}
                        >
                          <i />
                          {recordStatus}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="generated-more"
                          aria-label={`Open details for ${memberName}`}
                          onClick={() => {
                            setDetailsId(record.id);
                            setPreview(null);
                          }}
                        >
                          <Ellipsis className="size-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!visible.length && (
            <div className="generated-empty">
              {loading
                ? 'Loading generated IDs…'
                : 'No generated IDs match these filters.'}
            </div>
          )}
          <footer className="generated-pagination">
            <span>
              Showing {records.length ? (currentPage - 1) * pageSize + 1 : 0}–
              {Math.min(currentPage * pageSize, records.length)} of{' '}
              {records.length}
            </span>
            <div>
              <label>
                Rows per page{' '}
                <select
                  aria-label="Rows per page"
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));
                    setPage(1);
                  }}
                >
                  <option>10</option>
                  <option>20</option>
                  <option>50</option>
                </select>
              </label>
              <button
                aria-label="Previous page"
                disabled={currentPage === 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                <ChevronLeft />
              </button>
              {Array.from(
                { length: Math.min(pageCount, 3) },
                (_, index) => index + 1,
              ).map((value) => (
                <button
                  key={value}
                  aria-label={`Page ${value}`}
                  className={currentPage === value ? 'is-current' : ''}
                  onClick={() => setPage(value)}
                >
                  {value}
                </button>
              ))}
              <button
                aria-label="Next page"
                disabled={currentPage === pageCount}
                onClick={() =>
                  setPage((value) => Math.min(pageCount, value + 1))
                }
              >
                <ChevronRight />
              </button>
            </div>
          </footer>
        </section>
      </section>
      {details && (
        <DetailsPanel
          record={details}
          preview={preview}
          busy={busy}
          onPreview={setPreview}
          onClose={() => {
            setDetailsId(null);
            setPreview(null);
          }}
          onDownload={(file, path) =>
            void action(() => download(details, file, path))
          }
        />
      )}
    </div>
  );
}

function GeneratedHistorySkeleton() {
  return (
    <div className="generated-loading" aria-label="Loading generated IDs">
      <div className="generated-metrics">
        {Array.from({ length: 3 }, (_, index) => (
          <div className="generated-skeleton-metric" key={index}>
            <i />
            <span><b /><small /></span>
          </div>
        ))}
      </div>
      <div className="generated-skeleton-toolbar">
        {Array.from({ length: 4 }, (_, index) => <span key={index} />)}
      </div>
      <div className="generated-skeleton-table">
        <header />
        <div>{Array.from({ length: 5 }, (_, index) => <span key={index} />)}</div>
        <footer />
      </div>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  note,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  note: string;
  tone: string;
}) {
  return (
    <article className={`generated-metric tone-${tone}`}>
      <span>{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </article>
  );
}
function DetailsPanel({
  record,
  preview,
  busy,
  onPreview,
  onClose,
  onDownload,
}: {
  record: Generation;
  preview: PreviewSide;
  busy: boolean;
  onPreview: (side: PreviewSide) => void;
  onClose: () => void;
  onDownload: (file: string, path?: string) => void;
}) {
  const memberName = displayName(record.member);
  const previewPath =
    preview === 'front'
      ? record.front_path
      : preview === 'back'
        ? record.back_path
        : undefined;
  return (
    <aside
      className="generated-details"
      aria-label={`ID details for ${memberName}`}
    >
      <header>
        <h2>ID Details</h2>
        <button aria-label="Close details" onClick={onClose}>
          <X />
        </button>
      </header>
      <div className="generated-details-person">
        <span className="generated-avatar large">{initials(memberName)}</span>
        <div>
          <strong>{memberName}</strong>
          <small>
            {record.member.program || 'No program'} •{' '}
            {record.member.year_level || 'No year level'}
          </small>
        </div>
      </div>
      <dl>
        <div>
          <dt>AWS SBG ID</dt>
          <dd>{record.member.aws_sbg_id}</dd>
        </div>
        <div>
          <dt>Classification</dt>
          <dd>{record.member.membership_type}</dd>
        </div>
        <div>
          <dt>Generated date</dt>
          <dd>
            {new Date(record.generated_at).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </dd>
        </div>
        <div>
          <dt>Valid until</dt>
          <dd>
            {record.member.valid_until
              ? new Date(
                  `${record.member.valid_until}T00:00:00`,
                ).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Not issued'}
          </dd>
        </div>
        <div>
          <dt>Generated by</dt>
          <dd>{record.generated_by}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>
            <span
              className={`generated-status status-${statusOf(record).toLowerCase()}`}
            >
              <i />
              {statusOf(record)}
            </span>
          </dd>
        </div>
      </dl>
      <div className="generated-detail-actions">
        <button
          className="btn"
          disabled={!record.front_path}
          onClick={() => onPreview(preview === 'front' ? null : 'front')}
        >
          <Eye /> Preview Front
        </button>
        <button
          className="btn"
          disabled={!record.back_path}
          onClick={() => onPreview(preview === 'back' ? null : 'back')}
        >
          <Eye /> Preview Back
        </button>
        <button
          className="btn"
          disabled={busy || !record.front_path}
          onClick={() => onDownload('front.png', record.front_path)}
        >
          <Download /> Download Front PNG
        </button>
        <button
          className="btn"
          disabled={busy || !record.back_path}
          onClick={() => onDownload('back.png', record.back_path)}
        >
          <Download /> Download Back PNG
        </button>
        <button
          className="btn"
          disabled={busy || !record.pdf_path}
          onClick={() => onDownload('ID.pdf', record.pdf_path)}
        >
          <FileDown /> Download PDF
        </button>
        <Link className="btn" href={`/generate-id?member=${record.member_id}`}>
          <RefreshCw /> Review / Regenerate
        </Link>
      </div>
      {preview && (
        <div className="generated-preview">
          <h3>{preview === 'front' ? 'Front' : 'Back'} Preview</h3>
          {previewPath ? (
            <PrivateImage
              path={previewPath}
              alt={`${preview} ID for ${memberName}`}
            />
          ) : (
            <p>Preview unavailable.</p>
          )}
        </div>
      )}
    </aside>
  );
}
