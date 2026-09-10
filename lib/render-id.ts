import { displayName, accentColor, contrastText } from './domain';
import type { MemberRecord, ColorSettings, Crop } from './domain';
import { WIDTH, HEIGHT } from './templates';
import type { Template, TextBox } from './templates';
import { fileUrl } from './client';
export async function loadImage(src: string) {
  const image = new Image();
  let objectUrl = '';
  if (src.startsWith('/api/files/')) {
    const { getAccessToken } = await import('./supabase/client');
    const token = await getAccessToken();
    const response = await fetch(src, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!response.ok)
      throw new Error('The private template or photo could not be loaded.');
    objectUrl = URL.createObjectURL(await response.blob());
    image.src = objectUrl;
  } else image.src = src;
  try {
    await image.decode();
  } catch {
    throw new Error(
      'Image could not be loaded. Check the photo and approved template files.',
    );
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
  return image;
}
export function photoSource(
  width: number,
  height: number,
  aspect: number,
  crop: Crop,
) {
  let w = width,
    h = height;
  if (w / h > aspect) w = h * aspect;
  else h = w / aspect;
  w /= crop.zoom;
  h /= crop.zoom;
  return {
    x: (width - w) * crop.x,
    y: (height - h) * crop.y,
    width: w,
    height: h,
  };
}
function wrapText(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    if (ctx.measureText(word).width > width) {
      if (line) {
        lines.push(line);
        line = '';
      }
      for (const character of Array.from(word)) {
        if (ctx.measureText(line + character).width > width) {
          lines.push(line);
          line = '';
        }
        line += character;
      }
    } else if (line && ctx.measureText(`${line} ${word}`).width > width) {
      lines.push(line);
      line = word;
    } else line += (line ? ' ' : '') + word;
  }
  if (line) lines.push(line);
  return lines;
}
function canvasFontFamily(fontFamily: TextBox['fontFamily']) {
  if (fontFamily !== 'montserrat') return 'Arial, Helvetica, sans-serif';
  if (typeof document === 'undefined') return 'Montserrat, Arial, sans-serif';
  return (
    getComputedStyle(document.documentElement).getPropertyValue(
      '--font-montserrat',
    ).trim() || 'Montserrat, Arial, sans-serif'
  );
}
function drawText(ctx: CanvasRenderingContext2D, text: string, box: TextBox) {
  let lines: string[] = [];
  let font = box.fontSize;
  const family = canvasFontFamily(box.fontFamily);
  for (; font >= box.minFontSize; font--) {
    ctx.font = `${box.weight} ${font}px ${family}`;
    lines = wrapText(ctx, text, box.width);
    if (
      lines.length * font * 1.15 <= box.height &&
      lines.every((line) => ctx.measureText(line).width <= box.width)
    )
      break;
  }
  if (font < box.minFontSize)
    throw new Error(
      `The ${box.field} is too long for its approved template region. Adjust the approved mapping before generation.`,
    );
  ctx.fillStyle = box.color;
  ctx.textAlign = box.align;
  ctx.textBaseline = 'top';
  const x =
    box.x +
    (box.align === 'center'
      ? box.width / 2
      : box.align === 'right'
        ? box.width
        : 0);
  lines.forEach((line, index) =>
    ctx.fillText(line, x, box.y + index * font * 1.15),
  );
}
export async function renderID(
  canvas: HTMLCanvasElement,
  member: MemberRecord,
  template: Template,
  colors: ColorSettings,
  photoOverride?: string,
) {
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas rendering is unavailable in this browser.');
  if (typeof document !== 'undefined' && document.fonts) {
    await Promise.all(
      template.layout.fields.map((box) =>
        document.fonts.load(
          `${box.weight === 'bold' ? 800 : 500} ${box.fontSize}px ${canvasFontFamily(box.fontFamily)}`,
        ),
      ),
    );
  }
  const background = await loadImage(fileUrl(template.image));
  if (background.naturalWidth !== WIDTH || background.naturalHeight !== HEIGHT)
    throw new Error('Approved template dimensions do not match 1200 × 1950.');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.drawImage(background, 0, 0, WIDTH, HEIGHT);
  const accent = accentColor(member, colors);
  for (const region of template.layout.accents) {
    ctx.fillStyle = accent;
    ctx.fillRect(region.x, region.y, region.width, region.height);
    if (region.label) {
      ctx.fillStyle = contrastText(accent);
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        region.label,
        region.x + region.width / 2,
        region.y + region.height / 2,
        region.width - 20,
      );
    }
  }
  const rect = template.layout.photo;
  if (rect && (photoOverride || member.photo_path)) {
    const image = await loadImage(photoOverride || fileUrl(member.photo_path!));
    const crop = photoSource(
      image.naturalWidth,
      image.naturalHeight,
      rect.width / rect.height,
      member.photo_crop_data,
    );
    ctx.drawImage(
      image,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      rect.x,
      rect.y,
      rect.width,
      rect.height,
    );
  }
  const fields = {
    name: displayName(member),
    full_name: member.full_name,
    role:
      member.membership_type === 'Officer'
        ? member.officer_position
        : member.membership_type === 'Associate'
          ? 'Associate Member'
          : 'Member',
    aws_sbg_id: member.aws_sbg_id,
    email: member.tip_email,
    tip_email: member.tip_email,
    student_id_number: member.student_id_number,
    program: member.program,
    year_level: member.year_level,
    membership_type: member.membership_type,
    officer_position: member.officer_position,
    date_issued: member.date_issued ?? '',
    valid_until: member.valid_until ?? '',
    team: member.team,
  };
  for (const box of template.layout.fields) {
    const onAccent = template.layout.accents.some(
      (region) =>
        box.x >= region.x &&
        box.y >= region.y &&
        box.x + box.width <= region.x + region.width &&
        box.y + box.height <= region.y + region.height,
    );
    drawText(
      ctx,
      fields[box.field] ?? '',
      onAccent ? { ...box, color: contrastText(accent) } : box,
    );
  }
}
export function pngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error('PNG encoding failed.')),
      'image/png',
    ),
  );
}
export async function normalizePhoto(file: File) {
  if (
    !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
    file.size > 8 * 1024 * 1024
  )
    throw new Error('Choose a JPG, PNG, or WebP image smaller than 8 MB.');
  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    if (
      image.naturalWidth < 100 ||
      image.naturalHeight < 100 ||
      image.naturalWidth * image.naturalHeight > 40_000_000
    )
      throw new Error(
        'Photo must be at least 100 × 100 pixels and below 40 megapixels.',
      );
    const canvas = document.createElement('canvas');
    const scale = Math.min(
      1,
      // Keep the normalized PNG comfortably below the private storage and
      // request limits while retaining more than enough detail for a photo
      // rendered into a 1200 × 1950 ID.
      1200 / Math.max(image.naturalWidth, image.naturalHeight),
    );
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    canvas
      .getContext('2d')!
      .drawImage(image, 0, 0, canvas.width, canvas.height);
    return await pngBlob(canvas);
  } finally {
    URL.revokeObjectURL(url);
  }
}
