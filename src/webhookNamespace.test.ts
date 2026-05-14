import {
  addNamespace,
  removeNamespace,
  getNamespace,
  listNamespaces,
  clearNamespaces,
  resolveNamespace,
  updateNamespaceEndpoints,
} from './webhookNamespace';

beforeEach(() => clearNamespaces());

describe('addNamespace', () => {
  it('creates a namespace entry with generated id', () => {
    const ns = addNamespace('payments', '/pay', ['https://a.example.com']);
    expect(ns.id).toMatch(/^ns_/);
    expect(ns.name).toBe('payments');
    expect(ns.prefix).toBe('/pay');
    expect(ns.endpoints).toEqual(['https://a.example.com']);
    expect(ns.createdAt).toBeTruthy();
  });

  it('normalizes prefix to start with slash', () => {
    const ns = addNamespace('orders', 'orders', []);
    expect(ns.prefix).toBe('/orders');
  });
});

describe('removeNamespace', () => {
  it('removes an existing namespace', () => {
    const ns = addNamespace('test', '/test', []);
    expect(removeNamespace(ns.id)).toBe(true);
    expect(getNamespace(ns.id)).toBeUndefined();
  });

  it('returns false for unknown id', () => {
    expect(removeNamespace('unknown')).toBe(false);
  });
});

describe('listNamespaces', () => {
  it('returns all namespaces', () => {
    addNamespace('a', '/a', []);
    addNamespace('b', '/b', []);
    expect(listNamespaces()).toHaveLength(2);
  });

  it('returns empty array when none exist', () => {
    expect(listNamespaces()).toEqual([]);
  });
});

describe('resolveNamespace', () => {
  it('finds namespace by path prefix', () => {
    addNamespace('billing', '/billing', ['https://billing.example.com']);
    const found = resolveNamespace('/billing/invoice/123');
    expect(found?.name).toBe('billing');
  });

  it('returns undefined for unmatched path', () => {
    expect(resolveNamespace('/unknown/path')).toBeUndefined();
  });
});

describe('updateNamespaceEndpoints', () => {
  it('updates endpoints for existing namespace', () => {
    const ns = addNamespace('svc', '/svc', ['https://old.example.com']);
    const updated = updateNamespaceEndpoints(ns.id, ['https://new.example.com']);
    expect(updated?.endpoints).toEqual(['https://new.example.com']);
  });

  it('returns undefined for unknown id', () => {
    expect(updateNamespaceEndpoints('missing', [])).toBeUndefined();
  });
});
