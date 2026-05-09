import {
  addPriorityRule,
  removePriorityRule,
  listPriorityRules,
  clearPriorityRules,
  getPriorityRule,
  resolvePriority,
  sortByPriority,
  setDefaultPriority,
  getDefaultPriority,
  PriorityLevel,
} from './webhookPriority';

beforeEach(() => {
  clearPriorityRules();
});

describe('priority rules CRUD', () => {
  test('add and retrieve a rule', () => {
    addPriorityRule({ id: 'r1', headerName: 'X-Priority', headerValue: 'urgent', priority: 'critical' });
    const rule = getPriorityRule('r1');
    expect(rule).toBeDefined();
    expect(rule?.priority).toBe('critical');
  });

  test('list rules returns all added rules', () => {
    addPriorityRule({ id: 'r1', headerName: 'X-Priority', headerValue: 'urgent', priority: 'critical' });
    addPriorityRule({ id: 'r2', headerName: 'X-Tier', headerValue: 'gold', priority: 'high' });
    expect(listPriorityRules()).toHaveLength(2);
  });

  test('remove a rule', () => {
    addPriorityRule({ id: 'r1', headerName: 'X-Priority', headerValue: 'urgent', priority: 'critical' });
    expect(removePriorityRule('r1')).toBe(true);
    expect(getPriorityRule('r1')).toBeUndefined();
  });

  test('remove non-existent rule returns false', () => {
    expect(removePriorityRule('ghost')).toBe(false);
  });

  test('clearPriorityRules resets default priority', () => {
    setDefaultPriority('low');
    clearPriorityRules();
    expect(getDefaultPriority()).toBe('normal');
  });
});

describe('resolvePriority', () => {
  test('returns default when no rules match', () => {
    expect(resolvePriority({ 'x-other': 'value' })).toBe('normal');
  });

  test('matches a rule by header', () => {
    addPriorityRule({ id: 'r1', headerName: 'X-Priority', headerValue: 'urgent', priority: 'critical' });
    expect(resolvePriority({ 'x-priority': 'urgent' })).toBe('critical');
  });

  test('matching is case-insensitive on value', () => {
    addPriorityRule({ id: 'r1', headerName: 'X-Priority', headerValue: 'Urgent', priority: 'high' });
    expect(resolvePriority({ 'x-priority': 'URGENT' })).toBe('high');
  });

  test('uses custom default priority when set', () => {
    setDefaultPriority('low');
    expect(resolvePriority({})).toBe('low');
  });
});

describe('sortByPriority', () => {
  test('sorts items critical first', () => {
    const items: { name: string; level: PriorityLevel }[] = [
      { name: 'a', level: 'low' },
      { name: 'b', level: 'critical' },
      { name: 'c', level: 'normal' },
      { name: 'd', level: 'high' },
    ];
    const sorted = sortByPriority(items, (i) => i.level);
    expect(sorted.map((i) => i.level)).toEqual(['critical', 'high', 'normal', 'low']);
  });

  test('does not mutate the original array', () => {
    const items = [
      { level: 'low' as PriorityLevel },
      { level: 'critical' as PriorityLevel },
    ];
    const original = [...items];
    sortByPriority(items, (i) => i.level);
    expect(items).toEqual(original);
  });
});
