import React from 'react';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLifeOS } from '../store';
import { todayKey, last7Days, fmtClock } from '../lib/time';
import { Chip, PageHead } from './ui';

const PRESETS = [15, 25, 45, 60];

export default function Focus() {
  const { s, timer, timerToggle, timerReset, timerSkip, setPreset } = useLifeOS();
  const R = 52;
  const C = 2 * Math.PI * R;
  const progress = 1 - timer.left / timer.total;

  const t = s.focus[todayKey()] ?? { sessions: 0, minutes: 0 };
  const week = last7Days().reduce((sum, d) => sum + (s.focus[d]?.minutes ?? 0), 0);

  const stats = [
    { v: t.sessions, label: 'جلسات اليوم' },
    { v: t.minutes, label: 'دقيقة اليوم' },
    { v: week, label: 'دقيقة هذا الأسبوع' },
  ];

  return (
    <section>
      <PageHead title="وضع التركيز" sub="بومودورو ذكي: اشتغل بعمق، وارتَح باستحقاق" />

      <div className="flex flex-col items-center gap-8 pt-2">
        <div className="relative h-[min(320px,78vw)] w-[min(320px,78vw)]">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle cx="60" cy="60" r={R} fill="none" stroke="#dcd3bd" strokeWidth="1.5" className="dotted-ring" />
            <circle
              cx="60" cy="60" r={R} fill="none" stroke="var(--color-sun)" strokeWidth="6" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C * (1 - progress)}
              style={{ transition: 'stroke-dashoffset .8s linear' }}
            />
          </svg>
          <div className="absolute inset-0 grid place-content-center text-center">
            <b className="font-num text-[clamp(48px,10vw,68px)] font-bold leading-none tracking-tight">{fmtClock(timer.left)}</b>
            <span className="mt-2 text-[14px] font-bold text-mut">{timer.phase === 'work' ? 'جلسة عمل' : 'استراحة'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={timerToggle}
            className="flex items-center gap-2 rounded-2xl bg-ink px-8 py-4 text-[16px] font-black text-cream transition hover:-translate-y-0.5 hover:bg-ink-2"
          >
            {timer.running ? <Pause size={17} /> : <Play size={17} />}
            {timer.running ? 'إيقاف مؤقت' : 'ابدأ التركيز'}
          </button>
          <button onClick={timerSkip} aria-label="تخطّ" className="grid h-13 w-13 place-items-center rounded-2xl border border-linec bg-card p-4 transition hover:border-ink/40">
            <SkipForward size={17} />
          </button>
          <button onClick={timerReset} aria-label="إعادة" className="grid h-13 w-13 place-items-center rounded-2xl border border-linec bg-card p-4 transition hover:border-ink/40">
            <RotateCcw size={17} />
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm text-mut">
          <span className="me-1 font-bold">مدة الجلسة:</span>
          {PRESETS.map(m => (
            <Chip key={m} active={timer.preset === m} onClick={() => setPreset(m)}>{m} د</Chip>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {stats.map(x => (
            <div key={x.label} className="min-w-36 rounded-3xl border border-linec bg-card px-8 py-5 text-center">
              <b className="font-num block text-3xl font-black">{x.v}</b>
              <span className="text-[12px] text-mut">{x.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
