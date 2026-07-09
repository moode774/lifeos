export type TaskCat = 'work' | 'life' | 'relax' | 'play';
export type Prio = 'high' | 'med' | 'low';

/** 'once' = مرة واحدة، 'daily' = كل يوم، number[] = أيام أسبوع محددة (0=الأحد) */
export type Repeat = 'once' | 'daily' | number[];

export interface Task {
  id: string;
  name: string;
  cat: TaskCat;
  prio: Prio;
  time: string | null; // "HH:mm" reminder
  repeat: Repeat;
  date: string; // creation date (YYYY-MM-DD); for 'once' this is its day
  done: boolean; // for 'once'
  doneLog: Record<string, boolean>; // for recurring: date -> done
  notifiedOn: string | null; // last date a reminder fired
}

export type BlockType = 'work' | 'commute' | 'relax' | 'play' | 'sport' | 'sleep' | 'family';

export interface Block {
  id: string;
  name: string;
  type: BlockType;
  start: string; // "HH:mm"
  end: string;
  days: number[]; // weekdays 0-6 this block applies to
}

export interface Habit {
  id: string;
  name: string;
  log: Record<string, boolean>; // date -> done
}

export interface Note {
  id: string;
  text: string;
  date: string; // ISO
}

export interface FocusDay {
  sessions: number;
  minutes: number;
}

export interface Settings {
  dark: boolean;
  sound: boolean;
}

export interface State {
  name: string;
  tasks: Task[];
  blocks: Block[];
  habits: Habit[];
  notes: Note[];
  focus: Record<string, FocusDay>;
  settings: Settings;
  lastBlockId: string | null;
}

export type View = 'dashboard' | 'tasks' | 'schedule' | 'focus' | 'habits' | 'notes' | 'stats' | 'settings';

export type TimerPhase = 'work' | 'break';

export interface TimerState {
  left: number; // seconds
  total: number;
  running: boolean;
  phase: TimerPhase;
  preset: number; // minutes
}

export type SyncStatus = 'off' | 'syncing' | 'synced' | 'error';
