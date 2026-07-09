import React, { useState } from 'react';
import { Check, Clock, Repeat as RepeatIcon, Search } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLifeOS, isDueToday, isDoneToday } from '../store';
import { fmt12 } from '../lib/time';
import { CAT_META, PRIO_META, PRIO_ORDER } from '../lib/meta';
import {
  Card, Chip, DeleteBtn, EditBtn, Empty, Modal, PageHead, PrimaryBtn,
  DayPicker, DAY_SHORT, inputCls, selectCls,
} from './ui';
import type { Task, TaskCat, Prio, Repeat } from '../types';

type Filter = 'all' | TaskCat | 'done';
type RepeatKind = 'once' | 'daily' | 'days';

const FILTERS: { f: Filter; label: string }[] = [
  { f: 'all', label: 'الكل' },
  { f: 'work', label: 'شغل' },
  { f: 'life', label: 'حياة' },
  { f: 'relax', label: 'استرخاء' },
  { f: 'play', label: 'لعب' },
  { f: 'done', label: 'المنجزة' },
];

export function repeatLabel(r: Repeat): string | null {
  if (r === 'once') return null;
  if (r === 'daily') return 'يومياً';
  return r.map(d => DAY_SHORT[d]).join('، ');
}

/* shared form used by add-bar and edit modal */
function useTaskForm(init?: Task) {
  const [name, setName] = useState(init?.name ?? '');
  const [cat, setCat] = useState<TaskCat>(init?.cat ?? 'work');
  const [prio, setPrio] = useState<Prio>(init?.prio ?? 'med');
  const [time, setTime] = useState(init?.time ?? '');
  const [kind, setKind] = useState<RepeatKind>(
    init ? (init.repeat === 'once' ? 'once' : init.repeat === 'daily' ? 'daily' : 'days') : 'once',
  );
  const [days, setDays] = useState<number[]>(Array.isArray(init?.repeat) ? init.repeat : [0, 1, 2, 3, 4]);
  const repeat: Repeat = kind === 'once' ? 'once' : kind === 'daily' ? 'daily' : days;
  return { name, setName, cat, setCat, prio, setPrio, time, setTime, kind, setKind, days, setDays, repeat };
}

function TaskFields({ f }: { f: ReturnType<typeof useTaskForm> }) {
  return (
    <>
      <div className="flex flex-wrap gap-2.5">
        <select value={f.cat} onChange={e => f.setCat(e.target.value as TaskCat)} className={selectCls}>
          {(Object.keys(CAT_META) as TaskCat[]).map(c => <option key={c} value={c}>{CAT_META[c].label}</option>)}
        </select>
        <select value={f.prio} onChange={e => f.setPrio(e.target.value as Prio)} className={selectCls}>
          {(Object.keys(PRIO_META) as Prio[]).map(p => <option key={p} value={p}>{PRIO_META[p].label}</option>)}
        </select>
        <input type="time" value={f.time} onChange={e => f.setTime(e.target.value)} title="وقت التذكير (اختياري)" className={selectCls} />
        <select value={f.kind} onChange={e => f.setKind(e.target.value as RepeatKind)} className={selectCls}>
          <option value="once">مرة واحدة</option>
          <option value="daily">تتكرر يومياً</option>
          <option value="days">أيام محددة</option>
        </select>
      </div>
      {f.kind === 'days' && <div className="mt-2.5"><DayPicker days={f.days} onChange={f.setDays} /></div>}
    </>
  );
}

function EditTaskModal({ task, onClose }: { task: Task; onClose: () => void }) {
  const { updateTask } = useLifeOS();
  const f = useTaskForm(task);
  const save = () => {
    if (!f.name.trim()) return;
    updateTask(task.id, { name: f.name.trim(), cat: f.cat, prio: f.prio, time: f.time || null, repeat: f.repeat });
    onClose();
  };
  return (
    <Modal title="تعديل المهمة" onClose={onClose}>
      <input
        value={f.name}
        onChange={e => f.setName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && save()}
        className={cn(inputCls, 'mb-3 w-full')}
      />
      <TaskFields f={f} />
      <div className="mt-5 flex justify-end"><PrimaryBtn onClick={save}>حفظ التعديل</PrimaryBtn></div>
    </Modal>
  );
}

