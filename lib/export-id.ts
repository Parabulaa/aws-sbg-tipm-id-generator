import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { renderID, pngBlob } from './render-id';
import { safeFilename } from './domain';
import type { MemberRecord, ColorSettings, Generation } from './domain';
import type { Template } from './templates';
import { selectTemplate } from './templates';
import { api, fetchPrivateFile } from './client';
import { getSupabaseBrowserClient } from './supabase/client';
export async function generateMember(
  member: MemberRecord,
  templates: Template[],
  colors: ColorSettings,
  side: 'front' | 'both' = 'both',
) {
  if (member.status !== 'Ready')
    throw new Error('Only Ready members can be generated.');
  const sides = side === 'front' ? (['front'] as const) : (['front', 'back'] as const);
  const selected = sides.map((side) =>
    selectTemplate(templates, member, side),
  );
  if (selected.some((template) => !template))
    throw new Error(
      `Approved ${member.membership_type} ${side === 'front' ? 'front' : 'front and back'} templates are required.`,
    );
  const images: Blob[] = [];
  for (const template of selected) {
    const canvas = document.createElement('canvas');
    await renderID(canvas, member, template!, colors);
    images.push(await pngBlob(canvas));
    canvas.width = 0;
    canvas.height = 0;
  }
  const files: Array<{ name: 'front' | 'back' | 'pdf'; blob: Blob; filename: string }> = [
    { name: 'front', blob: images[0], filename: 'front.png' },
  ];
  if (side === 'both') {
    const pdfDocument = await PDFDocument.create();
    for (const blob of images) {
      const image = await pdfDocument.embedPng(await blob.arrayBuffer());
      const page = pdfDocument.addPage([288, 468]);
      page.drawImage(image, { x: 0, y: 0, width: 288, height: 468 });
    }
    const pdf = await pdfDocument.save();
    files.push(
      { name: 'back', blob: images[1], filename: 'back.png' },
      {
        name: 'pdf',
        blob: new Blob([Uint8Array.from(pdf)], { type: 'application/pdf' }),
        filename: 'ID.pdf',
      },
    );
  }

  // Upload large rendered files directly to private Supabase Storage. Sending
  // the PNGs and PDF together through the deployed API can exceed its request
  // body limit before our route is reached.
  const generationId = crypto.randomUUID();
  const base = `${member.id}/${generationId}`;
  const client = getSupabaseBrowserClient();
  const paths: Partial<Record<'front' | 'back' | 'pdf', string>> = {};
  for (const file of files) {
    const objectPath = `${base}/${file.filename}`;
    const { error } = await client.storage.from('generated-ids').upload(
      objectPath,
      file.blob,
      { contentType: file.blob.type, upsert: false },
    );
    if (error)
      throw new Error(
        `The generated ${file.name} file could not be uploaded. Please try again.`,
      );
    paths[file.name] = `generated-ids/${objectPath}`;
  }

  return api<Generation>('generations', {
    method: 'POST',
    body: JSON.stringify({
      member_id: member.id,
      revision: member.revision,
      color_revision: colors.revision,
      template_version: selected.map((template) => template!.version).join(':'),
      side,
      generation_id: generationId,
      files: paths,
    }),
  });
}
export async function downloadFile(key: string, name: string) {
  const response = await fetchPrivateFile(key);
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
    for (const [name, path] of [
      ['front.png', record.front_path],
      ['back.png', record.back_path],
      ['ID.pdf', record.pdf_path],
    ] as const) {
      if (!path) continue;
      const response = await fetchPrivateFile(path);
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
