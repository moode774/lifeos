import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import type { User } from '@supabase/supabase-js';
import type {
  State, Task, Block, Habit, View, TimerState, TaskCat, Prio, BlockType, Repeat, SyncStatus,
} from './types';
import { uid, todayKey, nowMinutes, toMin, fmt12, dateKey } from './lib/time';
import { BLOCK_META } from './lib/meta';
import { supabase } from './lib/supabase';

const STORAGE_KEY = 'lifeos-react';
const CHANGED_KEY = 'lifeos-changed-at';

const DEFAULTS: State = {
  name: '',
  tasks: [],
  blocks: [],
  habits: [],
  notes: [],
  focus: {},
  settings: { dark: false, sound: true },
  lastBlockId: null,
};

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

/** migrate old shapes so no data is ever lost */
function migrate(raw: Partial<State>): State {
  const s: State = { ...DEFAULTS, ...raw, settings: { ...DEFAULTS.settings, ...(raw.settings ?? {}) } };
  s.tasks = (s.tasks ?? []).map((t: Partial<Task>) => ({
    repeat: 'once' as Repeat,
    doneLog: {},
    notifiedOn: (t as { notified?: boolean }).notified ? todayKey() : null,
    ...t,
  } as Task));
  s.blocks = (s.blocks ?? []).map((b: Partial<Block>) => ({ days: ALL_DAYS, ...b } as Block));
  return s;
}

function loadState(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? migrate(JSON.parse(raw)) : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

/* ---------- task helpers ---------- */
export const isDueOn = (t: Task, k: string, weekday: number) => {
  if (t.repeat === 'once') return t.date === k;
  if (t.repeat === 'daily') return true;
  return t.repeat.includes(weekday);
};
export const isDueToday = (t: Task) => isDueOn(t, todayKey(), new Date().getDay());
export const isDoneOn = (t: Task, k: string) => (t.repeat === 'once' ? t.done : !!t.doneLog[k]);
export const isDoneToday = (t: Task) => isDoneOn(t, todayKey());

/* ---------- schedule helpers ---------- */
export const isNowInBlock = (b: Block) => {
  const now = new Date();
  const n = now.getHours() * 60 + now.getMinutes();
  const day = now.getDay();
  const prevDay = (day + 6) % 7;
  const days = b.days ?? ALL_DAYS;
  const s = toMin(b.start), e = toMin(b.end);
  if (s <= e) return days.includes(day) && n >= s && n < e;
  return (days.includes(day) && n >= s) || (days.includes(prevDay) && n < e);
};
export const currentBlock = (blocks: Block[]) => blocks.find(isNowInBlock) ?? null;
export const nextBlock = (blocks: Block[]) => {
  const n = nowMinutes();
  const day = new Date().getDay();
  const todays = blocks
    .filter(b => (b.days ?? ALL_DAYS).includes(day))
    .sort((a, b) => toMin(a.start) - toMin(b.start));
  return todays.find(b => toMin(b.start) > n) ?? todays[0] ?? null;
};

export const habitStreak = (h: Habit) => {
  let streak = 0;
  const d = new Date();
  if (!h.log[todayKey()]) d.setDate(d.getDate() - 1);
  while (h.log[dateKey(d)]) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
};

/* ---------- sound ---------- */
let audioCtx: AudioContext | null = null;
function chime(kind: 'done' | 'alert') {
  try {
    audioCtx ??= new AudioContext();
    const notes = kind === 'done' ? [523.25, 659.25, 783.99] : [659.25, 523.25];
    notes.forEach((f, i) => {
      const o = audioCtx!.createOscillator();
      const g = audioCtx!.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      const t0 = audioCtx!.currentTime + i * 0.16;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.22, t0 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45);
      o.connect(g).connect(audioCtx!.destination);
      o.start(t0); o.stop(t0 + 0.5);
    });
  } catch { /* audio unavailable */ }
}

/* ---------- context ---------- */
interface Ctx {
  s: State;
  view: View;
  setView: (v: View) => void;
  toast: string | null;
  showToast: (msg: string) => void;
  clock: number;

  addTask: (name: string, cat: TaskCat, prio: Prio, time: string | null, repeat: Repeat) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  toggleTask: (id: string) => void;
  delTask: (id: string) => void;
  addBlock: (name: string, type: BlockType, start: string, end: string, days: number[]) => void;
  updateBlock: (id: string, patch: Partial<Block>) => void;
  delBlock: (id: string) => void;
  addHabit: (name: string) => void;
  renameHabit: (id: string, name: string) => void;
  toggleHabit: (id: string) => void;
  delHabit: (id: string) => void;
  addNote: (text: string) => void;
  updateNote: (id: string, text: string) => void;
  delNote: (id: string) => void;
  setName: (name: string) => void;
  setSetting: (key: 'dark' | 'sound', value: boolean) => void;

