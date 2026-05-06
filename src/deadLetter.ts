import * as fs from "fs";
import * as path from "path";

export interface DeadLetterEntry {
  id: string;
  timestamp: string;
  targetUrl: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  lastError: string;
  attempts: number;
}

let store: DeadLetterEntry[] = [];

export function addDeadLetter(entry: Omit<DeadLetterEntry, "id" | "timestamp">): DeadLetterEntry {
  const full: DeadLetterEntry = {
    id: Math.random().toString(36).slice(2, 10),
    timestamp: new Date().toISOString(),
    ...entry,
  };
  store.push(full);
  return full;
}

export function listDeadLetters(): DeadLetterEntry[] {
  return [...store];
}

export function getDeadLetter(id: string): DeadLetterEntry | undefined {
  return store.find((e) => e.id === id);
}

export function removeDeadLetter(id: string): boolean {
  const before = store.length;
  store = store.filter((e) => e.id !== id);
  return store.length < before;
}

export function clearDeadLetters(): void {
  store = [];
}

export function deadLetterCount(): number {
  return store.length;
}
