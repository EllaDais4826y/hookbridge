// Mute/unmute endpoints: suppresses fanout delivery without removing config

export interface MuteEntry {
  target: string;
  mutedAt: number;
  reason?: string;
}

const muteStore = new Map<string, MuteEntry>();

export function muteTarget(target: string, reason?: string): MuteEntry {
  const entry: MuteEntry = { target, mutedAt: Date.now(), reason };
  muteStore.set(target, entry);
  return entry;
}

export function unmuteTarget(target: string): boolean {
  return muteStore.delete(target);
}

export function isMuted(target: string): boolean {
  return muteStore.has(target);
}

export function getMuteEntry(target: string): MuteEntry | undefined {
  return muteStore.get(target);
}

export function listMuted(): MuteEntry[] {
  return Array.from(muteStore.values());
}

export function clearMutes(): void {
  muteStore.clear();
}

export function muteCount(): number {
  return muteStore.size;
}
