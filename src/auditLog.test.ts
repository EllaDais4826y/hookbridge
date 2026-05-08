import {
  configureAuditLog,
  recordAudit,
  listAuditLog,
  getAuditEntry,
  clearAuditLog,
  auditLogSize,
} from "./auditLog";

beforeEach(() => {
  clearAuditLog();
});

test("records an audit entry with expected fields", () => {
  const entry = recordAudit("admin", "CREATE", "/endpoints/1", "added endpoint", "127.0.0.1");
  expect(entry.actor).toBe("admin");
  expect(entry.action).toBe("CREATE");
  expect(entry.resource).toBe("/endpoints/1");
  expect(entry.detail).toBe("added endpoint");
  expect(entry.ip).toBe("127.0.0.1");
  expect(entry.id).toMatch(/^audit_/);
  expect(entry.timestamp).toBeTruthy();
});

test("listAuditLog returns entries in reverse-chronological order", () => {
  recordAudit("u1", "A", "r1");
  recordAudit("u2", "B", "r2");
  const list = listAuditLog();
  expect(list[0].actor).toBe("u2");
  expect(list[1].actor).toBe("u1");
});

test("listAuditLog respects limit", () => {
  for (let i = 0; i < 10; i++) recordAudit("u", "A", `r${i}`);
  expect(listAuditLog(3)).toHaveLength(3);
});

test("getAuditEntry retrieves by id", () => {
  const entry = recordAudit("admin", "DELETE", "/secrets/x");
  const found = getAuditEntry(entry.id);
  expect(found).toBeDefined();
  expect(found?.id).toBe(entry.id);
});

test("getAuditEntry returns undefined for unknown id", () => {
  expect(getAuditEntry("nonexistent")).toBeUndefined();
});

test("clearAuditLog empties the log", () => {
  recordAudit("u", "A", "r");
  clearAuditLog();
  expect(auditLogSize()).toBe(0);
});

test("auditLogSize reflects count", () => {
  expect(auditLogSize()).toBe(0);
  recordAudit("u", "A", "r");
  recordAudit("u", "B", "r");
  expect(auditLogSize()).toBe(2);
});

test("configureAuditLog enforces maxEntries", () => {
  configureAuditLog({ maxEntries: 3 });
  for (let i = 0; i < 5; i++) recordAudit("u", "A", `r${i}`);
  expect(auditLogSize()).toBe(3);
});
