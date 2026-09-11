import { test } from 'node:test';
import assert from 'node:assert/strict';
import { officerDesigns, selectTemplate } from '../lib/templates';
import type { Template } from '../lib/templates';
import { blankMember, officerPositionTeams } from '../lib/domain';

const fallback: Template = {
  key: 'shared', category: 'Officer', side: 'front', image: '',
  layout: { fields: [], accents: [] }, version: 'shared', approved: true,
};
const designs = officerDesigns.map(d => ({ ...fallback, team: d.team, key: d.team, version: d.team }));
void test('officer positions select their own approved design, including technology leads', () => {
  for (const [officer_position, team] of Object.entries(officerPositionTeams)) {
    const member = { ...blankMember, membership_type: 'Officer' as const, officer_position, team: 'stale team' };
    assert.equal(selectTemplate([fallback, ...designs], member, 'front')?.version,
      team === 'LORSO' ? 'shared' : team);
  }
});
void test('missing designs use only shared fallback and never another office or side', () => {
  const member = { ...blankMember, membership_type: 'Officer' as const, officer_position: 'AI/ML LEAD' };
  assert.equal(selectTemplate(designs.filter(t => t.team !== 'Technology / CTO Office'), member, 'front'), undefined);
  assert.equal(selectTemplate([fallback], member, 'front'), fallback);
  assert.equal(selectTemplate([fallback, ...designs], member, 'back'), undefined);
  assert.equal(selectTemplate([fallback, ...designs], { ...blankMember, membership_type: 'Member' }, 'front'), undefined);
  assert.equal(selectTemplate([{ ...designs[7], approved: false }, fallback], member, 'front'), fallback);
});
