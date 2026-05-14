import {
  addGroup,
  removeGroup,
  getGroup,
  listGroups,
  clearGroups,
  updateGroup,
  getGroupCount,
} from './webhookGroup';

beforeEach(() => clearGroups());

test('addGroup creates a group with expected fields', () => {
  const g = addGroup('payments', ['https://a.com', 'https://b.com'], 'Payment endpoints');
  expect(g.name).toBe('payments');
  expect(g.endpoints).toEqual(['https://a.com', 'https://b.com']);
  expect(g.description).toBe('Payment endpoints');
  expect(g.id).toMatch(/^grp_/);
  expect(g.createdAt).toBeTruthy();
});

test('getGroup returns the group by id', () => {
  const g = addGroup('alerts', ['https://c.com']);
  expect(getGroup(g.id)).toEqual(g);
});

test('getGroup returns undefined for unknown id', () => {
  expect(getGroup('nope')).toBeUndefined();
});

test('removeGroup deletes the group', () => {
  const g = addGroup('test', []);
  expect(removeGroup(g.id)).toBe(true);
  expect(getGroup(g.id)).toBeUndefined();
});

test('removeGroup returns false for unknown id', () => {
  expect(removeGroup('missing')).toBe(false);
});

test('listGroups returns all groups', () => {
  addGroup('g1', []);
  addGroup('g2', []);
  expect(listGroups()).toHaveLength(2);
});

test('clearGroups removes all groups', () => {
  addGroup('g1', []);
  addGroup('g2', []);
  clearGroups();
  expect(listGroups()).toHaveLength(0);
});

test('updateGroup patches fields', () => {
  const g = addGroup('original', ['https://x.com']);
  const updated = updateGroup(g.id, { name: 'renamed', endpoints: ['https://y.com'] });
  expect(updated?.name).toBe('renamed');
  expect(updated?.endpoints).toEqual(['https://y.com']);
});

test('updateGroup returns undefined for unknown id', () => {
  expect(updateGroup('nope', { name: 'x' })).toBeUndefined();
});

test('getGroupCount reflects current count', () => {
  expect(getGroupCount()).toBe(0);
  addGroup('a', []);
  addGroup('b', []);
  expect(getGroupCount()).toBe(2);
});
