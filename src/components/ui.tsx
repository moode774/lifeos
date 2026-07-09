import React from 'react';
import { cn } from '../lib/utils';

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn(
      'rise rounded-[28px] border border-linec bg-gradient-to-b from-card to-card-2 p-6 shadow-[0_10px_30px_-18px_rgba(60,50,20,.25)]',
      className,
    )}>
      {children}
    </div>
  );
}

export function CardTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h3 className="text-[15px] font-extrabold text-ink">{children}</h3>
      {action}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="py-8 text-center text-sm text-mut">{children}</div>;
}

export const inputCls =
  'rounded-2xl border border-linec bg-card px-4 py-3 text-[15px] text-ink outline-none transition placeholder:text-mut focus:border-ink/40';

export const selectCls =
  'rounded-2xl border border-linec bg-card px-3 py-3 text-sm text-ink outline-none focus:border-ink/40';

export function PrimaryBtn({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-2xl bg-ink px-6 py-3 text-[15px] font-bold text-cream transition hover:-translate-y-0.5 hover:bg-ink-2 active:translate-y-0',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function GhostBtn({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-2xl border border-linec bg-card px-5 py-3 text-[15px] font-bold text-ink transition hover:border-ink/40',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Chip({ active, children, onClick }: { active?: boolean; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full border px-4 py-2 text-[13px] font-bold transition',
        active
          ? 'border-ink bg-ink text-cream'
          : 'border-linec bg-card text-mut hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}

export function DeleteBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="حذف"
      className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-mut opacity-60 transition hover:bg-red-50 hover:text-red-500 hover:opacity-100"
    >
      <svg width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M1 1l10 10M11 1L1 11" />
      </svg>
    </button>
  );
}

export function EditBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="تعديل"
      className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-mut opacity-60 transition hover:bg-sun/30 hover:text-ink hover:opacity-100"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      </svg>
    </button>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-night/50 backdrop-blur-sm" />
      <div
        onClick={e => e.stopPropagation()}
        className="rise relative w-full max-w-lg rounded-[28px] border border-linec bg-card p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-black">{title}</h3>
          <DeleteBtn onClick={onClose} />
        </div>
        {children}
      </div>
    </div>
  );
}

export function Toggle({ on, onChange, label, desc }: { on: boolean; onChange: (v: boolean) => void; label: string; desc?: string }) {
  return (
    <button onClick={() => onChange(!on)} className="flex w-full items-center gap-4 text-start">
      <span className={cn(
        'relative h-7 w-12 shrink-0 rounded-full border transition',
        on ? 'border-sun bg-sun' : 'border-linec bg-card-2',
      )}>
        <span className={cn(
          'absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-night shadow transition-all',
          on ? 'start-6' : 'start-1',
        )} />
      </span>
      <span>
        <span className="block text-[14.5px] font-extrabold">{label}</span>
        {desc && <span className="block text-[12px] text-mut">{desc}</span>}
      </span>
    </button>
  );
}

export const DAY_SHORT = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];

export function DayPicker({ days, onChange }: { days: number[]; onChange: (d: number[]) => void }) {
  const toggle = (d: number) =>
    onChange(days.includes(d) ? days.filter(x => x !== d) : [...days, d].sort());
  return (
    <div className="flex flex-wrap gap-1.5">
      {DAY_SHORT.map((label, d) => (
        <button
          key={d}
          onClick={() => toggle(d)}
          className={cn(
            'rounded-xl border px-2.5 py-1.5 text-[11.5px] font-black transition',
            days.includes(d) ? 'border-ink bg-ink text-cream' : 'border-linec bg-card text-mut hover:text-ink',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function PageHead({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[clamp(26px,4vw,38px)] font-black leading-tight text-ink">{title}</h1>
        {sub && <p className="mt-1 text-sm text-mut">{sub}</p>}
      </div>
      {children}
    </header>
  );
}
