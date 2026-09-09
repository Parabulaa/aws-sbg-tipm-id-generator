import { test, expect } from '@playwright/test';
import ExcelJS from 'exceljs';
import type { MemberRecord, Generation } from '../../lib/domain';
import type { Template } from '../../lib/templates';

test('public home → login → five-field import → officer review → generate → history → logout', async ({
  page,
}) => {
  let png = Buffer.alloc(0);
  let members: MemberRecord[] = [];
  let generations: Generation[] = [];
  const now = '2026-09-09T00:00:00.000Z';
  const layout: Template['layout'] = {
    photo: { x: 400, y: 180, width: 400, height: 520 },
    accents: [{ x: 0, y: 0, width: 1200, height: 100 }],
    fields: (
      ['full_name', 'officer_position', 'aws_sbg_id', 'tip_email'] as const
    ).map((field, index) => ({
      field,
      x: 100,
      y: 800 + index * 170,
      width: 1000,
      height: 145,
      fontSize: 64,
      minFontSize: 16,
      color: '#000000',
      align: 'center',
      weight: 'bold',
    })),
  };
  const templates: Template[] = ['Member', 'Associate', 'Officer'].flatMap(
    (category) =>
      (['front', 'back'] as const).map((side) => ({
        key: `${category}-${side}`,
        category: category as Template['category'],
        side,
        image: `id-templates/${category.toLowerCase()}/${side}/approved.png`,
        layout: side === 'front' ? layout : { fields: [], accents: [] },
        version: `${category}-${side}-v1`,
        approved: true,
      })),
  );

  // This workflow may also exercise deployed assets in a disposable browser.
  // All auth and application API calls are intercepted; no real records change.
  await page.route('**/auth/v1/**', async (route) => {
    if (
      route.request().method() === 'POST' &&
      route.request().url().includes('/token')
    ) {
      await route.fulfill({
        json: {
          access_token: 'isolated-e2e-access-token',
          refresh_token: 'isolated-e2e-refresh-token',
          token_type: 'bearer',
          expires_in: 3600,
          user: {
            id: '00000000-0000-4000-8000-000000000001',
            aud: 'authenticated',
            role: 'authenticated',
            email: 'admin@example.org',
            app_metadata: {},
            user_metadata: {},
            created_at: now,
          },
        },
      });
      return;
    }
    await route.fulfill({ status: 204, body: '' });
  });

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace('/api/', '');
    const json = (value: unknown, status = 200) =>
      route.fulfill({ status, json: value });
    if (path === 'session') return json({ user: 'Test Admin', role: 'admin' });
    if (path === 'members' && request.method() === 'GET')
      return json(members.map((member) => ({
        ...member,
        // PostgreSQL stores absent officer fields as NULL, not empty strings.
        officer_position: member.officer_position || null,
        team: member.team || null,
      })));
    if (path === 'members/import' && request.method() === 'POST') {
      const rows = (request.postDataJSON() as { members: MemberRecord[] })
        .members;
      members = rows.map((row, index) => ({
        ...row,
        id: `00000000-0000-4000-8000-${String(index + 2).padStart(12, '0')}`,
        aws_sbg_id: `AWSSBG-TIPM-26${String(index + 1).padStart(3, '0')}`,
        photo_path: null,
        photo_crop_data: { x: 0.5, y: 0.5, zoom: 1 },
        color_override: null,
        date_issued: null,
        valid_until: null,
        status: 'Draft',
        revision: 1,
        created_by: null,
        updated_by: null,
        created_at: now,
        updated_at: now,
        archived_at: null,
      }));
      return json({ imported: members.length, members }, 201);
    }
    const memberMatch = path.match(
      /^members\/([^/]+)(?:\/(photo|confirm|archive))?$/,
    );
    if (memberMatch) {
      const index = members.findIndex((member) => member.id === memberMatch[1]);
      const member = members[index];
      if (memberMatch[2] === 'photo')
        members[index] = {
          ...member,
          photo_path: `member-photos/${member.id}/photo.png`,
          photo_crop_data: { x: 0.5, y: 0.5, zoom: 1.5 },
          status: 'Draft',
          revision: member.revision + 1,
        };
      else if (memberMatch[2] === 'confirm')
        members[index] = {
          ...member,
          status: 'Ready',
          date_issued: '2026-09-09',
          valid_until: '2027-09-09',
          revision: member.revision + 1,
        };
      else if (!memberMatch[2] && request.method() === 'PUT') {
        const body = request.postDataJSON() as MemberRecord;
        members[index] = { ...member, ...body, revision: member.revision + 1 };
      }
      return json(members[index]);
    }
    if (path === 'colors')
      return json({ mode: 'default', teams: [], revision: 1 });
    if (path === 'templates') return json(templates);
    if (path === 'activity') return json([]);
    if (path === 'generations' && request.method() === 'GET')
      return json(generations);
    if (path === 'generations' && request.method() === 'POST') {
      const payload = await new Response(Uint8Array.from(request.postDataBuffer()!), {
        headers: { 'Content-Type': request.headers()['content-type'] },
      }).formData();
      expect(payload.get('side')).toBe('front');
      expect(payload.has('back')).toBe(false);
      const member = members[0];
      const id = '10000000-0000-4000-8000-000000000001';
      const record: Generation = {
        id,
        member_id: member.id,
        member,
        generated_at: now,
        generated_by: 'Test Admin',
        accent: '#10b981',
        template_version: 'Officer-front-v1',
        status: 'Generated',
        front_path: `generated-ids/${member.id}/${id}/front.png`,
      };
      generations = [record];
      members[0] = {
        ...member,
        status: 'Generated',
        revision: member.revision + 1,
      };
      return json(record, 201);
    }
    if (path.startsWith('files/')) {
      if (request.headers().authorization !== 'Bearer isolated-e2e-access-token')
        return json({ error: 'Sign in to access officer records.' }, 401);
      return route.fulfill({
        status: 200,
        body: png,
        contentType: 'image/png',
      });
    }
    return json({ error: `Unhandled isolated test route: ${path}` }, 404);
  });

  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'ID Generator' }),
  ).toBeVisible();
  png = Buffer.from(
    await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 1950;
      const context = canvas.getContext('2d')!;
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/png').split(',')[1];
    }),
    'base64',
  );
  await page.getByRole('link', { name: 'Officer Login' }).click();
  await page.waitForFunction(() =>
    Object.keys(document.querySelector('form') ?? {}).some((key) =>
      key.startsWith('__reactProps$'),
    ),
  );
  await page.getByLabel('T.I.P./Officer Email').fill('admin@example.org');
  await page.getByLabel('Password').fill('isolated-test-password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByRole('link', { name: 'Members', exact: true }).click();

  const workbook = new ExcelJS.Workbook();
  workbook.addWorksheet('Members').addRows([
    [
      'Full Name',
      'T.I.P. Email',
      'Student ID number',
      'Department/Program',
      'Year Level',
    ],
    ['JAMES LEBRON', 'james@example.org', '001234', 'BSCS', '3rd'],
  ]);
  await page.getByLabel('Membership spreadsheet').setInputFiles({
    name: 'members.xlsx',
    mimeType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: Buffer.from(await workbook.xlsx.writeBuffer()),
  });
  await expect(page.getByText('IDs to be assigned')).toBeVisible();
  await page.getByRole('button', { name: 'Confirm import of 1 rows' }).click();
  await expect(page.getByText(/assigned AWS SBG IDs/)).toBeVisible();
  await page.getByRole('link', { name: 'Review / Edit ID' }).click();
  await expect(page.getByLabel('Full Name', { exact: true })).toHaveValue('JAMES LEBRON');
  await page.reload();
  await expect(page.getByLabel('Full Name', { exact: true })).toHaveValue('JAMES LEBRON');
  const frontCanvas = page.getByLabel('front ID preview for AWSSBG-TIPM-26001');
  await expect.poll(() => frontCanvas.evaluate((node: HTMLCanvasElement) => node.getContext('2d')!.getImageData(0, 0, 1, 1).data[3])).toBe(255);
  // Preview must work before confirmation, including Member rows with NULLs.
  await expect(page.getByRole('button', { name: 'Generate ID', exact: true })).toBeDisabled();
  await page.getByLabel('Membership Type').selectOption('Officer');
  await page.getByLabel('Officer Position').selectOption('AI/ML LEAD');
  await expect(page.getByLabel('Team / Office')).toHaveValue(
    'Technology / CTO Office',
  );
  await page.getByRole('button', { name: 'Save information' }).click();
  await page.getByLabel('Upload member photo').setInputFiles({
    name: 'photo.png',
    mimeType: 'image/png',
    buffer: png,
  });
  await page.getByLabel('Zoom', { exact: true }).fill('1.5');
  await page.getByRole('button', { name: 'Apply uploaded photo' }).click();
  await expect.poll(() => page.getByAltText('Position adjustment').evaluate((node: HTMLImageElement) => node.naturalWidth)).toBe(1200);
  await page.getByRole('button', { name: 'Confirm ID', exact: true }).click();
  await expect(
    page.getByText('ID confirmed and Ready for generation.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Generate ID', exact: true }).click();
  await expect(
    page.getByText('ID files generated and saved in history.'),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Generated IDs' }).click();
  await expect(page.getByText('AWSSBG-TIPM-26001')).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Test Admin' })).toBeVisible();
  await page.getByText('Preview front', { exact: true }).click();
  const savedPreview = page.getByAltText('Generated front ID for AWSSBG-TIPM-26001');
  await expect(savedPreview).toBeVisible();
  await expect.poll(() => savedPreview.evaluate((node: HTMLImageElement) => node.naturalWidth)).toBe(1200);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download front.png', exact: true }).click();
  expect((await download).suggestedFilename()).toContain('front.png');
  await page.getByLabel('Select all displayed generations').check();
  const zipDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download selected ZIP' }).click();
  expect((await zipDownload).suggestedFilename()).toBe('AWS-SBG-IDs.zip');
  await page.getByRole('link', { name: 'Review / Regenerate' }).click();
  await expect(page.getByLabel('Full Name', { exact: true })).toHaveValue('JAMES LEBRON');
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/$/);
});
