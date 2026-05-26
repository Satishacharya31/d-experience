// ── gameStore.ts ──────────────────────────────────────────────────────────────
// Lightweight synchronous game-state singleton persisted in localStorage.
// No React state — poll or subscribe via the listener API.
// ─────────────────────────────────────────────────────────────────────────────

export type QuestId =
  | "visit_about"
  | "visit_projects"
  | "visit_skills"
  | "visit_contact"
  | "first_jump"
  | "open_cli"
  | "collect_all_shards";

export interface Quest {
  id: QuestId;
  label: string;
  description: string;
  xp: number;
  done: boolean;
}

export interface GameState {
  xp: number;
  level: number;
  quests: Quest[];
  collectedShards: number[]; // indices of collected shards
  totalShards: number;
  speedrunStart: number | null; // timestamp ms
  speedrunBest: number | null;  // ms
  speedrunFinished: boolean;
  muted: boolean;
}

// ── Hacker level titles ───────────────────────────────────────────────────────
export const LEVEL_TITLES: string[] = [
  "Script Kiddie",
  "Net Crawler",
  "Packet Sniffer",
  "Netrunner",
  "Ghost Protocol",
  "Zero-Day Hunter",
  "Matrix Master",
  "Cyber Deity",
];

/** XP required to reach a given level (level starts at 1) */
export function xpForLevel(level: number): number {
  return 100 * level + 50 * (level - 1);
}

export function levelForXp(xp: number): number {
  let lvl = 1;
  while (xp >= xpForLevel(lvl) && lvl < LEVEL_TITLES.length) lvl++;
  return lvl;
}

export function levelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];
}

// ── Quests definition ─────────────────────────────────────────────────────────
const DEFAULT_QUESTS: Quest[] = [
  { id: "visit_about",    label: "ABOUT_TOWER",     description: "Enter the About zone",      xp: 50,  done: false },
  { id: "visit_projects", label: "PROJECTS_HUB",    description: "Enter the Projects zone",   xp: 50,  done: false },
  { id: "visit_skills",   label: "SKILLS_ARENA",    description: "Enter the Skills zone",     xp: 50,  done: false },
  { id: "visit_contact",  label: "CONTACT_KIOSK",   description: "Enter the Contact zone",    xp: 50,  done: false },
  { id: "first_jump",     label: "FIRST_JUMP",       description: "Defy gravity",              xp: 25,  done: false },
  { id: "open_cli",       label: "CLI_ACCESS",       description: "Access the terminal",       xp: 25,  done: false },
  { id: "collect_all_shards", label: "DATASHARD_SWEEP", description: "Collect all 8 datashards", xp: 150, done: false },
];

const STORAGE_KEY = "thelab_game_v1";
const TOTAL_SHARDS = 8;

// ── State & listeners ─────────────────────────────────────────────────────────
type Listener = (state: GameState) => void;
const listeners = new Set<Listener>();

function load(): GameState {
  if (typeof window === "undefined") {
    return {
      xp: 0,
      level: 1,
      quests: DEFAULT_QUESTS.map((q) => ({ ...q })),
      collectedShards: [],
      totalShards: TOTAL_SHARDS,
      speedrunStart: null,
      speedrunBest: null,
      speedrunFinished: false,
      muted: false,
    };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<GameState>;
      return {
        xp: saved.xp ?? 0,
        level: saved.level ?? 1,
        quests: DEFAULT_QUESTS.map((q) => ({
          ...q,
          done: saved.quests?.find((sq) => sq.id === q.id)?.done ?? false,
        })),
        collectedShards: saved.collectedShards ?? [],
        totalShards: TOTAL_SHARDS,
        speedrunStart: saved.speedrunStart ?? null,
        speedrunBest: saved.speedrunBest ?? null,
        speedrunFinished: saved.speedrunFinished ?? false,
        muted: saved.muted ?? false,
      };
    }
  } catch { /* ignore */ }
  return {
    xp: 0,
    level: 1,
    quests: DEFAULT_QUESTS.map((q) => ({ ...q })),
    collectedShards: [],
    totalShards: TOTAL_SHARDS,
    speedrunStart: null,
    speedrunBest: null,
    speedrunFinished: false,
    muted: false,
  };
}

let _state: GameState = load();

function save() {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(_state)); } catch { /* ignore */ }
}

function notify() {
  const snap = { ..._state, quests: _state.quests.map((q) => ({ ...q })) };
  listeners.forEach((fn) => fn(snap));
}

function commit(partial: Partial<GameState>) {
  _state = { ..._state, ...partial };
  save();
  notify();
}

// ── Public API ────────────────────────────────────────────────────────────────
export const gameStore = {
  get(): GameState {
    return _state;
  },

  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  /** Award XP and handle leveling + speedrun auto-start */
  addXp(amount: number): { levelUp: boolean; newLevel: number } {
    const newXp = _state.xp + amount;
    const oldLevel = _state.level;
    const newLevel = levelForXp(newXp);
    const levelUp = newLevel > oldLevel;

    // Auto-start speedrun on first XP
    const speedrunStart =
      _state.speedrunStart === null && !_state.speedrunFinished
        ? Date.now()
        : _state.speedrunStart;

    commit({ xp: newXp, level: newLevel, speedrunStart });
    return { levelUp, newLevel };
  },

  /** Complete a quest (idempotent) */
  completeQuest(id: QuestId): { didComplete: boolean; xpGained: number; levelUp: boolean; newLevel: number } {
    const quest = _state.quests.find((q) => q.id === id);
    if (!quest || quest.done) return { didComplete: false, xpGained: 0, levelUp: false, newLevel: _state.level };
    const updated = _state.quests.map((q) => (q.id === id ? { ...q, done: true } : q));
    commit({ quests: updated });
    const { levelUp, newLevel } = gameStore.addXp(quest.xp);
    return { didComplete: true, xpGained: quest.xp, levelUp, newLevel };
  },

  /** Collect a datashard by index */
  collectShard(index: number): { wasNew: boolean; allCollected: boolean } {
    if (_state.collectedShards.includes(index)) return { wasNew: false, allCollected: false };
    const collectedShards = [..._state.collectedShards, index];
    commit({ collectedShards });
    const allCollected = collectedShards.length >= TOTAL_SHARDS;
    if (allCollected) {
      gameStore.completeQuest("collect_all_shards");
    }
    return { wasNew: true, allCollected };
  },

  /** Finish speedrun when all quests are done */
  tryFinishSpeedrun() {
    if (_state.speedrunFinished || _state.speedrunStart === null) return;
    const allDone = _state.quests.every((q) => q.done);
    if (!allDone) return;
    const elapsed = Date.now() - _state.speedrunStart;
    const best = _state.speedrunBest === null || elapsed < _state.speedrunBest
      ? elapsed
      : _state.speedrunBest;
    commit({ speedrunFinished: true, speedrunBest: best });
  },

  toggleMute() {
    commit({ muted: !_state.muted });
  },

  /** Hard reset (for testing) */
  reset() {
    _state = {
      xp: 0,
      level: 1,
      quests: DEFAULT_QUESTS.map((q) => ({ ...q })),
      collectedShards: [],
      totalShards: TOTAL_SHARDS,
      speedrunStart: null,
      speedrunBest: null,
      speedrunFinished: false,
      muted: false,
    };
    save();
    notify();
  },
};
