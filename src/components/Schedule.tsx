import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { useLifeOS, isNowInBlock } from '../store';
import { fmt12, durationLabel, toMin } from '../lib/time';
import { BLOCK_META } from '../lib/meta';
import {
  Card, DeleteBtn, EditBtn, Empty, Modal, PageHead, PrimaryBtn,
  DayPicker, DAY_SHORT, inputCls, selectCls,
} from './ui';
import type { Block, BlockType } from '../types';

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

function daysLabel(days: number[]) {
  if (!days || days.length === 7) return 'كل يوم';
  if (days.length === 0) return 'بدون أيام';
  return days.map(d => DAY_SHORT[d]).join('، ');
}

function BlockForm({ init, onSave, cta }: { init?: Block; onSave: (b: Omit<Block, 'id'>) => void; cta: string }) {
  const [name, setName] = useState(init?.name ?? '');
  const [type, setType] = useState<BlockType>(init?.type ?? 'work');
  const [start, setStart] = useState(init?.start ?? '08:00');
  const [end, setEnd] = useState(init?.end ?? '16:00');
  const [days, setDays] = useState<number[]>(init?.days ?? ALL_DAYS);

  const submit = () => {
    if (!start || !end || days.length === 0) return;
    onSave({ name: name.trim(), type, start, end, days });
    if (!init) setName('');
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2.5">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="اسم الفترة (مثال: الدوام)"
          className={cn(inputCls, 'min-w-48 flex-1')}
        />
        <select value={type} onChange={e => setType(e.target.value as BlockType)} className={selectCls}>
          {(Object.keys(BLOCK_META) as BlockType[]).map(t => <option key={t} value={t}>{BLOCK_META[t].label}</option>)}
        </select>
        <input type="time" value={start} onChange={e => setStart(e.target.value)} className={selectCls} />
        <input type="time" value={end} onChange={e => setEnd(e.target.value)} className={selectCls} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="text-[12.5px] font-bold text-mut">الأيام:</span>
        <DayPicker days={days} onChange={setDays} />
        <div className="ms-auto"><PrimaryBtn onClick={submit}>{cta}</PrimaryBtn></div>
      </div>
    </div>
  );
}

export default function Schedule() {
  const { s, addBlock, updateBlock, delBlock, clock } = useLifeOS();
  void clock;
  const [editing, setEditing] = useState<Block | null>(null);

  const blocks = [...s.blocks].sort((a, b) => toMin(a.start) - toMin(b.start));

  return (
    <section>
      <PageHead title="جدول يومك" sub="قسّم يومك بفترات — لكل فترة أيامها (الدوام أيام العمل، اللعب للويكند) — والنظام ينبهك عند كل تحوّل" />

      <Card className="mb-6 p-4">
        <BlockForm cta="إضافة فترة" onSave={b => addBlock(b.name, b.type, b.start, b.end, b.days)} />
      </Card>

      <div className="space-y-2.5">
        {blocks.length === 0 && (
          <Card><Empty>جدولك فاضي — أضف فترات يومك وبينبهك النظام عند بداية كل فترة</Empty></Card>
        )}
        {blocks.map(b => {
          const meta = BLOCK_META[b.type];
          const live = isNowInBlock(b);
          const Icon = meta.Icon;
          return (
            <div
              key={b.id}
              className={cn(
                'rise relative flex items-center gap-4 overflow-hidden rounded-3xl border bg-card py-4 pe-5 ps-6 transition',
                live ? 'border-ink shadow-[0_14px_40px_-24px_rgba(30,30,20,.5)]' : 'border-linec',
              )}
            >
              <span className="absolute inset-y-0 start-0 w-1.5" style={{ background: meta.color }} />
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl" style={{ background: meta.soft, color: meta.color }}>
                <Icon size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[16px] font-extrabold">{b.name}</div>
                <div className="font-num text-[12.5px] text-mut">{fmt12(b.start)} — {fmt12(b.end)}</div>
                <div className="text-[11.5px] text-mut">{daysLabel(b.days)}</div>
              </div>
              {live && <span className="rounded-full bg-night px-3 py-1 text-[11px] font-black text-sun">الآن</span>}
              <span className="hidden text-[12.5px] text-mut sm:block">{durationLabel(b.start, b.end)}</span>
              <EditBtn onClick={() => setEditing(b)} />
              <DeleteBtn onClick={() => delBlock(b.id)} />
            </div>
          );
        })}
      </div>

      {editing && (
        <Modal title="تعديل الفترة" onClose={() => setEditing(null)}>
          <BlockForm
            init={editing}
            cta="حفظ التعديل"
            onSave={b => { updateBlock(editing.id, b); setEditing(null); }}
          />
        </Modal>
      )}
    </section>
  );
}
