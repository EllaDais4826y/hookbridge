export interface SnapshotEntry {
  id: string;
  target: string;
  payload: unknown;
  headers: Record<string, string>;
  capturedAt: string;
  label?: string;
}

const snapshots = new Map<string, SnapshotEntry>();

export function generateSnapshotId(): string {
  return `snap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function addSnapshot(
  target: string,
  payload: unknown,
  headers: Record<string, string>,
  label?: string
): SnapshotEntry {
  const entry: SnapshotEntry = {
    id: generateSnapshotId(),
    target,
    payload,
    headers,
    capturedAt: new Date().toISOString(),
    label,
  };
  snapshots.set(entry.id, entry);
  return entry;
}

export function getSnapshot(id: string): SnapshotEntry | undefined {
  return snapshots.get(id);
}

export function listSnapshots(): SnapshotEntry[] {
  return Array.from(snapshots.values());
}

export function removeSnapshot(id: string): boolean {
  return snapshots.delete(id);
}

export function clearSnapshots(): void {
  snapshots.clear();
}

export function snapshotCount(): number {
  return snapshots.size;
}
