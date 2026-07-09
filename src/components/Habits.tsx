import React, { useState } from 'react';
import { Check, Flame, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLifeOS, habitStreak } from '../store';
import { todayKey, last7Days } from '../lib/time';
import { Card, DeleteBtn, EditBtn, Empty, Modal, PageHead, PrimaryBtn, inputCls } from './ui';
import type { Habit } from '../types';

export default function Habits() {
  const { s, addHabit, renameHabit, toggleHabit, delHabit } = useLifeOS();
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<Habit | null>(null);
  const [editName, setEditName] = useState('');
  const days = last7Days();
  const k = todayKey();

  const submit = () => {
    if (!name.trim()) return;
    addHabit(name.trim());
    setName('');
  };

  const saveEdit = () => {
    if (editing && editName.trim()) renameHabit(editing.id, editName.trim());
    setEditing(null);
  };

  return (
    <section>
      <PageHead title="العادات" sub="حسّن حياتك عادة بعادة — السلسلة لا تنكسر" />

      <Card className="mb-6 p-4">
        <div className="flex flex-wrap gap-2.5">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="عادة جديدة (مثال: قراءة 10 دقائق)"
            className={cn(inputCls, 'min-w-52 flex-1')}
          />
          <PrimaryBtn onClick={submit}>إضافة</PrimaryBtn>
        </div>
      </Card>

      <div className="space-y-3">
        {s.habits.length === 0 && (
          <Card><Empty>أضف عاداتك اليومية — قراءة، رياضة، ماء، نوم مبكر...</Empty></Card>
        )}
        {s.habits.map(h => {
          const on = !!h.log[k];
          return (
            <div key={h.id} className="rise flex items-center gap-4 rounded-3xl border border-linec bg-card px-5 py-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sun/25 text-ink">
                <Sparkles size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15.5px] font-extrabold">{h.name}</div>
                <div className="mt-0.5 flex items-center gap-1 text-[12px] text-mut">
                  <Flame size={11} className="text-[#d9822b]" />
                  <span className="font-num font-bold">{habitStreak(h)}</span> يوم متتالي
                </div>
              </div>
              <div className="hidden gap-1.5 sm:flex">
                {days.map(d => (
                  <span key={d} className={cn('h-2.5 w-2.5 rounded-md', h.log[d] ? 'bg-sun' : 'bg-linec')} />
                ))}
              </div>
              <button
                onClick={() => toggleHabit(h.id)}
                aria-label="سجّل اليوم"
                className={cn(
                  'grid h-11 w-11 shrink-0 place-items-center rounded-2xl border-2 transition',
                  on ? 'scale-105 border-sun bg-sun text-night' : 'border-linec bg-card-2 text-transparent hover:border-ink/40',
                )}
              >
                <Check size={18} strokeWidth={3} />
              </button>
              <EditBtn onClick={() => { setEditing(h); setEditName(h.name); }} />
              <DeleteBtn onClick={() => delHabit(h.id)} />
            </div>
          );
        })}
      </div>

      {editing && (
        <Modal title="تعديل العادة" onClose={() => setEditing(null)}>
          <input
            value={editName}
            onChange={e => setEditName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && saveEdit()}
            className={cn(inputCls, 'w-full')}
          />
          <div className="mt-5 flex justify-end"><PrimaryBtn onClick={saveEdit}>حفظ التعديل</PrimaryBtn></div>
        </Modal>
      )}
    </section>
  );
}