  timer: TimerState;
  timerToggle: () => void;
  timerReset: () => void;
  timerSkip: () => void;
  setPreset: (min: number) => void;

  notifStatus: string;
  requestNotifs: () => Promise<void>;
  exportData: () => void;
  importData: (file: File) => Promise<boolean>;

  user: User | null;
  syncStatus: SyncStatus;
  authBusy: boolean;
  signUp: (email: string, password: string) => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  syncNow: () => Promise<void>;
}

const LifeOSContext = createContext<Ctx | null>(null);
export const useLifeOS = () => {
  const ctx = useContext(LifeOSContext);
  if (!ctx) throw new Error('useLifeOS outside provider');
  return ctx;
};

export function LifeOSProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<State>(loadState);
  const [view, setView] = useState<View>('dashboard');
  const [toast, setToast] = useState<string | null>(null);
  const [clock, setClock] = useState(0);
  const [notifStatus, setNotifStatus] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
  );
  const [user, setUser] = useState<User | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('off');
  const [authBusy, setAuthBusy] = useState(false);

  const toastTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const pushTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const sRef = useRef(s);
  sRef.current = s;
  const userRef = useRef(user);
  userRef.current = user;
  const skipNextPush = useRef(false);

  /* ---------- persistence + debounced cloud push ---------- */
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    if (skipNextPush.current) { skipNextPush.current = false; return; }
    localStorage.setItem(CHANGED_KEY, new Date().toISOString());
    if (userRef.current) {
      if (pushTimer.current) clearTimeout(pushTimer.current);
      pushTimer.current = setTimeout(() => void pushToCloud(), 2500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s]);

  const pushToCloud = useCallback(async () => {
    const u = userRef.current;
    if (!u) return;
    setSyncStatus('syncing');
    const { error } = await supabase.from('lifeos_state').upsert({
      user_id: u.id,
      data: sRef.current,
      updated_at: new Date().toISOString(),
    });
    setSyncStatus(error ? 'error' : 'synced');
  }, []);

  const pullFromCloud = useCallback(async (u: User) => {
    setSyncStatus('syncing');
    const { data, error } = await supabase
      .from('lifeos_state')
      .select('data, updated_at')
      .eq('user_id', u.id)
      .maybeSingle();
    if (error) { setSyncStatus('error'); return; }
    const localChangedAt = localStorage.getItem(CHANGED_KEY) ?? '1970';
    if (data && data.updated_at > localChangedAt) {
      skipNextPush.current = true;
      setS(migrate(data.data as Partial<State>));
      setSyncStatus('synced');
    } else {
      await pushToCloud();
    }
  }, [pushToCloud]);

  /* ---------- auth ---------- */
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null;
      setUser(u);
      if (u) void pullFromCloud(u);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [pullFromCloud]);

  const signUp = useCallback(async (email: string, password: string) => {
    setAuthBusy(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    setAuthBusy(false);
    if (error) return error.message;
    if (data.session) { void pullFromCloud(data.session.user); return null; }
    return 'CONFIRM_EMAIL';
  }, [pullFromCloud]);

  const signIn = useCallback(async (email: string, password: string) => {
    setAuthBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setAuthBusy(false);
    if (error) return error.message;
    if (data.user) void pullFromCloud(data.user);
    return null;
  }, [pullFromCloud]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSyncStatus('off');
  }, []);

  const syncNow = useCallback(async () => {
    if (userRef.current) await pushToCloud();
  }, [pushToCloud]);

  /* ---------- toast / notify ---------- */
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const notify = useCallback((title: string, body: string) => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      void (async () => {
        try {
          const reg = await navigator.serviceWorker?.getRegistration();
          if (reg) await reg.showNotification(title, { body, icon: 'icon.svg' });
          else new Notification(title, { body });
        } catch { /* ignore */ }
      })();
    }
    if (sRef.current.settings.sound) chime('alert');
    showToast(title);
  }, [showToast]);

  /* ---------- dark mode ---------- */
  useEffect(() => {
    document.documentElement.classList.toggle('dark', s.settings.dark);
  }, [s.settings.dark]);

  /* ---------- CRUD ---------- */
  const addTask = useCallback((name: string, cat: TaskCat, prio: Prio, time: string | null, repeat: Repeat) => {
    setS(p => ({
      ...p,
      tasks: [{
        id: uid(), name, cat, prio, time, repeat,
        done: false, doneLog: {}, date: todayKey(), notifiedOn: null,
      }, ...p.tasks],
    }));
    showToast('أُضيفت المهمة');
  }, [showToast]);

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setS(p => ({ ...p, tasks: p.tasks.map(t => (t.id === id ? { ...t, ...patch, notifiedOn: null } : t)) }));
    showToast('تم التعديل');
  }, [showToast]);

  const toggleTask = useCallback((id: string) => {
    const k = todayKey();
    setS(p => ({
      ...p,
      tasks: p.tasks.map(t => {
        if (t.id !== id) return t;
        if (t.repeat === 'once') return { ...t, done: !t.done };
        const doneLog = { ...t.doneLog };
        if (doneLog[k]) delete doneLog[k]; else doneLog[k] = true;
        return { ...t, doneLog };
      }),
    }));
    if (sRef.current.settings.sound) {
      const t = sRef.current.tasks.find(x => x.id === id);
      if (t && !isDoneToday(t)) chime('done');
    }
  }, []);

  const delTask = useCallback((id: string) => {
    setS(p => ({ ...p, tasks: p.tasks.filter(t => t.id !== id) }));
  }, []);

  const addBlock = useCallback((name: string, type: BlockType, start: string, end: string, days: number[]) => {
    setS(p => ({
      ...p,
      blocks: [...p.blocks, { id: uid(), name: name || BLOCK_META[type].label, type, start, end, days }]
        .sort((a, b) => toMin(a.start) - toMin(b.start)),
    }));
    showToast('أُضيفت الفترة إلى جدولك');
  }, [showToast]);

  const updateBlock = useCallback((id: string, patch: Partial<Block>) => {
    setS(p => ({
      ...p,
      blocks: p.blocks.map(b => (b.id === id ? { ...b, ...patch } : b))
        .sort((a, b) => toMin(a.start) - toMin(b.start)),
    }));
    showToast('تم التعديل');
  }, [showToast]);

  const delBlock = useCallback((id: string) => {
    setS(p => ({ ...p, blocks: p.blocks.filter(b => b.id !== id) }));
  }, []);

  const addHabit = useCallback((name: string) => {
    setS(p => ({ ...p, habits: [...p.habits, { id: uid(), name, log: {} }] }));
    showToast('أُضيفت العادة');
  }, [showToast]);

  const renameHabit = useCallback((id: string, name: string) => {
    setS(p => ({ ...p, habits: p.habits.map(h => (h.id === id ? { ...h, name } : h)) }));
    showToast('تم التعديل');
  }, [showToast]);

  const toggleHabit = useCallback((id: string) => {
    const k = todayKey();
    setS(p => ({
      ...p,
      habits: p.habits.map(h => {
        if (h.id !== id) return h;
        const log = { ...h.log };
        if (log[k]) delete log[k]; else log[k] = true;
        return { ...h, log };
      }),
    }));
    if (sRef.current.settings.sound) {
      const h = sRef.current.habits.find(x => x.id === id);
      if (h && !h.log[k]) chime('done');
    }
  }, []);

  const delHabit = useCallback((id: string) => {
    setS(p => ({ ...p, habits: p.habits.filter(h => h.id !== id) }));
  }, []);

  const addNote = useCallback((text: string) => {
    setS(p => ({ ...p, notes: [{ id: uid(), text, date: new Date().toISOString() }, ...p.notes] }));
    showToast('محفوظة — ما راح تنساها');
  }, [showToast]);

  const updateNote = useCallback((id: string, text: string) => {
    setS(p => ({ ...p, notes: p.notes.map(n => (n.id === id ? { ...n, text } : n)) }));
    showToast('تم التعديل');
  }, [showToast]);

  const delNote = useCallback((id: string) => {
    setS(p => ({ ...p, notes: p.notes.filter(n => n.id !== id) }));
  }, []);

  const setName = useCallback((name: string) => setS(p => ({ ...p, name })), []);

  const setSetting = useCallback((key: 'dark' | 'sound', value: boolean) => {
    setS(p => ({ ...p, settings: { ...p.settings, [key]: value } }));
  }, []);

  /* ---------- Pomodoro timer ---------- */
  const [timer, setTimer] = useState<TimerState>({ left: 25 * 60, total: 25 * 60, running: false, phase: 'work', preset: 25 });

  useEffect(() => {
    if (!timer.running) return;
    const t = setInterval(() => {
      setTimer(p => {
        if (p.left > 1) return { ...p, left: p.left - 1 };
        if (p.phase === 'work') {
          const k = todayKey();
          setS(prev => {
            const f = prev.focus[k] ?? { sessions: 0, minutes: 0 };
            return { ...prev, focus: { ...prev.focus, [k]: { sessions: f.sessions + 1, minutes: f.minutes + Math.round(p.total / 60) } } };
          });
          notify('انتهت جلسة التركيز', 'خذ استراحة 5 دقائق — تستاهلها');
          return { ...p, phase: 'break', total: 5 * 60, left: 5 * 60, running: false };
        }
        notify('انتهت الاستراحة', 'جاهز لجلسة تركيز جديدة؟');
        return { ...p, phase: 'work', total: p.preset * 60, left: p.preset * 60, running: false };
      });
    }, 1000);
    return () => clearInterval(t);
  }, [timer.running, notify]);

  const timerToggle = useCallback(() => setTimer(p => ({ ...p, running: !p.running })), []);
  const timerReset = useCallback(() => setTimer(p => ({ ...p, running: false, phase: 'work', total: p.preset * 60, left: p.preset * 60 })), []);
  const timerSkip = useCallback(() => setTimer(p => ({ ...p, left: 1, running: true })), []);
  const setPreset = useCallback((min: number) => {
    setTimer(p => (p.running ? { ...p, preset: min } : { ...p, preset: min, phase: 'work', total: min * 60, left: min * 60 }));
  }, []);

  /* ---------- reminders & block transitions (every 30s) ---------- */
  useEffect(() => {
    const loop = setInterval(() => {
      setClock(c => c + 1);
      const st = sRef.current;
      const k = todayKey();
      const n = nowMinutes();
      const weekday = new Date().getDay();

      const dueTasks = st.tasks.filter(t =>
        t.time && t.notifiedOn !== k && isDueOn(t, k, weekday) && !isDoneOn(t, k) && toMin(t.time) <= n,
      );
      const cur = currentBlock(st.blocks);
      const curId = cur?.id ?? null;
      const blockChanged = curId !== st.lastBlockId;

      if (dueTasks.length || blockChanged) {
        for (const t of dueTasks) notify(`تذكير: ${t.name}`, `حان وقتها (${fmt12(t.time!)})`);
        if (blockChanged && cur) notify(`بدأت فترة: ${cur.name}`, `حتى ${fmt12(cur.end)}`);
        setS(p => ({
          ...p,
          lastBlockId: curId,
          tasks: dueTasks.length
            ? p.tasks.map(t => (dueTasks.some(d => d.id === t.id) ? { ...t, notifiedOn: k } : t))
            : p.tasks,
        }));
      }
    }, 30 * 1000);
    return () => clearInterval(loop);
  }, [notify]);

  /* ---------- notifications permission ---------- */
  const requestNotifs = useCallback(async () => {
    if (typeof Notification === 'undefined') { showToast('متصفحك لا يدعم الإشعارات'); return; }
    const p = await Notification.requestPermission();
    setNotifStatus(p);
    showToast(p === 'granted' ? 'الإشعارات مفعّلة' : 'لم يتم التفعيل');
  }, [showToast]);

  /* ---------- backup ---------- */
  const exportData = useCallback(() => {
    const blob = new Blob([JSON.stringify(sRef.current, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `lifeos-backup-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('تم تصدير نسختك الاحتياطية');
  }, [showToast]);

  const importData = useCallback(async (file: File) => {
    try {
      const data = JSON.parse(await file.text());
      if (!data || typeof data !== 'object' || !Array.isArray(data.tasks)) throw new Error('bad');
      setS(migrate(data));
      showToast('تم استرجاع بياناتك');
      return true;
    } catch {
      showToast('الملف غير صالح');
      return false;
    }
  }, [showToast]);

  const value = useMemo<Ctx>(() => ({
    s, view, setView, toast, showToast, clock,
    addTask, updateTask, toggleTask, delTask,
    addBlock, updateBlock, delBlock,
    addHabit, renameHabit, toggleHabit, delHabit,
    addNote, updateNote, delNote, setName, setSetting,
    timer, timerToggle, timerReset, timerSkip, setPreset,
    notifStatus, requestNotifs, exportData, importData,
    user, syncStatus, authBusy, signUp, signIn, signOut, syncNow,
  }), [s, view, toast, clock, timer, notifStatus, user, syncStatus, authBusy,
    addTask, updateTask, toggleTask, delTask, addBlock, updateBlock, delBlock,
    addHabit, renameHabit, toggleHabit, delHabit, addNote, updateNote, delNote,
    setName, setSetting, timerToggle, timerReset, timerSkip, setPreset,
    requestNotifs, exportData, importData, signUp, signIn, signOut, syncNow, showToast]);

  return <LifeOSContext.Provider value={value}>{children}</LifeOSContext.Provider>;
}
