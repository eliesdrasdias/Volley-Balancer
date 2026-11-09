import type { State } from "../types";

const STORAGE_KEY = "volley-balancer:state";

const defaultState: State = {
  players: [],
  teams: null,
};

function isPlayer(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const player = value as Record<string, unknown>;
  const validIdentity = typeof player.id === "string" && typeof player.name === "string" && player.name.trim().length > 0 &&
    (player.gender === "M" || player.gender === "F");
  if (!validIdentity) return false;
  if (player.role === "setter") return player.level === null;
  return player.role === "athlete" &&
    (player.level === 1 || player.level === 2 || player.level === 3 || player.level === 4);
}

function isTeam(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const team = value as Record<string, unknown>;
  if (typeof team.name !== "string" || !Array.isArray(team.players) || !team.players.every(isPlayer) ||
      typeof team.totalLevel !== "number" || !team.genderCount || typeof team.genderCount !== "object") return false;
  const count = team.genderCount as Record<string, unknown>;
  return typeof count.M === "number" && typeof count.F === "number";
}

function isValidState(value: unknown): value is State {
  if (!value || typeof value !== "object") return false;
  const state = value as Record<string, unknown>;
  return Array.isArray(state.players) && state.players.every(isPlayer) &&
    (state.teams === null || (Array.isArray(state.teams) && state.teams.every(isTeam)));
}

/** Lê do localStorage somente dados que correspondem ao modelo atual. */
export function loadState(): State {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed: unknown = JSON.parse(raw);
    return isValidState(parsed) ? parsed : defaultState;
  } catch {
    return defaultState;
  }
}

/** Persiste estado local, sem falhar quando o armazenamento estiver indisponível. */
export function saveState(state: State): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Armazenamento indisponível ou quota excedida.
  }
}

/** Remove a lista e os times persistidos para começar uma sessão limpa. */
export function clearState(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Armazenamento indisponível.
  }
}
