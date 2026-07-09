export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const dateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const nowMinutes = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};

export const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export const pad = (n: number) => String(n).padStart(2, '0');

export const fmtClock = (sec: number) => `${pad(Math.floor(sec / 60))}:${pad(sec % 60)}`;

export const fmt12 = (hhmm: string) => {
  let [h, m] = hhmm.split(':').map(Number);
  const p = h >= 12 ? 'م' : 'ص';
  h = h % 12 || 12;
  return `${h}:${pad(m)} ${p}`;
};

export const last7Days = (): string[] =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return dateKey(d);
  });

export const DAY_LETTER = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س']; // getDay() index

export const durationLabel = (start: string, end: string) => {
  let d = toMin(end) - toMin(start);
  if (d < 0) d += 1440;
  const h = Math.floor(d / 60), m = d % 60;
  if (h && m) return `${h} س ${m} د`;
  if (h) return `${h} س`;
  return `${m} د`;
};

export const arabicDate = () =>
  new Date().toLocaleDateString('ar', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
