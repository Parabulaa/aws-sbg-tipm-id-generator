import type { Category } from './domain';
export const WIDTH = 1200;
export const HEIGHT = 1950;
export type Side = 'front' | 'back';
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
export type TextField =
  | 'name'
  | 'role'
  | 'full_name'
  | 'aws_sbg_id'
  | 'email'
  | 'tip_email'
  | 'student_id_number'
  | 'program'
  | 'year_level'
  | 'membership_type'
  | 'officer_position'
  | 'date_issued'
  | 'valid_until'
  | 'team';
export interface TextBox extends Rect {
  field: TextField;
  fontSize: number;
  minFontSize: number;
  color: string;
  align: 'left' | 'center' | 'right';
  weight: 'normal' | 'bold';
  /** Defaults to Arial for older templates. Montserrat gives the approved rounded geometric ID style. */
  fontFamily?: 'arial' | 'montserrat';
}
export interface TemplateLayout {
  photo?: Rect;
  fields: TextBox[];
  accents: (Rect & { label?: string })[];
}
export interface Template {
  key: string;
  category: Category;
  side: Side;
  image: string;
  layout: TemplateLayout;
  version: string;
  approved: boolean;
}
export function validateLayout(layout: TemplateLayout) {
  if (
    !layout ||
    !Array.isArray(layout.fields) ||
    !Array.isArray(layout.accents)
  )
    throw new Error('Layout requires fields and accents arrays.');
  if (layout.fields.length > 20 || layout.accents.length > 20)
    throw new Error('Too many template regions.');
  for (const rect of [
    ...layout.fields,
    ...layout.accents,
    ...(layout.photo ? [layout.photo] : []),
  ]) {
    if (
      ![rect.x, rect.y, rect.width, rect.height].every(Number.isFinite) ||
      rect.x < 0 ||
      rect.y < 0 ||
      rect.width <= 0 ||
      rect.height <= 0 ||
      rect.x + rect.width > WIDTH ||
      rect.y + rect.height > HEIGHT
    )
      throw new Error('Every template region must fit within 1200 × 1950.');
  }
  for (const field of layout.fields) {
    if (
      ![
        'name',
        'role',
        'full_name',
        'aws_sbg_id',
        'email',
        'tip_email',
        'student_id_number',
        'program',
        'year_level',
        'membership_type',
        'officer_position',
        'date_issued',
        'valid_until',
        'team',
      ].includes(field.field) ||
      !/^#[0-9a-f]{6}$/i.test(field.color) ||
      !['left', 'center', 'right'].includes(field.align) ||
      !['normal', 'bold'].includes(field.weight) ||
      (field.fontFamily !== undefined &&
        !['arial', 'montserrat'].includes(field.fontFamily)) ||
      !Number.isFinite(field.fontSize) ||
      !Number.isFinite(field.minFontSize) ||
      field.minFontSize < 12 ||
      field.fontSize > 180 ||
      field.minFontSize > field.fontSize
    )
      throw new Error('Invalid text field configuration.');
  }
}
