import { test } from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import { normalizeHeader, parseXlsx } from '../lib/import-xlsx';

async function workbook(rows: unknown[][]) {
  const wb = new ExcelJS.Workbook();
  wb.addWorksheet('Members').addRows(rows);
  const bytes = await wb.xlsx.writeBuffer();
  return Uint8Array.from(new Uint8Array(bytes)).buffer;
}

const headers = [
  'Full Name',
  'T.I.P. Email',
  'Student ID number',
  'Department/Program',
  'Year Level',
];
const row = ['Test Person', 'test@example.org', '001234', 'BSCS', '2'];

void test('five-field member import preserves values and flags duplicates', async () => {
  const parsed = await parseXlsx(await workbook([headers, row]), []);
  assert.equal(parsed[0].member.full_name, 'Test Person');
  assert.equal(parsed[0].member.student_id_number, '001234');
  assert.equal(parsed[0].member.year_level, '2nd Year');
  assert.deepEqual(parsed[0].errors, []);
  const duplicate = await parseXlsx(await workbook([headers, row]), [
    { tip_email: 'test@example.org', student_id_number: '001234' },
  ]);
  assert.equal(duplicate[0].duplicate, true);
  assert.match(duplicate[0].errors.join(' '), /already exists/);
});

void test('header aliases, missing columns, and invalid workbooks are explicit', async () => {
  assert.equal(normalizeHeader('  Student_ID_Number '), 'student id number');
  await assert.rejects(() => parseXlsx(new ArrayBuffer(20)), /Invalid XLSX/);
  const bytes = await workbook([['name'], ['Test']]);
  await assert.rejects(() => parseXlsx(bytes), /Missing required columns/);
});
