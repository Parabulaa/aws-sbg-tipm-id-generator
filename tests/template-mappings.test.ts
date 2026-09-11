import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { validateLayout } from '../lib/templates';
import type { TemplateLayout } from '../lib/templates';

void test('all eight office mappings fit the canvas and keep text below the photo frame', () => {
  const files = readdirSync('template-mappings').filter(name => name.endsWith('-front.json'));
  assert.equal(files.length, 8);
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
