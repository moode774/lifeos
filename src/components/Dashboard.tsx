import React from 'react';
import {
  CheckCircle2, Timer, Flame, Play, Pause, RotateCcw, ArrowUpLeft, Check,
  CalendarClock, Sun, BarChart2, Maximize, Plus, ClipboardList,
} from 'lucide-react';
import { cn } from '../lib/utils';
import {
  useLifeOS, currentBlock, nextBlock, isNowInBlock, isDueToday, isDoneToday,
} from '../store';
import { todayKey, last7Days, fmtClock, fmt12, arabicDate, DAY_LETTER } from '../lib/time';
import { BLOCK_META, CAT_META, PRIO_ORDER } from '../lib/meta';
import { Card, Empty } from './ui';
import type { State } from '../types';

function activityStreak(s: State) {
  const active = (k: string) =>
    (s.focus[k]?.minutes ?? 0) > 0 ||
    s.tasks.some(t => (t.repeat === 'once' ? t.done && t.date === k : !!t.doneLog[k])) ||
    s.habits.some(h => h.log[k]);
  let streak = 0;
  const d = new Date();
  const key = () => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  if (!active(key())) d.setDate(d.getDate() - 1);
  while (active(key())) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
}

function dayPcts(s: State) {
  const k = todayKey();
  const todays = s.tasks.filter(isDueToday);
  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
  return {
    tasks: pct(todays.filter(isDoneToday).length, todays.length),
    habits: pct(s.habits.filter(h => h.log[k]).length, s.habits.length),
    focus: Math.min(pct(s.focus[k]?.minutes ?? 0, 120), 100),
  };
}

