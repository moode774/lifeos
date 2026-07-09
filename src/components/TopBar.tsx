import React from 'react';
import { Zap, Bell, Settings, User, Moon, Sun, Cloud, BarChart3 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLifeOS } from '../store';
import type { View } from '../types';

const NAV: { view: View; label: string }[] = [
  { view: 'dashboard', label: 'الرئيسية' },
  { view: 'tasks', label: 'المهام' },
  { view: 'schedule', label: 'الجدول' },
  { view: 'focus', label: 'التركيز' },
  { view: 'habits', label: 'العادات' },
  { view: 'notes', label: 'لا تنسَ' },
];

export default function TopBar() {
  const { view, setView, s, setSetting, requestNotifs, user, syncStatus } = useLifeOS();

  return (
    <div className="sticky top-4 z-40 mb-8">
      <div className="flex items-center justify-between gap-3 rounded-full border border-linec bg-card/80 py-2.5 pe-3 ps-4 shadow-[0_14px_40px_-22px_rgba(60,50,20,.35)] backdrop-blur-xl">
        {/* logo */}
        <button
          onClick={() => setView('dashboard')}
          className="flex items-center gap-2 rounded-full border border-linec px-4 py-2"
        >
          <Zap size={17} className="fill-sun stroke-ink" />
          <span className="text-[17px] font-black tracking-tight">LifeOS</span>
          {user && (
            <Cloud
              size={13}
              className={cn(
                syncStatus === 'error' ? 'text-red-400' : syncStatus === 'syncing' ? 'animate-pulse text-mut' : 'text-[#6f9a55]',
              )}
            />
          )}
        </button>

        {/* nav pills */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map(n => (
            <button
              key={n.view}
              onClick={() => setView(n.view)}
              className={cn(
                'rounded-full px-4 py-2 text-[13.5px] font-bold transition',
                view === n.view ? 'bg-ink text-cream shadow-md' : 'text-mut hover:text-ink',
              )}
            >
              {n.label}
            </button>
          ))}
          <button
            onClick={() => setView('stats')}
            aria-label="الإحصائيات"
            className={cn(
              'grid h-9 w-9 place-items-center rounded-full transition',
              view === 'stats' ? 'bg-ink text-cream' : 'text-mut hover:text-ink',
            )}
          >
            <BarChart3 size={16} />
          </button>
        </nav>

        {/* left cluster */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSetting('dark', !s.settings.dark)}
            aria-label="الوضع الداكن"
            className="grid h-10 w-10 place-items-center rounded-full border border-linec bg-card text-ink transition hover:bg-sun hover:text-night"
          >
            {s.settings.dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={() => void requestNotifs()}
            aria-label="تفعيل الإشعارات"
            className="hidden h-10 w-10 place-items-center rounded-full border border-linec bg-card text-ink transition hover:bg-sun hover:text-night sm:grid"
          >
            <Bell size={16} />
          </button>
          <button
            onClick={() => setView('settings')}
            aria-label="التخصيص"
            className={cn(
              'grid h-10 w-10 place-items-center rounded-full border transition',
              view === 'settings' ? 'border-ink bg-ink text-cream' : 'border-linec bg-card text-ink hover:bg-sun hover:text-night',
            )}
          >
            <Settings size={16} />
          </button>
          <div className="grid h-10 w-10 place-items-center rounded-full bg-night text-paper">
            {s.name ? <span className="text-sm font-black">{s.name.slice(0, 2)}</span> : <User size={16} />}
          </div>
        </div>
      </div>

      {/* mobile nav */}
      <nav className="mt-2 flex gap-1 overflow-x-auto rounded-full border border-linec bg-card/80 p-1.5 backdrop-blur-xl md:hidden custom-scrollbar">
        {[...NAV, { view: 'stats' as View, label: 'إحصائيات' }].map(n => (
          <button
            key={n.view}
            onClick={() => setView(n.view)}
            className={cn(
              'whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-bold transition',
              view === n.view ? 'bg-ink text-cream' : 'text-mut',
            )}
          >
            {n.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
