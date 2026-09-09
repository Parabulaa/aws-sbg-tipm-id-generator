import ExcelJS from 'exceljs';
import { normalizeMember, validateMember } from './domain';
import type { Category, MemberInput, MemberRecord } from './domain';

export interface ImportRow {
  row: number;
  member: MemberInput;
  errors: string[];
  duplicate: boolean;
}

const required = [
  'full_name',
  'tip_email',
  'student_id_number',
  'program',
  'year_level',
] as const;

const aliases = new Map([
  ['full name', 'full_name'],
  ['full_name', 'full_name'],
  ['t.i.p. email', 'tip_email'],
  ['tip email', 'tip_email'],
  ['tip_email', 'tip_email'],
  ['student id number', 'student_id_number'],
  ['student_id_number', 'student_id_number'],
  ['department/program', 'program'],
  ['department program', 'program'],
  ['program', 'program'],
  ['year level', 'year_level'],
  ['year_level', 'year_level'],
] as const);

export function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, ' ')
    .replace(/\s*\/\s*/g, '/')
    .replace(/\s+/g, ' ');
}

export async function parseXlsx(
  bytes: ArrayBuffer,
  existingMembers: Pick<MemberRecord, 'tip_email' | 'student_id_number'>[] = [],
  classification: Category = 'Member',
): Promise<ImportRow[]> {
  if (bytes.byteLength > 10 * 1024 * 1024)
    throw new Error('XLSX must be smaller than 10 MB.');
  const view = new DataView(bytes);
  let expanded = 0;
  let entries = 0;
  for (let i = 0; i + 46 <= bytes.byteLength; i++)
    if (view.getUint32(i, true) === 0x02014b50) {
      expanded += view.getUint32(i + 24, true);
      entries++;
      if (expanded > 50 * 1024 * 1024 || entries > 1000)
        throw new Error('Workbook is too large when expanded.');
      i +=
        45 +
        view.getUint16(i + 28, true) +
        view.getUint16(i + 30, true) +
        view.getUint16(i + 32, true);
    }
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(bytes);
  } catch {
    throw new Error(
      'Invalid XLSX workbook. Save the spreadsheet as .xlsx and try again.',
    );
  }
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error('The workbook has no worksheets.');
  if (sheet.rowCount > 501)
    throw new Error('Import up to 500 rows per workbook.');
  const headers = new Map<(typeof required)[number], number>();
  sheet.getRow(1).eachCell((cell, index) => {
    const normalized = normalizeHeader(cell.text);
    const key = aliases.get(normalized as never);
    if (!key) return;
    if (headers.has(key)) throw new Error(`Duplicate column: ${cell.text}`);
    headers.set(key, index);
  });
  const missing = required.filter((key) => !headers.has(key));
  if (missing.length)
    throw new Error(`Missing required columns: ${missing.join(', ')}`);

  const existingEmails = new Set(
    existingMembers.map((member) => member.tip_email.trim().toLowerCase()),
  );
  const existingStudentIds = new Set(
    existingMembers.map((member) => member.student_id_number.trim()),
  );
  const rows: ImportRow[] = [];
  for (let number = 2; number <= sheet.rowCount; number++) {
    const row = sheet.getRow(number);
    if (!row.hasValues) continue;
    const raw: Record<string, string> = {
      membership_type: classification,
      officer_position: '',
      team: '',
    };
    const cellErrors: string[] = [];
    for (const key of required) {
      const cell = row.getCell(headers.get(key)!);
      if (
        cell.type === ExcelJS.ValueType.Formula ||
        cell.type === ExcelJS.ValueType.Error
      )
        cellErrors.push(`${key}: replace formulas or errors with plain values`);
      raw[key] = cell.text.trim();
    }
    const member = normalizeMember(raw);
    const duplicateErrors: string[] = [];
    if (existingEmails.has(member.tip_email))
      duplicateErrors.push('T.I.P. email already exists');
    if (existingStudentIds.has(member.student_id_number))
      duplicateErrors.push('Student ID number already exists');
    const validationErrors = validateMember(member).filter(
      (error) =>
        classification !== 'Officer' ||
        !['Officer position is required', 'Officer team is required'].includes(
          error,
        ),
    );
    rows.push({
      row: number,
      member,
      errors: [...cellErrors, ...validationErrors, ...duplicateErrors],
      duplicate: duplicateErrors.length > 0,
    });
  }
  const emailCounts = new Map<string, number>();
  const studentCounts = new Map<string, number>();
  for (const row of rows) {
    emailCounts.set(
      row.member.tip_email,
      (emailCounts.get(row.member.tip_email) ?? 0) + 1,
    );
    studentCounts.set(
      row.member.student_id_number,
      (studentCounts.get(row.member.student_id_number) ?? 0) + 1,
    );
  }
  for (const row of rows) {
    if ((emailCounts.get(row.member.tip_email) ?? 0) > 1) {
      row.errors.push('Duplicate T.I.P. email within workbook');
      row.duplicate = true;
    }
    if ((studentCounts.get(row.member.student_id_number) ?? 0) > 1) {
      row.errors.push('Duplicate Student ID number within workbook');
      row.duplicate = true;
    }
    row.errors = [...new Set(row.errors)];
  }
  if (!rows.length) throw new Error('The workbook has no member rows.');
  return rows;
}
