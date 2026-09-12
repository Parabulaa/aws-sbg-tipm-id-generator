'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Check, CheckCircle2, ChevronLeft, ChevronRight, Download, Eye,
  FileDown, FileText, Image as ImageIcon, Loader2, Palette,
  RotateCcw, Save, Search, UserRound, Users,
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { useData } from './data-provider';
import { MemberForm } from './member-form';
import { PhotoEditor } from './photo-editor';
import { IDPreview } from './id-preview';
import { StatusBadge } from './status-badge';
import {
  accentColor, displayName, safeFilename, validateMember,
} from '@/lib/domain';
import type { MemberRecord, Generation } from '@/lib/domain';
import type { Side } from '@/lib/templates';
import { selectTemplate } from '@/lib/templates';
import { api, errorText } from '@/lib/client';
import { pngBlob, renderID } from '@/lib/render-id';
import { downloadFile, generateMember, saveBlob } from '@/lib/export-id';
import { Toaster, toast } from '@/components/ui/toast';

type BusyAction =
  | '' | 'save' | 'next' | 'confirm' | 'generate' | 'front'
  | 'back' | 'pdf' | 'print';
type WorkspaceTab = 'information' | 'photo' | 'appearance';

function CardHeading({
  icon, title, description, trailing,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="generate-card-heading">
      <span className="generate-card-icon">{icon}</span>
      <div className="min-w-0 flex-1">
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {trailing}
    </div>
  );
}

function ActionLabel({
  busy, busyText, children,
}: {
  busy: boolean;
  busyText: string;
  children: React.ReactNode;
}) {
  return busy ? <><Loader2 className="size-4 animate-spin" />{busyText}</> : <>{children}</>;
}

export function GenerateIdWorkspace() {
  const { members, loading } = useData();
  const params = useSearchParams();
  const [selected, setSelected] = useState('');
  const [query, setQuery] = useState('');
  const member = members.find((record) => record.id === (selected || params.get('member'))) || members[0];

  const filtered = useMemo(() => members.filter((record) =>
    [displayName(record), record.tip_email, record.aws_sbg_id, record.student_id_number]
      .join(' ').toLowerCase().includes(query.toLowerCase())), [members, query]);

  if (loading) {
    return <output className="sr-only">Loading members</output>;
  }

  if (!member) {
    return (
      <div className="mt-4 notice">
        No members imported yet. <Link className="underline" href="/members">Upload an XLSX file to begin.</Link>
      </div>
    );
  }

  const index = members.findIndex((record) => record.id === member.id);
  return (
    <Toaster>
      <div className="generate-workspace">
        <ReviewEditor
          key={member.id}
          initial={member}
          query={query}
          onQueryChange={setQuery}
          choices={filtered}
          index={index}
          total={members.length}
          onSelect={setSelected}
          previous={() => setSelected(members[Math.max(0, index - 1)].id)}
          next={() => setSelected(members[Math.min(members.length - 1, index + 1)].id)}
          first={index === 0}
          last={index === members.length - 1}
        />
      </div>
    </Toaster>
  );
}

