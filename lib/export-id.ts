import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { renderID, pngBlob } from './render-id';
import { safeFilename } from './domain';
import type { MemberRecord, ColorSettings, Generation } from './domain';
import type { Template } from './templates';
import { api, fileUrl } from './client';
export async function generateMember(
  member: MemberRecord,
  templates: Template[],
  colors: ColorSettings,
) {
  if (member.status !== 'Ready')
    throw new Error('Only Ready members can be generated.');
  const sides = ['front', 'back'] as const;
  const selected = sides.map((side) =>
    templates.find(
      (template) =>
        template.category === member.membership_type &&
        template.side === side &&
        template.approved,
    ),
  );
  if (selected.some((template) => !template))
    throw new Error(
      `Approved ${member.membership_type} front and back templates are required.`,
    );
  const images: Blob[] = [];
  for (const template of selected) {
    const canvas = document.createElement('canvas');
    await renderID(canvas, member, template!, colors);
    images.push(await pngBlob(canvas));
    canvas.width = 0;
    canvas.height = 0;
  }
  const pdfDocument = await PDFDocument.create();
  for (const blob of images) {
    const image = await pdfDocument.embedPng(await blob.arrayBuffer());
    const page = pdfDocument.addPage([288, 468]);
    page.drawImage(image, { x: 0, y: 0, width: 288, height: 468 });
  }
  const pdf = await pdfDocument.save();
  const form = new FormData();
  form.set('member_id', member.id);
  form.set('revision', String(member.revision));
  form.set('color_revision', String(colors.revision));
  form.set(
    'template_version',
    selected.map((template) => template!.version).join(':'),
  );
  form.set('front', images[0], 'front.png');
  form.set('back', images[1], 'back.png');
  form.set(
    'pdf',
    new Blob([Uint8Array.from(pdf)], { type: 'application/pdf' }),
    'ID.pdf',
  );
  return api<Generation>('generations', { method: 'POST', body: form });
}
export async function downloadFile(key: string, name: string) {
  const response = await fetch(fileUrl(key));
  if (!response.ok) throw new Error('Download failed. Refresh and try again.');
  saveBlob(await response.blob(), name);
}
export function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
export async function exportZip(
  records: Generation[],
  progress: (message: string) => void,
) {
  if (!records.length) throw new Error('Select at least one generated ID.');
  const zip = new JSZip();
  let index = 0;
  let size = 0;
  for (const record of records) {
    progress(`Preparing ZIP — ${++index} / ${records.length}`);
    const category =
      record.member.membership_type === 'Officer'
        ? 'Officers'
        : record.member.membership_type === 'Associate'
          ? 'Associates'
          : 'Members';
    const folder = `AWS-SBG-IDs/${category}/${safeFilename(record.member)}_${record.id.slice(0, 8)}`;
    for (const name of ['front.png', 'back.png', 'ID.pdf']) {
      const response = await fetch(fileUrl(`exports/${record.id}/${name}`));
      if (!response.ok)
        throw new Error(
          `Could not download ${record.member.aws_sbg_id}. Retry the ZIP download.`,
        );
      const data = await response.arrayBuffer();
      size += data.byteLength;
      if (size > 300 * 1024 * 1024)
        throw new Error('This ZIP exceeds 300 MB. Export a smaller selection.');
      zip.file(`${folder}/${name}`, data);
    }
  }
  const blob = await zip.generateAsync(
    { type: 'blob', compression: 'STORE' },
    (metadata) => progress(`Creating ZIP — ${Math.round(metadata.percent)}%`),
  );
  saveBlob(blob, 'AWS-SBG-IDs.zip');
}
