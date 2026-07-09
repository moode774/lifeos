import React from 'react';
import { Timer, CheckCircle2, Trophy, Flame } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLifeOS, habitStreak } from '../store';
import { dateKey, todayKey, DAY_LETTER } from '../lib/time';
import { Card, CardTitle, Empty, PageHead } from './ui';

function lastNDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return dateKey(d);
  });
}

export default function Stats() {
  const { s } = useLifeOS();
  const days30 = lastNDays(30);
  const k = todayKey();

  const focusVals = days30.map(d => s.focus[d]?.minutes ?? 0);
  const totalFocus = focusVals.reduce((a, b) => a + b, 0);
  const maxFocus = Math.max(...focusVals, 30);
  const bestIdx = focusVals.indexOf(Math.max(...focusVals));
  const bestDay = focusVals[bestIdx] > 0
    ? new Date(days30[bestIdx] + 'T12:00').toLocaleDateString('ar', { weekday: 'long', day: 'numeric', month: 'long' })
    : '—';

  const tasksDone30 = days30.reduce(
    (sum, d) => sum + s.tasks.filter(t => (t.repeat === 'once' ? t.done && t.date === d : !!t.doneLog[d])).length,
    0,
  );

  const longestStreak = Math.max(0, ...s.habits.map(habitStreak));

  const cards = [
    { Icon: Timer, v: `${(totalFocus / 60).toFixed(1)}h`, label: 'تركيز آخر 30 يوم' },
    { Icon: CheckCircle2, v: tasksDone30, label: 'مهمة منجزة آخر 30 يوم' },
    { Icon: Trophy, v: bestDay, label: 'أفضل يوم تركيز', small: true },
    { Icon: Flame, v: longestStreak, label: 'أطول سلسلة عادة' },
  ];

  return (
    <section>
      <PageHead title="الإحصائيات" sub="صورتك الكاملة — آخر 30 يوم" />

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(({ Icon, v, label, small }) => (
          <Card key={label} className="flex items-center gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sun/25 text-ink">
              <Icon size={18} />
            </span>
            <div className="min-w-0">
              <b className={cn('font-num block truncate font-black', small ? 'text-[15px] leading-snug' : 'text-3xl')}>{v}</b>
              <span className="text-[11.5px] text-mut">{label}</span>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mb-5">
        <CardTitle>دقائق التركيز — آخر 30 يوم</CardTitle>
        <div className="flex h-44 items-end gap-[3px] sm:gap-1.5">
          {days30.map((d, i) => {
            const v = focusVals[i];
            const isToday = d === k;
            return (
              <div key={d} className="group relative flex h-full flex-1 flex-col items-center justify-end" title={`${v} دقيقة`}>
                <div
                  className={cn(
                    'w-full max-w-3 rounded-full transition-all duration-500',
                    isToday ? 'bg-sun' : v > 0 ? 'bg-ink/75' : 'bg-linec',
                  )}
                  style={{ height: `${Math.max((v / maxFocus) * 100, 4)}%` }}
                />
                {i % 5 === 0 && (
                  <span className="mt-1.5 text-[9px] text-mut">
                    {DAY_LETTER[new Date(d + 'T12:00').getDay()]}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <CardTitle>التزامك بالعادات — آخر 30 يوم</CardTitle>
        {s.habits.length === 0 ? (
          <Empty>لا عادات بعد — أضفها من صفحة العادات</Empty>
        ) : (
          <div className="space-y-4">
            {s.habits.map(h => {
              const doneCount = days30.filter(d => h.log[d]).length;
              const pct = Math.round((doneCount / 30) * 100);
              return (
                <div key={h.id}>
                  <div className="mb-1.5 flex justify-between text-[13px] font-bold">
                    <span>{h.name}</span>
                    <span className="font-num text-mut">{doneCount}/30 يوم — {pct}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-linec">
                    <div className="h-full rounded-full bg-sun transition-all duration-700" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </section>
  );
}
