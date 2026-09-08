import { test, expect } from '@playwright/test';
import type { MemberRecord } from '../../lib/domain';
import type { Template } from '../../lib/templates';
import ExcelJS from 'exceljs';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
test('empty system → XLSX → photo/crop → review → generate → files/history', async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(
    page.getByText('No members imported yet. Upload an XLSX file to begin.'),
  ).toBeVisible();
  expect(await (await request.get('/api/members')).json()).toEqual([]);
  await page.goto('/members');
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Members');
  sheet.addRow([
    'first_name',
    'middle_name',
    'last_name',
    'email',
    'membership_type',
    'team',
    'position',
    'aws_sbg_id',
    'date_issued',
    'valid_until',
  ]);
  sheet.addRow([
    'QA',
    'Middle',
    'de la Test',
    'qa@example.org',
    'Officer',
    'Quality',
    'Test Lead',
    'QA-001',
    '2026-09-08',
    '2027-09-08',
  ]);
  sheet.addRow([
    'QA2',
    '',
    'Test',
    'qa2@example.org',
    'Member',
    '',
    '',
    'QA-002',
    '2026-09-08',
    '2027-09-08',
  ]);
  sheet.addRow([
    'QA3',
    '',
    'Test',
    'qa3@example.org',
    'Associate',
    '',
    '',
    'QA-003',
    '2026-09-08',
    '2027-09-08',
  ]);
  sheet.addRow([
    'Invalid',
    '',
    'Test',
    'bad',
    'Member',
    '',
    '',
    'QA-004',
    '2026-09-08',
    '2027-09-08',
  ]);
  await page.getByLabel('Membership spreadsheet').setInputFiles({
    name: 'test-members.xlsx',
    mimeType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: Buffer.from(await workbook.xlsx.writeBuffer()),
  });
  await expect(page.getByText('4 total · 3 valid · 1 invalid')).toBeVisible();
  await page
    .getByRole('button', { name: 'Confirm import of 3 valid rows' })
    .click();
  await expect(page.getByText('3 members imported as Draft.')).toBeVisible();
  const members = await (await request.get('/api/members')).json();
  expect(members).toHaveLength(3);
  await page.goto(`/generate-id?member=${members[0].id}`);
  await expect(
    page.getByText(
      'Approved Officer front template is not configured. Add the approved PNG and field mapping in Templates.',
    ),
  ).toBeVisible();
  const denied = await request.post('/api/members/import', {
    data: { members: [members[0]] },
  });
  expect(denied.status()).toBe(403);
  const duplicate = await request.post('/api/members/import', {
    headers: { Origin: 'http://localhost:3100' },
    data: { members: [members[0]] },
  });
  expect(duplicate.status()).toBe(409);
  // Fixtures are created only in this run's isolated D1/R2 storage. They are not approved organization assets.
  const png = Buffer.from(
    await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 1950;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 1200, 1950);
      return canvas.toDataURL('image/png').split(',')[1];
    }),
    'base64',
  );
  const layout = {
    photo: { x: 400, y: 200, width: 400, height: 500 },
    accents: [{ x: 0, y: 0, width: 1200, height: 100 }],
    fields: ['name', 'role', 'aws_sbg_id', 'email'].map((field, index) => ({
      field,
      x: 100,
      y: 800 + index * 160,
      width: 1000,
      height: 140,
      fontSize: 64,
      minFontSize: 16,
      color: '#000000',
      align: 'center',
      weight: 'bold',
    })),
  };
  for (const category of ['Officer', 'Member', 'Associate'])
    for (const side of ['front', 'back']) {
      const response = await request.post('/api/templates', {
        headers: { Origin: 'http://localhost:3100' },
        multipart: {
          category,
          side,
          approved: 'true',
          layout: JSON.stringify(
            side === 'front' ? layout : { fields: [], accents: [] },
          ),
          image: { name: 'test-only.png', mimeType: 'image/png', buffer: png },
        },
      });
      expect(response.status(), await response.text()).toBe(200);
    }
  await request.put('/api/colors', {
    headers: { Origin: 'http://localhost:3100' },
    data: {
      mode: 'team',
      revision: 0,
      teams: [{ name: 'Quality', color: '#ff0000', enabled: true }],
    },
  });
  await page.goto(`/generate-id?member=${members[0].id}`);
  await expect(
    page.getByRole('heading', { name: 'QA M. de la Test' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Confirm ID', exact: true }),
  ).toBeDisabled();
  await page
    .getByLabel('Upload member photo')
    .setInputFiles({ name: 'photo.png', mimeType: 'image/png', buffer: png });
  await expect(
    page.getByRole('button', { name: 'Apply uploaded photo' }),
  ).toBeVisible();
  await page.getByLabel('Zoom', { exact: true }).fill('1.5');
  await page.getByRole('button', { name: 'Apply uploaded photo' }).click();
  await expect(
    page.getByRole('button', { name: 'Apply uploaded photo' }),
  ).toHaveCount(0);
  await page.reload();
  await expect(page.getByLabel('Zoom', { exact: true })).toHaveValue('1.5');
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByRole('button', { name: 'Front', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm ID', exact: true }).click();
  await expect(
    page.getByText('ID confirmed and Ready for generation.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Generate ID', exact: true }).click();
  await expect(
    page.getByText('ID files generated and saved in history.'),
  ).toBeVisible();
  const records = await (await request.get('/api/generations')).json();
  expect(records).toHaveLength(1);
  expect(records[0].accent).toBe('#ff0000');
  const front = await (
    await request.get(`/api/files/exports/${records[0].id}/front.png`)
  ).body();
  const dimensions = new DataView(
    front.buffer,
    front.byteOffset,
    front.byteLength,
  );
  expect(dimensions.getUint32(16)).toBe(1200);
  expect(dimensions.getUint32(20)).toBe(1950);
  const pdf = await PDFDocument.load(
    await (
      await request.get(`/api/files/exports/${records[0].id}/ID.pdf`)
    ).body(),
  );
  expect(pdf.getPageCount()).toBe(2);
  const longTextDimensions = await page.evaluate(async () => {
    const modulePath = '/lib/render-id.ts';
    const { renderID } = await import(modulePath);
    const members = (await (
      await fetch('/api/members')
    ).json()) as MemberRecord[];
    const templates = (await (
      await fetch('/api/templates')
    ).json()) as Template[];
    const colors = await (await fetch('/api/colors')).json();
    const canvas = document.createElement('canvas');
    await renderID(
      canvas,
      {
        ...members[0],
        first_name: 'Alexandria Maria Francesca Isabella',
        middle_name: 'Cristina',
        last_name: 'de los Santos Villanueva Montenegro',
        position:
          'Technology and Software Engineering Community Development Lead',
        email:
          'alexandria.maria.francesca.de-los-santos.villanueva@example.org',
      },
      templates.find(
        (item: { category: string; side: string }) =>
          item.category === 'Officer' && item.side === 'front',
      ),
      colors,
    );
    return [canvas.width, canvas.height];
  });
  expect(longTextDimensions).toEqual([1200, 1950]);
  const pixel = await page.evaluate(async (id) => {
    const image = new Image();
    image.src = `/api/files/exports/${id}/front.png`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1950;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(image, 0, 0);
    return Array.from(ctx.getImageData(10, 10, 1, 1).data);
  }, records[0].id);
  expect(pixel).toEqual([255, 0, 0, 255]);
  await page.getByRole('button', { name: 'Save & Next', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'QA2 Test', exact: true }),
  ).toBeVisible();
  await page.getByLabel('Email', { exact: true }).fill('invalid');
  await page
    .getByRole('button', { name: 'Save information', exact: true })
    .click();
  await expect(
    page.getByText('Information and photo position saved.'),
  ).toBeVisible();
  expect((await (await request.get('/api/members')).json())[1].status).toBe(
    'Needs Attention',
  );
  await page.getByLabel('Email', { exact: true }).fill('qa2@example.org');
  await page
    .getByRole('button', { name: 'Save information', exact: true })
    .click();
  await expect
    .poll(
      async () => (await (await request.get('/api/members')).json())[1].status,
    )
    .toBe('Needs Photo');
  for (const item of members.slice(1)) {
    const current = (await (await request.get('/api/members')).json()).find(
      (row: { id: string }) => row.id === item.id,
    );
    const uploaded = await request.post(`/api/members/${item.id}/photo`, {
      headers: { Origin: 'http://localhost:3100' },
      multipart: {
        revision: String(current.revision),
        photo: { name: 'test-photo.png', mimeType: 'image/png', buffer: png },
      },
    });
    expect(uploaded.status()).toBe(200);
    const withPhoto = await uploaded.json();
    const confirmed = await request.post(`/api/members/${item.id}/confirm`, {
      headers: { Origin: 'http://localhost:3100' },
      data: { revision: withPhoto.revision },
    });
    expect(confirmed.status()).toBe(200);
    const stale = await request.put(`/api/members/${item.id}`, {
      headers: { Origin: 'http://localhost:3100' },
      data: current,
    });
    expect(stale.status()).toBe(409);
  }
  await page.goto('/members');
  await page.getByLabel('Select QA2 Test', { exact: true }).check();
  await page
    .getByRole('button', { name: 'Generate Selected', exact: true })
    .click();
  await expect(page.getByText('1 generated; 0 failed.')).toBeVisible();
  expect(await (await request.get('/api/generations')).json()).toHaveLength(2);
  await page
    .getByLabel('Membership', { exact: true })
    .selectOption('Associate');
  await expect(
    page.getByRole('link', { name: 'Review / Edit ID' }),
  ).toHaveCount(1);
  await page
    .getByRole('button', { name: 'Generate All Ready', exact: true })
    .click();
  await expect
    .poll(
      async () => (await (await request.get('/api/generations')).json()).length,
    )
    .toBe(3);
  await page.goto(`/generate-id?member=${members[0].id}`);
  page.once('dialog', (dialog) => dialog.accept());
  await page
    .getByRole('button', { name: 'Regenerate ID', exact: true })
    .click();
  await expect(
    page.getByText('ID files generated and saved in history.'),
  ).toBeVisible();
  expect(await (await request.get('/api/generations')).json()).toHaveLength(4);
  expect(
    await (
      await request.get(`/api/files/exports/${records[0].id}/front.png`)
    ).body(),
  ).toEqual(front);
  await page.goto('/generated-ids');
  await page.getByLabel('Select all displayed generations').check();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download selected ZIP' }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const zip = await JSZip.loadAsync(Buffer.concat(chunks));
  const files = Object.keys(zip.files).filter((name) => !zip.files[name].dir);
  expect(files).toHaveLength(12);
  for (const category of ['Officers', 'Associates', 'Members'])
    expect(
      files.some((name) => name.startsWith(`AWS-SBG-IDs/${category}/`)),
    ).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of [
    '/',
    '/members',
    '/generate-id',
    '/templates',
    '/generated-ids',
  ]) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});

