import { test } from 'node:test';
import assert from 'node:assert/strict';
import { photoSource } from '../lib/render-id';
import { validateLayout } from '../lib/templates';
import { accentColor, blankMember } from '../lib/domain';
import type { MemberRecord } from '../lib/domain';
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
