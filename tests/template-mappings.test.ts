import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { validateLayout } from '../lib/templates';
import type { TemplateLayout } from '../lib/templates';

void test('all approved front mappings fit the canvas and keep text below the photo frame', () => {
  const files = readdirSync('template-mappings').filter(name => name.endsWith('-front.json'));
  assert.equal(files.length, 9);
  for (const file of files) {
    const layout = JSON.parse(readFileSync(`template-mappings/${file}`, 'utf8')) as TemplateLayout;
    validateLayout(layout);
    assert.ok(layout.photo);
    for (const field of ['name', 'role', 'aws_sbg_id', 'email'])
      assert.ok(layout.fields.some(box => box.field === field));
    assert.ok(layout.fields.every(box => box.y > layout.photo!.y + layout.photo!.height));
  }
});
void test('invalid photo clip polygons are rejected', () => {
  for (const clipPolygon of [[], [[0, 0], [1, 1]], [[0, 0], [1, 0], [2, 1]], [[0, 0], [NaN, 0], [1, 1]]])
    assert.throws(() => validateLayout({ photo: {
      x: 0, y: 0, width: 500, height: 600,
      clipPolygon: clipPolygon as [number, number][],
    }, fields: [], accents: [] }), /clipPolygon/);
});

void test('QC Member label is large and centered in its band', () => {
  const layout = JSON.parse(readFileSync('template-mappings/qc-member-front.json', 'utf8')) as TemplateLayout;
  const role = layout.fields.find((box) => box.field === 'role');
  assert.ok(role);
  assert.equal(role.align, 'center');
  assert.equal(role.x + role.width / 2, 600);
  assert.ok(role.fontSize >= 70);
  const name = layout.fields.find((box) => box.field === 'name');
  const id = layout.fields.find((box) => box.field === 'aws_sbg_id');
  assert.ok(name && id);
  assert.ok(name.fontSize >= 82);
  assert.ok(id.y - (role.y + role.height) >= 60);
});