test('80-member persistent batch is atomic and rejects duplicates', async ({
  request,
}) => {
  const before = await (await request.get('/api/members')).json();
  const members = Array.from({ length: 80 }, (_, index) => ({
    first_name: 'Batch',
    middle_name: '',
    last_name: `Test ${index}`,
    email: `batch-${index}@example.org`,
    membership_type: 'Member',
    team: '',
    position: '',
    aws_sbg_id: `BATCH-${String(index).padStart(3, '0')}`,
    date_issued: '2026-09-08',
    valid_until: '2027-09-08',
  }));
  const response = await request.post('/api/members/import', {
    headers: { Origin: 'http://localhost:3100' },
    data: { members },
  });
  expect(response.status(), await response.text()).toBe(201);
  const stored = await (await request.get('/api/members')).json();
  expect(stored).toHaveLength(before.length + 80);
  expect(
    stored.filter(
      (member: { aws_sbg_id: string; status: string }) =>
        member.aws_sbg_id.startsWith('BATCH-') && member.status === 'Draft',
    ),
  ).toHaveLength(80);
  const duplicate = await request.post('/api/members/import', {
    headers: { Origin: 'http://localhost:3100' },
    data: {
      members: [{ ...members[0], aws_sbg_id: 'UNIQUE-NEW' }, members[1]],
    },
  });
  expect(duplicate.status()).toBe(409);
  expect(await (await request.get('/api/members')).json()).toHaveLength(
    stored.length,
  );
});
