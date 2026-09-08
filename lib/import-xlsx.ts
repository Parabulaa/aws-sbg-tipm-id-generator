import ExcelJS from 'exceljs';
import { blankMember, normalizeMember, validateMember } from './domain';
import type { MemberInput } from './domain';
export interface ImportRow {
  row: number;
  member: MemberInput;
  errors: string[];
}
const required = [
  'first_name',
  'last_name',
  'email',
  'membership_type',
  'aws_sbg_id',
  'date_issued',
  'valid_until',
];
export async function parseXlsx(
  bytes: ArrayBuffer,
  existingIds: string[],
): Promise<ImportRow[]> {
  if (bytes.byteLength > 10 * 1024 * 1024)
    throw new Error('XLSX must be smaller than 10 MB.');
  // Inspect ZIP metadata before expanding the workbook to reject oversized archives.
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
  const headers = new Map<string, number>();
  sheet.getRow(1).eachCell((cell, index) => {
    const name = cell.text.trim().toLowerCase().replace(/[ -]+/g, '_');
    if (headers.has(name)) throw new Error(`Duplicate column: ${name}`);
    headers.set(name, index);
  });
  const missing = required.filter((key) => !headers.has(key));
  if (missing.length)
    throw new Error(`Missing required columns: ${missing.join(', ')}`);
  const rows: ImportRow[] = [];
  const known = new Set(existingIds.map((id) => id.trim().toUpperCase()));
  for (let number = 2; number <= sheet.rowCount; number++) {
    const row = sheet.getRow(number);
    if (!row.hasValues) continue;
    const raw: Record<string, string> = {};
    const cellErrors: string[] = [];
    for (const key of Object.keys(blankMember)) {
      const column = headers.get(key);
      const cell = column ? row.getCell(column) : undefined;
      if (
        cell?.type === ExcelJS.ValueType.Formula ||
        cell?.type === ExcelJS.ValueType.Error
      )
        cellErrors.push(`${key}: replace formulas or errors with plain values`);
      let value = cell?.value;
      if (
        ['date_issued', 'valid_until'].includes(key) &&
        typeof value === 'number'
      )
        value = new Date(Date.UTC(1899, 11, 30) + value * 86400000);
      raw[key] =
        value instanceof Date
          ? value.toISOString().slice(0, 10)
          : cell?.text.trim() || '';
    }
    const member = normalizeMember(raw);
    const errors = [...cellErrors, ...validateMember(member)];
    if (known.has(member.aws_sbg_id))
      errors.push(`Duplicate ID: ${member.aws_sbg_id}`);
    rows.push({ row: number, member, errors });
  }
  const counts = new Map<string, number>();
  for (const row of rows)
    counts.set(
      row.member.aws_sbg_id,
      (counts.get(row.member.aws_sbg_id) || 0) + 1,
    );
  for (const row of rows)
    if ((counts.get(row.member.aws_sbg_id) || 0) > 1)
      row.errors.push(`Duplicate ID within workbook: ${row.member.aws_sbg_id}`);
  if (!rows.length) throw new Error('The workbook has no member rows.');
  return rows;
}
