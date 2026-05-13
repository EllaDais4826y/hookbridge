// Webhook pause/resume: allows pausing fanout for specific endpoints or globally

export interface PauseEntry {
  target: string; // endpoint URL or "*" for global
  pausedAt: number;
  reason?: string;
}

const pausedTargets = new Map<string, PauseEntry>();

export function pauseTarget(target: string, reason?: string): PauseEntry {
  const entry: PauseEntry = { target, pausedAt: Date.now(), reason };
  pausedTargets.set(target, entry);
  return entry;
}

export function resumeTarget(target: string): boolean {
  return pausedTargets.delete(target);
}

export function isPaused(target: string): boolean {
  return pausedTargets.has("*") || pausedTargets.has(target);
}

export function getPauseEntry(target: string): PauseEntry | undefined {
  return pausedTargets.get(target);
}

export function listPaused(): PauseEntry[] {
  return Array.from(pausedTargets.values());
}

export function clearPaused(): void {
  pausedTargets.clear();
}

export function pausedCount(): number {
  return pausedTargets.size;
}