export default function Tasks() {
  const { s, addTask, toggleTask, delTask } = useLifeOS();
  const f = useTaskForm();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Task | null>(null);

  const submit = () => {
    if (!f.name.trim()) return;
    addTask(f.name.trim(), f.cat, f.prio, f.time || null, f.repeat);
    f.setName(''); f.setTime('');
  };

  let items = [...s.tasks];
  if (query.trim()) items = items.filter(t => t.name.includes(query.trim()));
  if (filter === 'done') items = items.filter(t => isDoneToday(t) || (t.repeat === 'once' && t.done));
  else if (filter !== 'all') items = items.filter(t => t.cat === filter && !isDoneToday(t));
  else items = items.filter(t => !(t.repeat === 'once' && t.done && t.date !== new Date().toISOString().slice(0, 10)) || isDueToday(t));
  items.sort((a, b) => Number(isDoneToday(a)) - Number(isDoneToday(b)) || PRIO_ORDER[a.prio] - PRIO_ORDER[b.prio]);

  return (
    <section>
      <PageHead title="المهام" sub="نظّم شغلك وحياتك — مهام تتكرر لحالها، وتذكير بالوقت حتى لا تنسى">
        <label className="relative">
          <Search size={15} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-mut" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="بحث..."
            className={cn(inputCls, 'w-44 py-2.5 ps-10 sm:w-56')}
          />
        </label>
      </PageHead>

      <Card className="mb-5 p-4">
        <div className="mb-2.5 flex flex-wrap gap-2.5">
          <input
            value={f.name}
            onChange={e => f.setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="اكتب مهمة جديدة..."
            className={cn(inputCls, 'min-w-52 flex-1')}
          />
          <PrimaryBtn onClick={submit}>إضافة</PrimaryBtn>
        </div>
        <TaskFields f={f} />
      </Card>

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map(x => (
          <Chip key={x.f} active={filter === x.f} onClick={() => setFilter(x.f)}>{x.label}</Chip>
        ))}
      </div>

      <div className="space-y-2.5">
        {items.length === 0 && <Card><Empty>لا توجد مهام هنا — أضف أول مهمة فوق</Empty></Card>}
        {items.map(t => {
          const catMeta = CAT_META[t.cat];
          const Icon = catMeta.Icon;
          const done = isDoneToday(t);
          const rep = repeatLabel(t.repeat);
          return (
            <div
              key={t.id}
              className={cn(
                'rise flex items-center gap-4 rounded-3xl border border-linec bg-card px-5 py-4 transition hover:border-ink/25',
                done && 'opacity-50',
              )}
            >
              <button
                onClick={() => toggleTask(t.id)}
                aria-label="إنجاز"
                className={cn(
                  'grid h-7 w-7 shrink-0 place-items-center rounded-lg border-2 transition',
                  done ? 'border-sun bg-sun text-night' : 'border-mut/50 text-transparent hover:border-ink',
                )}
              >
                <Check size={14} strokeWidth={3} />
              </button>
              <div className="min-w-0 flex-1">
                <span className={cn('block truncate text-[15px] font-bold', done && 'line-through')}>{t.name}</span>
                {rep && (
                  <span className="mt-0.5 flex items-center gap-1 text-[11.5px] text-mut">
                    <RepeatIcon size={10} /> {rep}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2.5">
                {t.time && (
                  <span className="hidden items-center gap-1 font-num text-[12px] font-bold text-ink sm:flex">
                    <Clock size={12} /> {fmt12(t.time)}
                  </span>
                )}
                <span
                  className="hidden items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] font-black sm:flex"
                  style={{ background: catMeta.soft, color: catMeta.color }}
                >
                  <Icon size={11} /> {catMeta.label}
                </span>
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: PRIO_META[t.prio].dot }} title={PRIO_META[t.prio].label} />
                <EditBtn onClick={() => setEditing(t)} />
                <DeleteBtn onClick={() => delTask(t.id)} />
              </div>
            </div>
          );
        })}
      </div>

      {editing && <EditTaskModal task={editing} onClose={() => setEditing(null)} />}
    </section>
  );
}
