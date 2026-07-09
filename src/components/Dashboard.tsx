import React from 'react';
import {
  CheckCircle2, Timer, Flame, Play, Pause, RotateCcw, ArrowUpLeft, Check,
  CalendarClock, Sun,
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
    <div className="flex gap-8">
      {stats.map(({ Icon, value, label }) => (
        <div key={label} className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-full border border-linec bg-card">
            <Icon size={15} className="text-ink" />
          </span>
          <div className="flex items-baseline gap-2">
            <b className="font-num text-[clamp(30px,3.4vw,46px)] font-black leading-none">{value}</b>
            <span className="max-w-16 text-[11.5px] leading-tight text-mut">{label}</span>
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
    { label: 'المهام', v: p.tasks, style: 'dark' },
    { label: 'العادات', v: p.habits, style: 'sun' },
    { label: 'التركيز', v: p.focus, style: 'stripe' },
    { label: 'الإنجاز', v: overall, style: 'outline' },
  ] as const;

  return (
    <div className="mb-6 flex flex-wrap gap-3">
      {pills.map(pl => (
        <div key={pl.label} className="flex min-w-40 flex-1 items-center gap-3 sm:max-w-64">
          <span className="whitespace-nowrap text-[12.5px] font-bold text-mut">{pl.label}</span>
          <div className="relative h-9 flex-1 overflow-hidden rounded-full border border-linec bg-card">
            <div
              className={cn(
                'absolute inset-y-0 start-0 rounded-full transition-all duration-700',
                pl.style === 'dark' && 'bg-ink',
                pl.style === 'sun' && 'bg-sun',
                pl.style === 'stripe' && 'bg-[repeating-linear-gradient(-45deg,var(--color-linec)_0_5px,transparent_5px_10px)]',
                pl.style === 'outline' && 'border-2 border-ink/15 bg-transparent',
              )}
              style={{ width: `${Math.max(pl.v, 13)}%` }}
            />
            <span className={cn(
              'absolute inset-y-0 start-3 z-10 grid place-items-center font-num text-[12px] font-bold',
              pl.style === 'dark' ? 'text-cream' : 'text-ink',
            )}>
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
    <Card className="relative flex flex-col overflow-hidden border-none bg-gradient-to-b from-night to-night-2 p-0 text-paper md:col-span-3 md:row-span-2">
      <div className="flex flex-1 flex-col items-center px-6 pt-9 text-center">
        <div className="grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-sun to-[#d9a441] text-4xl font-black text-night shadow-[0_10px_40px_-10px_rgba(242,209,78,.6)]">
          {s.name ? s.name.slice(0, 1) : '؟'}
        </div>
        <h3 className="mt-4 text-2xl font-black">{s.name || 'اكتب اسمك في التخصيص'}</h3>
        <p className="mt-1 text-[13px] text-paper/50">{arabicDate()}</p>

        <div className="mt-4 flex items-center gap-2 rounded-full bg-sun px-4 py-2 text-night">
          <Flame size={15} />
          <span className="font-num text-sm font-black">{streak}</span>
          <span className="text-[12px] font-bold">يوم متتالي</span>
        </div>
      </div>

      <div className="mt-6 space-y-2 border-t border-white/10 p-5">
        <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sun text-night">
            <CurIcon size={15} />
          </span>
          <div className="min-w-0 flex-1 text-start">
            <div className="truncate text-[14px] font-extrabold">{cur ? cur.name : 'وقت حر'}</div>
            <div className="truncate whitespace-nowrap text-[11px] text-paper/50">
              {cur ? `${fmt12(cur.start)} ← ${fmt12(cur.end)}` : 'ما فيه فترة الآن'}
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-sun/15 px-2.5 py-1 text-[10.5px] font-black text-sun">الآن</span>
        </div>
        <div className="px-1 text-[12px] text-paper/45">
          {nxt ? `التالي: ${nxt.name} الساعة ${fmt12(nxt.start)}` : 'التالي: لا شيء مجدول'}
        </div>
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
        <h3 className="text-[15px] font-extrabold">متتبّع الوقت</h3>
        <span className="grid h-8 w-8 place-items-center rounded-full border border-linec"><ArrowUpLeft size={14} /></span>
      </div>

      <div className="relative mx-auto mt-3 h-40 w-40">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r={R} fill="none" stroke="var(--color-linec)" strokeWidth="2" className="dotted-ring" />
          <circle
            cx="60" cy="60" r={R} fill="none" stroke="var(--color-sun)" strokeWidth="7" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - progress)}
            style={{ transition: 'stroke-dashoffset .8s linear' }}
          />
        </svg>
        <div className="absolute inset-0 grid place-content-center text-center">
          <b className="font-num text-[34px] font-bold leading-none tracking-tight">{fmtClock(timer.left)}</b>
          <span className="mt-1 text-[11.5px] text-mut">{timer.phase === 'work' ? 'وقت التركيز' : 'استراحة'}</span>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-center gap-2 pt-3">
        <button
          onClick={timerToggle}
          aria-label={timer.running ? 'إيقاف' : 'تشغيل'}
          className="grid h-11 w-11 place-items-center rounded-full border border-linec bg-card transition hover:bg-sun hover:text-night"
        >
          {timer.running ? <Pause size={16} /> : <Play size={16} className="translate-x-[1px]" />}
        </button>
        <button
          onClick={timerReset}
          aria-label="إعادة"
          className="grid h-11 w-11 place-items-center rounded-full bg-night text-paper transition hover:bg-night-2"
        >
          <RotateCcw size={15} />
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
    { label: 'مهام', v: p.tasks, cls: 'bg-sun' },
    { label: 'عادات', v: p.habits, cls: 'bg-ink' },
    { label: 'تركيز', v: p.focus, cls: 'bg-[repeating-linear-gradient(-45deg,var(--color-linec)_0_5px,var(--color-card-2)_5px_10px)]' },
  ];

  return (
    <Card className="md:col-span-3">
      <div className="flex items-start justify-between">
        <h3 className="text-[15px] font-extrabold">إنجاز اليوم</h3>
        <b className="font-num text-3xl font-black">{overall}%</b>
      </div>

      <div className="mt-5 space-y-4">
        {segs.map(sg => (
          <div key={sg.label}>
            <div className="mb-1.5 flex justify-between text-[11.5px] font-bold text-mut">
              <span>{sg.label}</span>
              <span className="font-num">{sg.v}%</span>
            </div>
            <div className="h-8 overflow-hidden rounded-xl border border-linec bg-card">
              <div className={cn('h-full rounded-xl transition-all duration-700', sg.cls)} style={{ width: `${sg.v}%` }} />
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
        <h3 className="text-[15px] font-extrabold">جدول اليوم</h3>
        <button
          onClick={() => setView('schedule')}
          className="rounded-full border border-linec px-3.5 py-1.5 text-[12px] font-bold text-mut transition hover:text-ink"
        >
          تعديل الجدول
        </button>
      </div>

      {blocks.length === 0 ? (
        <Empty>
          <CalendarClock size={22} className="mx-auto mb-2 text-mut" />
          ما فيه فترات لليوم — أضف فترات يومك (الدوام، الطريق، الاسترخاء، اللعب) والنظام ينبهك عند كل تحوّل
        </Empty>
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
    <Card className="border-none bg-gradient-to-b from-night to-night-2 text-paper md:col-span-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[15px] font-extrabold">مهام اليوم</h3>
        <b className="font-num text-lg font-black">
          {done}<span className="text-paper/40">/{todays.length}</span>
        </b>
      </div>

      {todays.length === 0 ? (
        <div className="py-6 text-center text-[13px] text-paper/40">
          لا مهام اليوم —
          <button onClick={() => setView('tasks')} className="ms-1 font-bold text-sun underline-offset-4 hover:underline">
            أضف أول مهمة
          </button>
        </div>
      ) : (
        <div className="custom-scrollbar max-h-56 space-y-1.5 overflow-y-auto pe-1">
          {todays.slice(0, 8).map(t => {
            const Icon = CAT_META[t.cat].Icon;
            const tdone = isDoneToday(t);
            return (
              <button
                key={t.id}
                onClick={() => toggleTask(t.id)}
                className="flex w-full items-center gap-3 rounded-2xl bg-white/5 px-3 py-2.5 text-start transition hover:bg-white/10"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 text-paper/70">
                  <Icon size={12} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className={cn('truncate text-[13px] font-bold', tdone && 'text-paper/35 line-through')}>{t.name}</div>
                  {t.time && <div className="whitespace-nowrap font-num text-[10.5px] text-paper/40">{fmt12(t.time)}</div>}
                </div>
                <span className={cn(
                  'grid h-6 w-6 shrink-0 place-items-center rounded-full transition',
                  tdone ? 'bg-sun text-night' : 'border-2 border-white/20 text-transparent',
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