function ReviewEditor({
  initial, query, onQueryChange, choices, index, total, onSelect,
  previous, next, first, last,
}: {
  initial: MemberRecord;
  query: string;
  onQueryChange: (value: string) => void;
  choices: MemberRecord[];
  index: number;
  total: number;
  onSelect: (value: string) => void;
  previous: () => void;
  next: () => void;
  first: boolean;
  last: boolean;
}) {
  const { colors, templates, generations, refresh } = useData();
  const [member, setMember] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState<BusyAction>('');
  const [error, setError] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string>();
  const [side, setSide] = useState<Side>('front');
  const [generation, setGeneration] = useState<Generation>();
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('information');
  const dirty = JSON.stringify(member) !== JSON.stringify(saved);
  const latestGeneration = generation || generations.find((record) => record.member_id === member.id);
  const assignedMember = { ...member, color_override: null };
  const assignedColor = accentColor(assignedMember, colors);
  const currentColor = accentColor(member, colors);
  const assignedName = member.membership_type === 'Officer'
    ? (member.team || 'Executive')
    : member.membership_type;
  const errors = validateMember(member);

  useEffect(() => {
    if (!dirty && initial.revision > saved.revision) {
      queueMicrotask(() => {
        setMember(initial);
        setSaved(initial);
      });
    }
  }, [initial, dirty, saved.revision]);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (dirty || photoPreview) event.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty, photoPreview]);

  function notify(message: string, type: 'success' | 'error' = 'success') {
    toast.add({ title: message, type, timeout: 3200 });
  }

  async function save() {
    if (photoPreview) throw new Error('Apply the uploaded photo before saving.');
    if (!dirty) return member;
    const updated = await api<MemberRecord>(`members/${member.id}`, {
      method: 'PUT',
      body: JSON.stringify(member),
    });
    setMember(updated);
    setSaved(updated);
    await refresh();
    return updated;
  }

  async function action(label: BusyAction, operation: () => Promise<void>) {
    setBusy(label);
    setError('');
    try {
      await operation();
    } catch (caught) {
      const message = errorText(caught);
      setError(message);
      notify(message, 'error');
    } finally {
      setBusy('');
    }
  }

  function focusFirstInvalid() {
    setWorkspaceTab('information');
    const firstInput = document.querySelector<HTMLElement>('.generate-member-workspace input, .generate-member-workspace select');
    firstInput?.focus();
    firstInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async function confirm() {
    if (errors.length) {
      focusFirstInvalid();
      throw new Error(errors[0]);
    }
    if (!member.photo_path || photoPreview) {
      setWorkspaceTab('photo');
      document.querySelector<HTMLElement>('.generate-member-workspace')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      throw new Error(photoPreview ? 'Apply the uploaded photo first.' : 'Upload a member photo first.');
    }
    const updated = await save();
    const confirmed = await api<MemberRecord>(`members/${member.id}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ revision: updated.revision }),
    });
    setMember(confirmed);
    setSaved(confirmed);
    await refresh();
    notify('ID confirmed and Ready for generation.');
    return confirmed;
  }

  async function readyForGeneration() {
    if (dirty || photoPreview) throw new Error('Save and confirm the latest changes before generating.');
    if (member.status === 'Generated') {
      return api<MemberRecord>(`members/${member.id}/confirm`, {
        method: 'POST',
        body: JSON.stringify({ revision: member.revision }),
      });
    }
    if (member.status !== 'Ready') throw new Error('Confirm this ID before generating.');
    return member;
  }

  async function generateCurrentSide() {
    const current = await readyForGeneration();
    const result = await generateMember(current, templates, colors, side === 'front' ? 'front' : 'both');
    setGeneration(result);
    const updated = { ...current, status: 'Generated' as const, revision: current.revision + 1 };
    setMember(updated);
    setSaved(updated);
    await refresh();
    notify(
      side === 'front'
        ? 'ID files generated and saved in history.'
        : 'Back ID generated and saved in history.',
    );
  }

  async function renderSideBlob(targetSide: Side) {
    const template = selectTemplate(templates, member, targetSide);
    if (!template) throw new Error(`Approved ${targetSide} template is not configured.`);
    const canvas = document.createElement('canvas');
    await renderID(canvas, member, template, colors, photoPreview);
    const blob = await pngBlob(canvas);
    canvas.width = 0;
    canvas.height = 0;
    return blob;
  }

  async function createPrintPdf() {
    const [front, back] = await Promise.all([renderSideBlob('front'), renderSideBlob('back')]);
    const document = await PDFDocument.create();
    for (const blob of [front, back]) {
      const image = await document.embedPng(await blob.arrayBuffer());
      const page = document.addPage([288, 468]);
      page.drawImage(image, { x: 0, y: 0, width: 288, height: 468 });
    }
    return new Blob([Uint8Array.from(await document.save())], { type: 'application/pdf' });
  }

  async function savePng(targetSide: Side) {
    const path = targetSide === 'front' ? latestGeneration?.front_path : latestGeneration?.back_path;
    const name = `${safeFilename(member)}_${targetSide}.png`;
    if (path) await downloadFile(path, name);
    else saveBlob(await renderSideBlob(targetSide), name);
    notify(`${targetSide === 'front' ? 'Front' : 'Back'} PNG saved`);
  }

  const generatedAt = latestGeneration?.generated_at
    ? new Date(latestGeneration.generated_at).toLocaleString()
    : 'Not generated';
  const statusItems = [
    ['Front PNG', !!latestGeneration?.front_path],
    ['Back PNG', !!latestGeneration?.back_path],
    ['Print PDF', !!latestGeneration?.pdf_path],
  ] as const;

  return (
    <div className="generate-main-grid">
      <div className="generate-left-column">
        <section className="generate-card generate-selection-card">
          <CardHeading
            icon={<Users className="size-4" />}
            title="Member Selection"
            description="Search for a member or select from the list."
            trailing={<span className="generate-member-count">Member {index + 1} of {total}</span>}
          />
          <div className="generate-selection-fields">
            <label className="field generate-search-field">
              <span className="sr-only">Search member</span>
              <Search className="generate-input-icon size-4" />
              <input
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder="Search name, ID, or email..."
              />
            </label>
            <label className="field">
              <span className="sr-only">Select member</span>
              <select
                aria-label="Select member"
                value={member.id}
                onChange={(event) => onSelect(event.target.value)}
              >
                {(choices.some((record) => record.id === member.id) ? choices : [member, ...choices])
                  .filter((record, position, list) => list.findIndex((item) => item.id === record.id) === position)
                  .map((record) => (
                    <option key={record.id} value={record.id}>
                      {displayName(record)} — {record.status}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <div className="generate-workflow-actions">
            <button className="btn" type="button" disabled={!!busy || first} onClick={previous}>
              <ChevronLeft className="size-4" /> Previous
            </button>
            <button className="btn" type="button" disabled={!!busy || !dirty} onClick={() => void action('save', async () => {
              await save();
              notify('Member information saved');
            })}>
              <ActionLabel busy={busy === 'save'} busyText="Saving..."><Save className="size-4" /> Save Information</ActionLabel>
            </button>
            <button className="btn" type="button" disabled={!!busy || last} onClick={() => void action('next', async () => {
              await save();
              notify('Member information saved');
              next();
            })}>
              <ActionLabel busy={busy === 'next'} busyText="Saving...">Save &amp; Next <ChevronRight className="size-4" /></ActionLabel>
            </button>
            <button className="btn-primary" type="button" disabled={!!busy} onClick={() => void action('confirm', async () => { await confirm(); })}>
              <ActionLabel busy={busy === 'confirm'} busyText="Confirming..."><Check className="size-4" /> Confirm ID</ActionLabel>
            </button>
          </div>
          {error && <p role="alert" className="notice-error">{error}</p>}
        </section>

        <section className="generate-card generate-member-workspace">
          <CardHeading
            icon={<UserRound className="size-4" />}
            title="Member Workspace"
            description="Manage member details, photo, and appearance settings."
            trailing={<StatusBadge status={dirty ? 'Draft' : member.status} />}
          />
          <div className="generate-workspace-tabs" role="tablist" aria-label="Member workspace">
            <button type="button" role="tab" aria-selected={workspaceTab === 'information'} onClick={() => setWorkspaceTab('information')}><FileText className="size-4" /> Information</button>
            <button type="button" role="tab" aria-selected={workspaceTab === 'photo'} onClick={() => setWorkspaceTab('photo')}><ImageIcon className="size-4" /> Photo Adjustment</button>
            <button type="button" role="tab" aria-selected={workspaceTab === 'appearance'} onClick={() => setWorkspaceTab('appearance')}><Palette className="size-4" /> Appearance</button>
          </div>
          <div className="generate-workspace-panel" role="tabpanel">
            {workspaceTab === 'information' && <>
              <fieldset disabled={!!busy} className="generate-form-wrap"><MemberForm value={member} onChange={(value) => setMember({ ...member, ...value })} /></fieldset>
              {!!errors.length && <p className="notice-error" role="alert">{errors.join('; ')}</p>}
            </>}
            {workspaceTab === 'appearance' && <div className="generate-color-row">
              <div className="generate-color-label"><span className="generate-color-swatch" style={{ backgroundColor: currentColor }} /><span><strong>{assignedName}</strong><small>{currentColor.toUpperCase()}</small></span></div>
              {member.membership_type === 'Officer' && <label className="generate-color-picker"><span>Adjust</span><input type="color" value={member.color_override || assignedColor} aria-label="Temporarily adjust assigned team color" onChange={(event) => setMember({ ...member, color_override: event.target.value })} /></label>}
              <button className="btn generate-reset-color" type="button" disabled={!member.color_override} onClick={() => { setMember({ ...member, color_override: null }); notify('Team color restored'); }}><RotateCcw className="size-4" /> Reset to Assigned Team Color</button>
            </div>}
            {workspaceTab === 'photo' && <div className="generate-photo-card"><PhotoEditor photoRegion={selectTemplate(templates, member, 'front')?.layout.photo} member={member} onCrop={(crop) => setMember({ ...member, photo_crop_data: crop })} onPreview={setPhotoPreview} onNotify={notify} onMember={(updated) => { setMember((current) => ({ ...current, photo_path: updated.photo_path, photo_crop_data: updated.photo_crop_data, revision: updated.revision, status: updated.status, updated_at: updated.updated_at })); setSaved(updated); void refresh().catch((caught) => setError(errorText(caught))); }} /></div>}
          </div>
        </section>

        <OutputSummary member={member} generatedAt={generatedAt} />
      </div>

      <div className="generate-right-column">
        <IDPreview
          member={member} templates={templates} colors={colors}
          photoOverride={photoPreview} side={side} onSideChange={setSide}
          footer={
            <button
              className="btn-primary generate-main-action" type="button"
              aria-label="Generate ID"
              disabled={!!busy || dirty || !!photoPreview || !['Ready', 'Generated'].includes(member.status)}
              onClick={() => void action('generate', generateCurrentSide)}
            >
              <ActionLabel busy={busy === 'generate'} busyText="Generating...">
                <ImageIcon className="size-4" /> Generate ID
              </ActionLabel>
            </button>
          }
        />

        <section className="generate-card generate-export-card">
          <CardHeading icon={<Download className="size-4" />} title="Export & Print" description="Export production-ready ID files." />
          <div className="generate-export-actions">
            <button className="btn" type="button" disabled={!!busy} onClick={() => void action('front', async () => savePng('front'))}>
              <ActionLabel busy={busy === 'front'} busyText="Saving..."><Download className="size-4" /> Save Front PNG</ActionLabel>
            </button>
            <button className="btn" type="button" disabled={!!busy} onClick={() => void action('back', async () => savePng('back'))}>
              <ActionLabel busy={busy === 'back'} busyText="Saving..."><Download className="size-4" /> Save Back PNG</ActionLabel>
            </button>
            <button className="btn" type="button" disabled={!!busy} onClick={() => void action('pdf', async () => {
              if (latestGeneration?.pdf_path) await downloadFile(latestGeneration.pdf_path, `${safeFilename(member)}_ID.pdf`);
              else saveBlob(await createPrintPdf(), `${safeFilename(member)}_ID.pdf`);
              notify('Print PDF created');
            })}>
              <ActionLabel busy={busy === 'pdf'} busyText="Creating..."><FileDown className="size-4" /> Download Print PDF</ActionLabel>
            </button>
            <button className="btn col-span-full" type="button" disabled={!!busy} onClick={() => void action('print', async () => {
              const url = URL.createObjectURL(await createPrintPdf());
              window.open(url, '_blank', 'noopener,noreferrer');
              window.setTimeout(() => URL.revokeObjectURL(url), 60000);
            })}>
              <ActionLabel busy={busy === 'print'} busyText="Preparing..."><Eye className="size-4" /> Open Print Layout</ActionLabel>
            </button>
          </div>
          <div className="generate-export-status">
            <h3>Generation Status</h3>
            <div>{statusItems.map(([label, ready]) => (
              <p key={label} className={ready ? 'is-ready' : ''}><CheckCircle2 className="size-5" /><span>{label}<small>{ready ? 'Ready' : 'Not generated'}</small></span></p>
            ))}</div>
          </div>
        </section>

      </div>
    </div>
  );
}

function OutputSummary({ member, generatedAt }: { member: MemberRecord; generatedAt: string }) {
  return <section className="generate-card generate-summary-card">
    <CardHeading icon={<FileText className="size-4" />} title="Output Summary" description="Summary of the generated ID files and details." trailing={<Link className="btn generate-view-files" href="/generated-ids">View Files</Link>} />
    <dl>
      <div><dt>Front file name</dt><dd><input aria-label="Front file name" readOnly title={`${safeFilename(member)}_front.png`} value={`${safeFilename(member)}_front.png`} /></dd></div>
      <div><dt>Validity</dt><dd>{member.valid_until || 'Not issued'}</dd></div>
      <div><dt>Back file name</dt><dd><input aria-label="Back file name" readOnly title={`${safeFilename(member)}_back.png`} value={`${safeFilename(member)}_back.png`} /></dd></div>
      <div><dt>Date Generated</dt><dd>{generatedAt}</dd></div>
      <div><dt>Member ID</dt><dd><input aria-label="Member ID" readOnly title={member.aws_sbg_id} value={member.aws_sbg_id} /></dd></div>
      <div><dt>Current status</dt><dd className="generate-current-status"><span />{member.status}</dd></div>
    </dl>
  </section>;
}
