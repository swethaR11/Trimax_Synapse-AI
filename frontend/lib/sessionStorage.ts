import type { StudySession } from "@/lib/types";

const SESSIONS_KEY = "synapse_sessions";
const XP_KEY = "synapse_xp";

export function loadSessions(): StudySession[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(SESSIONS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveSession(session: StudySession): StudySession[] {
  const next = [session, ...loadSessions().filter((item) => item.id !== session.id)].slice(0, 20);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(next));
  return next;
}

export function removeSession(id: string): StudySession[] {
  const next = loadSessions().filter((item) => item.id !== id);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(next));
  return next;
}

export function clearSessions(): void {
  localStorage.removeItem(SESSIONS_KEY);
}

export function loadXp(): number {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(XP_KEY) ?? 0);
}

export function saveXp(value: number): void {
  localStorage.setItem(XP_KEY, String(value));
}

