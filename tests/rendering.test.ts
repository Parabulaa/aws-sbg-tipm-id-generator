import { test } from 'node:test';
import assert from 'node:assert/strict';
import { photoSource } from '../lib/render-id';
import { validateLayout } from '../lib/templates';
import { accentColor, blankMember } from '../lib/domain';
import type { MemberRecord } from '../lib/domain';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
void test('photo corners accept bounded radii and preserve older rectangular layouts', () => {
  const photo = { x: 338, y: 470, width: 528, height: 628 };
  validateLayout({ photo, fields: [], accents: [] });
  validateLayout({ photo: { ...photo, borderRadius: 54 }, fields: [], accents: [] });
  for (const borderRadius of [-1, NaN, Infinity, 265])
    assert.throws(() => validateLayout({
      photo: { ...photo, borderRadius }, fields: [], accents: [],
    }), /borderRadius/);
});
void test('photo crop stays within image bounds at all corners and zoom settings', () => {
  for (const [width, height] of [
    [2400, 1200],
    [1200, 2400],
    [200, 200],
  ])
    for (const zoom of [1, 2, 4])
      for (const x of [0, 0.5, 1])
        for (const y of [0, 0.5, 1]) {
          const crop = photoSource(width, height, 0.8, { x, y, zoom });
          assert.ok(
            crop.x >= 0 &&
              crop.y >= 0 &&
              crop.x + crop.width <= width + 0.001 &&
              crop.y + crop.height <= height + 0.001,
          );
          assert.ok(Math.abs(crop.width / crop.height - 0.8) < 0.0001);
        }
});
void test('template layout rejects out-of-canvas regions and invalid field mappings', () => {
  assert.throws(
    () =>
      validateLayout({
        fields: [],
        accents: [{ x: 1100, y: 0, width: 200, height: 10 }],
      }),
    /1200/,
  );
  validateLayout({ fields: [], accents: [] });
  validateLayout({
    fields: [
      {
        field: 'name',
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        fontSize: 24,
        minFontSize: 12,
        color: '#003b71',
        align: 'center',
        weight: 'bold',
        fontFamily: 'montserrat',
      },
    ],
    accents: [],
  });
  assert.throws(
    () =>
      validateLayout({
        fields: [
          {
            field: 'name',
            x: 0,
            y: 0,
            width: 100,
            height: 50,
            fontSize: 24,
            minFontSize: 12,
            color: '#003b71',
            align: 'center',
            weight: 'bold',
            fontFamily: 'comic-sans' as 'arial',
          },
        ],
        accents: [],
      }),
    /Invalid text field/,
  );
});
void test('officer team mode and manual override do not alter fixed Member/Associate colors', () => {
  const member = {
    ...blankMember,
    membership_type: 'Officer',
    team: 'Quality',
    color_override: null,
  } as MemberRecord;
  const settings = {
    mode: 'team' as const,
    revision: 1,
    teams: [{ name: 'Quality', color: '#123456', enabled: true }],
  };
  assert.equal(accentColor(member, settings), '#123456');
  assert.equal(
    accentColor({ ...member, color_override: '#ffffff' }, settings),
    '#ffffff',
  );
  assert.equal(
    accentColor(
      { ...member, membership_type: 'Member', color_override: '#ffffff' },
      settings,
    ),
    '#f59e0b',
  );
  assert.equal(
    accentColor({ ...member, membership_type: 'Associate' }, settings),
    '#8b5cf6',
  );
});

void test('private image loading is cached and never paints a white frame placeholder', () => {
  const client = readFileSync(join(process.cwd(), 'lib', 'client.ts'), 'utf8');
  const image = readFileSync(join(process.cwd(), 'components', 'private-image.tsx'), 'utf8');
  assert.match(client, /privateBlobCache/);
  assert.match(client, /privateAssetCache/);
  assert.match(client, /loadPrivateAsset/);
  assert.match(image, /private-image-loading/);
  assert.doesNotMatch(image, /bg-slate-100/);
});

void test('metadata list pages do not eagerly render full member photos', () => {
  const directory = readFileSync(join(process.cwd(), 'components', 'member-directory.tsx'), 'utf8');
  assert.doesNotMatch(directory, /<PrivateImage/);
  assert.match(directory, /member-photo-fallback/);
});

void test('the selected template shows cached front and back previews', () => {
  const settings = readFileSync(
    join(process.cwd(), 'components', 'template-settings.tsx'),
    'utf8',
  );
  assert.match(settings, /className="template-thumbnail"/);
  assert.doesNotMatch(settings, /Preview on demand/);
  assert.match(settings, /path=\{template\.image\}/);
});

void test('forced password and public sticker layouts use the intended UI', () => {
  const passwordPage = readFileSync(
    join(process.cwd(), 'app', 'change-password', 'page.tsx'),
    'utf8',
  );
  const sidebar = readFileSync(
    join(process.cwd(), 'components', 'sidebar.tsx'),
    'utf8',
  );
  const css = readFileSync(join(process.cwd(), 'app', 'globals.css'), 'utf8');
  assert.match(passwordPage, /forced-password-dialog/);
  assert.match(passwordPage, /showCloseButton=\{false\}/);
  assert.match(sidebar, /role !== 'admin'/);
  assert.match(sidebar, /sidebar-user-avatar/);
  assert.match(css, /\.public-slots i:nth-child\(7\).*grid-column: 6 \/ span 2/);
});
