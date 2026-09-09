import { test } from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import { normalizeHeader, parseXlsx } from '../lib/import-xlsx';

async function workbook(rows: unknown[][]) {
  const wb = new ExcelJS.Workbook();
  wb.addWorksheet('Members').addRows(rows);
  const bytes = await wb.xlsx.writeBuffer();
  return Uint8Array.from(new Uint8Array(bytes)).buffer;
}

async function prefixedWorkbook(rows: unknown[][]) {
  const source = await workbook(rows);
  const zip = await JSZip.loadAsync(source);
  for (const name of Object.keys(zip.files)) {
    if (!name.endsWith('.xml')) continue;
    const entry = zip.file(name);
    if (!entry) continue;
    let xml = await entry.async('string');
    const namespace = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
    if (xml.includes(namespace)) {
      xml = xml.replace(`xmlns="${namespace}"`, `xmlns:x="${namespace}"`);
      xml = xml.replace(/<(\/?)([a-zA-Z][\w.-]*)/g, '<$1x:$2');
    }
    zip.file(name, xml);
  }
  return zip.generateAsync({ type: 'arraybuffer' });
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

void test('imports workbooks that use prefixed spreadsheet XML', async () => {
  const parsed = await parseXlsx(await prefixedWorkbook([headers, row]), []);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].member.tip_email, 'test@example.org');
});
