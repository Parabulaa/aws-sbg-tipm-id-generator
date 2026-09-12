/* oxlint-disable next/no-img-element -- Local object URLs cannot use the image optimizer. */
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Circle,
  Eye,
  FileJson,
  FolderCog,
  Image as ImageIcon,
  Loader2,
  Settings,
  Upload,
  Users,
} from 'lucide-react';
import { useData } from './data-provider';
import { api, errorText } from '@/lib/client';
import { PrivateImage } from './private-image';
import { officerDesigns } from '@/lib/templates';
import type { Side, Template } from '@/lib/templates';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type WorkspaceCategory = 'Officer' | 'Associate' | 'Member';
const categories: Array<{ value: WorkspaceCategory; label: string }> = [
  { value: 'Officer', label: 'Officer Designs' },
  { value: 'Associate', label: 'Associate Design' },
  { value: 'Member', label: 'Member Design' },
];

export function TemplateSettings() {
  const { templates, refresh, role } = useData();
  const [category, setCategory] = useState<WorkspaceCategory>('Officer');
  const [team, setTeam] = useState<string>(officerDesigns[0].team);
  const [configureSide, setConfigureSide] = useState<Side>('front');
  const [configureOpen, setConfigureOpen] = useState(false);
  const [previewSide, setPreviewSide] = useState<Side | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [mappingFile, setMappingFile] = useState<File | null>(null);
  const [approved, setApproved] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const design = officerDesigns.find((item) => item.team === team);
  const title =
    category === 'Officer' ? (design?.label ?? 'Officer') : category;
  const description =
    category === 'Officer'
      ? `Approved ID design for ${title.toLowerCase()} officers.`
      : category === 'Associate'
        ? 'Approved ID design for associate members.'
        : 'Approved ID design for regular members.';
  const selected = useMemo(
    () =>
      Object.fromEntries(
        (['front', 'back'] as const).map((side) => [
          side,
          templates.find(
            (template) =>
              template.category === category &&
              template.side === side &&
              (category !== 'Officer' || template.team === team),
          ),
        ]),
      ) as Record<Side, Template | undefined>,
    [category, team, templates],
  );

  function openConfigure(side: Side) {
    setConfigureSide(side);
    setImageFile(null);
    setMappingFile(null);
    setApproved(false);
    setError('');
    setMessage('');
    setConfigureOpen(true);
  }
  async function saveTemplate(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!imageFile) return setError('Choose the approved PNG.');
    if (configureSide === 'front' && !mappingFile)
      return setError('Choose the field mapping JSON.');
    setBusy(true);
    setError('');
    try {
      const form = new FormData();
      form.set('category', category);
      form.set('side', configureSide);
      form.set('image', imageFile);
      if (category === 'Officer') form.set('team', team);
      form.set(
        'layout',
        configureSide === 'front'
          ? await mappingFile!.text()
          : JSON.stringify({ fields: [], accents: [] }),
      );
      form.set('approved', approved ? 'true' : 'false');
      await api('templates', { method: 'POST', body: form });
      await refresh();
      setMessage(`${title} ${configureSide} template saved.`);
      setConfigureOpen(false);
      formRef.current?.reset();
    } catch (caught) {
      setError(errorText(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="templates-workspace">
      <nav className="template-category-tabs" aria-label="Template category">
        {categories.map((item) => (
          <button
            key={item.value}
            type="button"
            className={category === item.value ? 'is-active' : ''}
            aria-pressed={category === item.value}
            onClick={() => setCategory(item.value)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      {category === 'Officer' && (
        <section className="template-team-panel">
          <div>
            <h2>Officer Teams</h2>
            <p>Select a team to manage its approved template.</p>
          </div>
          <div className="template-team-grid">
            {officerDesigns.map((item) => (
              <button
                key={item.team}
                type="button"
                className={team === item.team ? 'is-active' : ''}
                aria-pressed={team === item.team}
                onClick={() => setTeam(item.team)}
              >
                <Users className="size-4" />
                {teamLabel(item.label)}
              </button>
            ))}
          </div>
        </section>
      )}
      <section className="template-selected-panel">
        <header className="template-selected-header">
          <div className="template-heading-copy">
            <span className="template-heading-icon">
              <FolderCog className="size-5" />
            </span>
            <div>
              <h2>{title} Template</h2>
              <p>{description}</p>
            </div>
          </div>
          <div className="template-overall-status">
            {(['front', 'back'] as const).map((side) => (
              <Status
                key={side}
                configured={!!selected[side]}
                text={`${capitalize(side)} ${selected[side] ? 'configured' : 'not configured'}`}
              />
            ))}
          </div>
        </header>
        <div className="template-card-grid">
          {(['front', 'back'] as const).map((side) => (
            <TemplateCard
              key={`${category}-${team}-${side}`}
              side={side}
              label={title}
              template={selected[side]}
              editable={role === 'admin'}
              onConfigure={() => openConfigure(side)}
              onPreview={() => setPreviewSide(side)}
            />
          ))}
        </div>
        {role === 'admin' ? (
          <div className="template-main-actions">
            <button
              className="btn"
              type="button"
              onClick={() => openConfigure('front')}
            >
              <FileJson className="size-4" /> Field Mapping
            </button>
            <button
              className="btn-primary"
              type="button"
              onClick={() => openConfigure('front')}
            >
              <Settings className="size-4" /> Configure Selected Template
            </button>
          </div>
        ) : (
          <p className="template-readonly">
            Templates are read-only for Officer accounts.
          </p>
        )}
      </section>
      <section className="template-about-card">
        <ImageIcon className="size-5" />
        <div>
          <h2>About approved templates</h2>
          <p>
            Templates remain private and must use the production size of 1200 ×
            1950 px.
          </p>
        </div>
      </section>
      {message && <output className="notice block">{message}</output>}

      <Dialog
        open={configureOpen}
        onOpenChange={(open) => {
          if (!busy) setConfigureOpen(open);
        }}
      >
        <DialogContent className="member-dialog template-configure-dialog sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Configure Approved Template</DialogTitle>
            <DialogDescription>
              Upload the approved PNG and configure its field mapping.
            </DialogDescription>
          </DialogHeader>
          <form
            ref={formRef}
            id="template-configure-form"
            onSubmit={saveTemplate}
          >
            <div className="template-context-summary">
              <FolderCog className="size-5" />
              <div>
                <strong>
                  {title} · {capitalize(configureSide)}
                </strong>
                <small>
                  You can change the template group or side if needed.
                </small>
              </div>
            </div>
            <div className="template-configure-fields">
              <label className="field">
                Template Group
                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value as WorkspaceCategory)
                  }
                >
                  {categories.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.value}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Side
                <select
                  value={configureSide}
                  onChange={(event) => {
                    setConfigureSide(event.target.value as Side);
                    setMappingFile(null);
                  }}
                >
                  <option value="front">Front</option>
                  <option value="back">Back</option>
                </select>
              </label>
            </div>
            {category === 'Officer' && (
              <label className="field template-officer-select">
                Officer Team
                <select
                  value={team}
                  onChange={(event) => setTeam(event.target.value)}
                >
                  {officerDesigns.map((item) => (
                    <option key={item.team} value={item.team}>
                      {teamLabel(item.label)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className="template-upload-grid">
              <UploadField
                label="Approved PNG"
                accept="image/png"
                file={imageFile}
                onFile={setImageFile}
              />
              <UploadField
                label="Field Mapping JSON"
                accept=".json,application/json"
                file={mappingFile}
                onFile={setMappingFile}
                optional={configureSide === 'back'}
              />
            </div>
            <div className="template-configure-preview">
              <div>
                <h3>Template Preview</h3>
                <div className="template-local-preview">
                  {imageFile ? (
                    <LocalPreview file={imageFile} />
                  ) : selected[configureSide] ? (
                    <PrivateImage
                      path={selected[configureSide]!.image}
                      alt={`${title} ${configureSide} template`}
                    />
                  ) : (
                    <ImageIcon className="size-8" />
                  )}
                </div>
              </div>
              <div className="template-upload-status">
                <Status
                  configured={!!imageFile}
                  text={imageFile ? 'PNG selected' : 'PNG required'}
                  detail={imageFile?.name ?? '1200 × 1950 px'}
                />
                <Status
                  configured={!!mappingFile || configureSide === 'back'}
                  text={
                    configureSide === 'back'
                      ? 'Mapping not required'
                      : mappingFile
                        ? 'Mapping selected'
                        : 'Mapping required'
                  }
                  detail={
                    mappingFile?.name ??
                    (configureSide === 'back'
                      ? 'Back design is fixed artwork'
                      : 'JSON field coordinates')
                  }
                />
              </div>
            </div>
            <label className="template-confirmation">
              <input
                type="checkbox"
                checked={approved}
                onChange={(event) => setApproved(event.target.checked)}
                required
              />
              <span>
                I confirm that this background and its field mapping, when
                needed, have been approved.
              </span>
            </label>
            {error && (
              <p className="notice-error" role="alert">
                {error}
              </p>
            )}
          </form>
          <DialogFooter>
            <button
              className="btn"
              type="button"
              disabled={busy}
              onClick={() => setConfigureOpen(false)}
            >
              Cancel
            </button>
            <button
              className="btn-primary"
              type="submit"
              form="template-configure-form"
              disabled={busy}
            >
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Check className="size-4" /> Save Approved Template
                </>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={previewSide !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewSide(null);
        }}
      >
        <DialogContent className="member-dialog template-preview-dialog sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {title} {previewSide ? capitalize(previewSide) : ''} Preview
            </DialogTitle>
            <DialogDescription>
              Approved template · 1200 × 1950 px
            </DialogDescription>
          </DialogHeader>
          {previewSide && selected[previewSide] && (
            <PrivateImage
              path={selected[previewSide]!.image}
              alt={`${title} ${previewSide} full preview`}
              className="template-full-preview"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TemplateCard({
  side,
  label,
  template,
  editable,
  onConfigure,
  onPreview,
}: {
  side: Side;
  label: string;
  template?: Template;
  editable: boolean;
  onConfigure: () => void;
  onPreview: () => void;
}) {
  return (
    <article className="template-side-card">
      <header>
        <div>
          <h3>{capitalize(side)}</h3>
          <p>1200 × 1950 px</p>
        </div>
        <Status
          configured={!!template}
          text={template ? 'Configured' : 'Not configured'}
        />
      </header>
      <div className="template-thumbnail-frame">
        {template ? (
          <PrivateImage
            path={template.image}
            alt={`${label} ${side} template`}
            className="template-thumbnail"
          />
        ) : (
          <div className="template-empty">
            <ImageIcon className="size-8" />
            <span>Template not configured</span>
          </div>
        )}
      </div>
      <div className="template-card-actions">
        {editable && (
          <button className="btn" type="button" onClick={onConfigure}>
            <Upload className="size-4" />
            {template ? 'Replace' : `Configure ${capitalize(side)}`}
          </button>
        )}
        <button
          className="btn"
          type="button"
          disabled={!template}
          onClick={onPreview}
        >
          <Eye className="size-4" /> Preview
        </button>
      </div>
    </article>
  );
}
function UploadField({
  label,
  accept,
  file,
  onFile,
  optional = false,
}: {
  label: string;
  accept: string;
  file: File | null;
  onFile: (file: File | null) => void;
  optional?: boolean;
}) {
  return (
    <label className="template-upload-field">
      <span>{label}</span>
      <input
        type="file"
        accept={accept}
        required={!optional}
        onChange={(event) => onFile(event.target.files?.[0] ?? null)}
      />
      <span className="template-upload-box">
        <Upload className="size-6" />
        <strong>{file ? file.name : 'Click to upload or drag and drop'}</strong>
        <small>
          {optional
            ? 'Not required for completed Back artwork'
            : accept.includes('png')
              ? 'PNG · 1200 × 1950 px'
              : 'JSON file'}
        </small>
      </span>
    </label>
  );
}
function Status({
  configured,
  text,
  detail,
}: {
  configured: boolean;
  text: string;
  detail?: string;
}) {
  return (
    <span className={`template-status ${configured ? 'is-configured' : ''}`}>
      {configured ? (
        <Check className="size-4" />
      ) : (
        <Circle className="size-4" />
      )}
      <span>
        {text}
        {detail && <small>{detail}</small>}
      </span>
    </span>
  );
}
function LocalPreview({ file }: { file: File }) {
  const url = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return <img src={url} alt="Selected template preview" />;
}
function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
function teamLabel(value: string) {
  return value === 'Buildhers'
    ? 'BuildHers+'
    : value === 'Relation'
      ? 'Relations'
      : value === 'Operation'
        ? 'Operations'
        : value;
}
