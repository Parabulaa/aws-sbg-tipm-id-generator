import { test } from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import { parseXlsx } from '../lib/import-xlsx';
async function workbook(rows: unknown[][]) {
  const wb = new ExcelJS.Workbook();
  wb.addWorksheet('Members').addRows(rows);
  const bytes = await wb.xlsx.writeBuffer();
  return Uint8Array.from(new Uint8Array(bytes)).buffer;
}
const headers = [
  'first_name',
  'last_name',
  'email',
  'membership_type',
  'aws_sbg_id',
  'date_issued',
  'valid_until',
];
const row = [
  'Test',
  'Person',
  'test@example.org',
  'Member',
  'TEST-001',
  '2026-09-08',
  '2027-09-08',
];
void test('80-row import, dates, duplicate protection, invalid email and category', async () => {
  const rows = Array.from({ length: 80 }, (_, i) => [
    ...row.slice(0, 4),
    `TEST-${i}`,
    ...row.slice(5),
  ]);
  assert.equal(
    (await parseXlsx(await workbook([headers, ...rows]), [])).filter(
      (row) => !row.errors.length,
    ).length,
    80,
  );
  const duplicate = await parseXlsx(await workbook([headers, row, row]), []);
  assert.ok(
    duplicate.every((row) =>
      row.errors.some((error) => error.includes('Duplicate')),
    ),
  );
  assert.ok(
    (await parseXlsx(await workbook([headers, row]), ['TEST-001']))[0].errors
      .length,
  );
  assert.ok(
    (
      await parseXlsx(
        await workbook([
          headers,
          ['Test', 'Person', 'bad', 'Unknown', 'TEST-001', 1, 2],
        ]),
        [],
      )
    )[0].errors.length,
  );
});
void test('missing columns and invalid workbook are actionable failures', async () => {
  await assert.rejects(
    () => parseXlsx(new ArrayBuffer(20), []),
    /Invalid XLSX/,
  );
  const bytes = await workbook([['name'], ['Test']]);
  await assert.rejects(() => parseXlsx(bytes, []), /Missing required columns/);
});