/* ================= header ================= */
function HeaderStats() {
  const { s } = useLifeOS();
  const k = todayKey();
  const done = s.tasks.filter(t => isDueToday(t) && isDoneToday(t)).length;
  const focusMin = s.focus[k]?.minutes ?? 0;
  const streak = activityStreak(s);

  const stats = [
    { Icon: CheckCircle2, value: done, label: 'مهمة منجزة' },
    { Icon: Timer, value: focusMin, label: 'دقيقة تركيز' },
    { Icon: Flame, value: streak, label: 'يوم متتالي' },
  ];

  return (
    <div className="flex flex-wrap gap-4">
      {stats.map(({ Icon, value, label }) => (
        <div key={label} className="flex min-w-[140px] flex-1 items-center gap-4 rounded-[24px] border border-white/50 bg-white/80 p-4 shadow-sm backdrop-blur-xl">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-600">
            <Icon size={22} strokeWidth={2.5} />
          </span>
          <div>
            <b className="font-num text-2xl font-black leading-none text-ink">{value}</b>
            <span className="mt-1 block text-[12px] font-bold text-mut">{label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ================= progress strip ================= */
function ProgressStrip() {
  const { s } = useLifeOS();
  const p = dayPcts(s);
  const overall = Math.round((p.tasks + p.habits + p.focus) / 3);

  const pills = [
    { label: 'الإنجاز', v: overall },
    { label: 'التركيز', v: p.focus },
    { label: 'العادات', v: p.habits },
    { label: 'المهام', v: p.tasks },
  ] as const;

  return (
    <div className="mb-6 flex flex-wrap gap-3">
      {pills.map(pl => (
        <div key={pl.label} className="flex min-w-[140px] flex-1 items-center gap-3 rounded-[20px] border border-white/50 bg-white/80 p-2.5 px-4 shadow-sm backdrop-blur-xl">
          <span className="whitespace-nowrap text-[13px] font-bold text-ink">{pl.label}</span>
          <div className="relative h-8 flex-1 overflow-hidden rounded-full bg-blue-50">
            <div
              className="absolute inset-y-0 start-0 rounded-full bg-blue-600 transition-all duration-700"
              style={{ width: `${Math.max(pl.v, 15)}%` }}
            />
            <span className="absolute inset-y-0 start-3 z-10 flex items-center font-num text-[11px] font-bold text-white">
              {pl.v}%
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ================= profile card ================= */
function ProfileCard() {
  const { s, clock } = useLifeOS();
  void clock;
  const cur = currentBlock(s.blocks);
  const nxt = nextBlock(s.blocks);
  const streak = activityStreak(s);
  const CurIcon = cur ? BLOCK_META[cur.type].Icon : Sun;

  return (
    <Card className="relative flex flex-col overflow-hidden border-none bg-gradient-to-b from-[#0f172a] to-[#1e3a8a] p-0 text-white md:col-span-3 md:row-span-2 shadow-2xl">
      <div className="relative z-10 flex flex-1 flex-col items-center px-6 pt-9 text-center">
        <div className="grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-blue-400 to-blue-700 text-4xl font-black text-white shadow-[0_10px_40px_-10px_rgba(59,130,246,0.6)]">
          {s.name ? s.name.slice(0, 1) : '؟'}
        </div>
        <h3 className="mt-4 text-2xl font-black">{s.name || 'اكتب اسمك'}</h3>
        <p className="mt-1 text-[13px] text-blue-200">{arabicDate()}</p>

        <div className="mt-4 flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-5 py-2 text-white backdrop-blur-md">
          <Flame size={15} className="text-blue-300" />
          <span className="font-num text-sm font-black">{streak}</span>
          <span className="text-[12px] font-bold">يوم متتالي</span>
        </div>
      </div>

      <div className="relative z-10 mt-6 mx-5 mb-5 rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-inner">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[14px] font-extrabold text-white">وقت اليوم</div>
          <Sun size={16} className="text-blue-300" />
        </div>
        <div className="text-[13px] text-blue-200 mb-5 text-center">
          {cur ? `حان وقت ${cur.name}` : 'التالي: لا شيء مجدول'}
        </div>
        <button className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 py-3 text-[14px] font-bold text-white transition-colors shadow-lg">
          ابدأ الآن
        </button>
      </div>

      {/* Glowing Waves SVG background */}
      <div className="absolute bottom-0 left-0 right-0 z-0 opacity-50 mix-blend-screen pointer-events-none">
        <svg viewBox="0 0 1440 320" className="w-full h-auto">
          <path fill="none" stroke="#60a5fa" strokeWidth="2" d="M0,256L48,229.3C96,203,192,149,288,144C384,139,480,181,576,197.3C672,213,768,203,864,181.3C960,160,1056,128,1152,138.7C1248,149,1344,203,1392,229.3L1440,256"></path>
          <path fill="none" stroke="#3b82f6" strokeWidth="4" d="M0,192L48,202.7C96,213,192,235,288,234.7C384,235,480,213,576,213.3C672,213,768,235,864,250.7C960,267,1056,277,1152,261.3C1248,245,1344,203,1392,181.3L1440,160"></path>
        </svg>
      </div>
    </Card>
  );
}

/* ================= weekly progress chart ================= */
function ProgressChart() {
  const { s } = useLifeOS();
  const days = last7Days();
  const k = todayKey();
  const values = days.map(d => s.focus[d]?.minutes ?? 0);
  const max = Math.max(...values, 30);
  const weekTotal = values.reduce((a, b) => a + b, 0);
  const hours = (weekTotal / 60).toFixed(1);

  return (
    <Card className="md:col-span-3">
      <div className="flex items-start justify-between">
        <h3 className="text-[15px] font-extrabold">التقدم</h3>
        <span className="grid h-8 w-8 place-items-center rounded-full border border-linec"><ArrowUpLeft size={14} /></span>
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <b className="font-num text-4xl font-black">{hours}<span className="text-xl">h</span></b>
        <span className="text-[11.5px] leading-tight text-mut">تركيز هذا<br />الأسبوع</span>
      </div>

      <div className="mt-5 flex h-28 items-end gap-2">
        {days.map((d, i) => {
          const v = values[i];
          const isToday = d === k;
          return (
            <div key={d} className="flex flex-1 flex-col items-center gap-1.5" style={{ height: '100%' }}>
              <div className="relative flex w-full flex-1 items-end justify-center">
                {isToday && v > 0 && (
                  <span className="absolute -top-1 rounded-full bg-sun px-2 py-0.5 font-num text-[10px] font-black text-night">
                    {v}د
                  </span>
                )}
                <div
                  className={cn('w-2 rounded-full transition-all duration-700', isToday ? 'bg-sun' : 'bg-ink/80')}
                  style={{ height: `${Math.max((v / max) * 100, 6)}%` }}
                />
              </div>
              <span className={cn('text-[10.5px] font-bold', isToday ? 'text-ink' : 'text-mut')}>
                {DAY_LETTER[new Date(d + 'T12:00').getDay()]}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ================= time tracker ================= */
function TimeTracker() {
  const { timer, timerToggle, timerReset } = useLifeOS();
  const R = 52;
  const C = 2 * Math.PI * R;
  const progress = 1 - timer.left / timer.total;

  return (
    <Card className="flex flex-col md:col-span-3">
      <div className="flex items-start justify-between">
        <h3 className="text-[15px] font-extrabold text-ink">متتبّع الوقت</h3>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-50 text-blue-600"><Maximize size={14} /></span>
      </div>

      <div className="relative mx-auto mt-3 h-40 w-40">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r={R} fill="none" stroke="#eff6ff" strokeWidth="4" className="dotted-ring" />
          <circle
            cx="60" cy="60" r={R} fill="none" stroke="#3b82f6" strokeWidth="6" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - progress)}
            style={{ transition: 'stroke-dashoffset .8s linear' }}
          />
        </svg>
        <div className="absolute inset-0 grid place-content-center text-center">
          <b className="font-num text-[34px] font-bold leading-none tracking-tight text-blue-600">{fmtClock(timer.left)}</b>
          <span className="mt-1 text-[11.5px] font-bold text-mut">{timer.phase === 'work' ? 'وقت التركيز' : 'استراحة'}</span>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-center gap-4 pt-3">
        <button
          onClick={timerReset}
          aria-label="إعادة"
          className="grid h-12 w-12 place-items-center rounded-full bg-blue-600 text-white shadow-md transition hover:bg-blue-700"
        >
          <RotateCcw size={16} />
        </button>
        <button
          onClick={timerToggle}
          aria-label={timer.running ? 'إيقاف' : 'تشغيل'}
          className="grid h-12 w-12 place-items-center rounded-full border-2 border-blue-50 bg-white text-blue-600 shadow-sm transition hover:border-blue-100"
        >
          {timer.running ? <Pause size={18} /> : <Play size={18} className="translate-x-[1px]" />}
        </button>
      </div>
    </Card>
  );
}

/* ================= day progress ================= */
function DayProgress() {
  const { s } = useLifeOS();
  const p = dayPcts(s);
  const overall = Math.round((p.tasks + p.habits + p.focus) / 3);

  const segs = [
    { label: 'مهام', v: p.tasks, cls: 'bg-blue-200' },
    { label: 'عادات', v: p.habits, cls: 'bg-blue-400' },
    { label: 'تركيز', v: p.focus, cls: 'bg-blue-600' },
  ];

  return (
    <Card className="md:col-span-3">
      <div className="flex items-start justify-between">
        <h3 className="text-[15px] font-extrabold text-ink">إنجاز اليوم</h3>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-blue-50 text-blue-600"><BarChart2 size={16} /></span>
      </div>

      <div className="mt-5 space-y-5">
        {segs.map(sg => (
          <div key={sg.label}>
            <div className="mb-2 flex justify-between text-[11.5px] font-bold text-mut">
              <span>{sg.label}</span>
              <span className="font-num">{sg.v}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-blue-50">
              <div className={cn('h-full rounded-full transition-all duration-700', sg.cls)} style={{ width: `${sg.v}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ================= today schedule strip ================= */
function ScheduleStrip() {
  const { s, setView, clock } = useLifeOS();
  void clock;
  const day = new Date().getDay();
  const blocks = s.blocks.filter(b => (b.days ?? [0, 1, 2, 3, 4, 5, 6]).includes(day));

  return (
    <Card className="md:col-span-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[15px] font-extrabold text-ink">جدول اليوم</h3>
        <button
          onClick={() => setView('schedule')}
          className="rounded-full bg-blue-50 px-4 py-1.5 text-[12px] font-bold text-blue-600 transition hover:bg-blue-100"
        >
          تعديل الجدول
        </button>
      </div>

      {blocks.length === 0 ? (
        <div className="py-8 text-center text-sm text-mut">
          <CalendarClock size={28} className="mx-auto mb-3 text-blue-400" />
          <p className="text-ink font-bold mb-1">لا توجد فترات مجدولة</p>
          <p className="text-mut text-[12px] mb-5">أضف فترات يومك (الدراسة، الرياضة، القراءة...) ونظم يومك بسهولة</p>
          <button onClick={() => setView('schedule')} className="flex items-center gap-2 mx-auto rounded-full bg-blue-50 px-5 py-2 text-[13px] font-bold text-blue-600 transition hover:bg-blue-100">
             <Plus size={16} />
             أضف فترة جديدة
          </button>
        </div>
      ) : (
        <div className="custom-scrollbar flex gap-2.5 overflow-x-auto pb-1">
          {blocks.map(b => {
            const meta = BLOCK_META[b.type];
            const live = isNowInBlock(b);
            const Icon = meta.Icon;
            return (
              <div
                key={b.id}
                className={cn(
                  'flex min-w-fit items-center gap-2.5 rounded-full py-2 pe-4 ps-2 transition',
                  live ? 'bg-night text-paper' : 'border border-linec bg-card',
                )}
              >
                <span
                  className="grid h-8 w-8 place-items-center rounded-full"
                  style={{ background: live ? 'var(--color-sun)' : meta.soft, color: live ? '#1b1b18' : meta.color }}
                >
                  <Icon size={14} />
                </span>
                <div className="whitespace-nowrap">
                  <div className="text-[13px] font-extrabold leading-tight">{b.name}</div>
                  <div className={cn('font-num text-[10.5px]', live ? 'text-paper/60' : 'text-mut')}>
                    {fmt12(b.start)} — {fmt12(b.end)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/* ================= dark tasks card ================= */
function TodayTasksCard() {
  const { s, toggleTask, setView } = useLifeOS();
  const todays = [...s.tasks.filter(isDueToday)]
    .sort((a, b) => Number(isDoneToday(a)) - Number(isDoneToday(b)) || PRIO_ORDER[a.prio] - PRIO_ORDER[b.prio]);
  const done = todays.filter(isDoneToday).length;

  return (
    <Card className="md:col-span-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[15px] font-extrabold text-ink">مهام اليوم</h3>
        <b className="font-num text-lg font-black text-blue-600">
          {done}<span className="text-blue-300">/{todays.length}</span>
        </b>
      </div>

      {todays.length === 0 ? (
        <div className="py-6 text-center text-[13px] text-mut">
          <ClipboardList size={32} className="mx-auto mb-3 text-blue-400" />
          <p className="text-ink font-bold mb-1 text-[15px]">لا مهام لليوم</p>
          <p className="text-mut text-[12px] mb-6">أضف مهمة جديدة للبدء</p>
          <button onClick={() => setView('tasks')} className="flex items-center justify-center gap-2 w-full rounded-xl bg-blue-600 py-3 text-[14px] font-bold text-white transition hover:bg-blue-700 shadow-md">
            <Plus size={18} />
            أضف مهمة
          </button>
        </div>
      ) : (
        <div className="custom-scrollbar max-h-56 space-y-2 overflow-y-auto pe-1">
          {todays.slice(0, 8).map(t => {
            const Icon = CAT_META[t.cat].Icon;
            const tdone = isDoneToday(t);
            return (
              <button
                key={t.id}
                onClick={() => toggleTask(t.id)}
                className="flex w-full items-center gap-3 rounded-2xl bg-slate-50 border border-transparent px-4 py-3 text-start transition hover:bg-blue-50 hover:border-blue-100"
              >
                <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-full', tdone ? 'bg-blue-100 text-blue-500' : 'bg-white text-blue-600 shadow-sm')}>
                  <Icon size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className={cn('truncate text-[13.5px] font-bold transition-colors', tdone ? 'text-mut line-through' : 'text-ink')}>{t.name}</div>
                  {t.time && <div className="whitespace-nowrap font-num text-[11px] text-mut mt-0.5">{fmt12(t.time)}</div>}
                </div>
                <span className={cn(
                  'grid h-6 w-6 shrink-0 place-items-center rounded-full transition shadow-sm',
                  tdone ? 'bg-blue-600 text-white' : 'border-2 border-linec bg-white text-transparent',
                )}>
                  <Check size={13} strokeWidth={3} />
                </span>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/* ================= dashboard ================= */
export default function Dashboard() {
  const { s } = useLifeOS();
  const h = new Date().getHours();
  const greet = h < 12 ? 'صباح الخير' : h < 17 ? 'مساء النور' : 'مساء الخير';

  return (
    <section>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-5">
        <h1 className="text-[clamp(28px,4.4vw,44px)] font-black leading-tight">
          {greet}{s.name ? `، ${s.name}` : ''}
        </h1>
        <HeaderStats />
      </header>

      <ProgressStrip />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        <ProfileCard />
        <ProgressChart />
        <TimeTracker />
        <DayProgress />
        <ScheduleStrip />
        <TodayTasksCard />
      </div>
    </section>
  );
}
