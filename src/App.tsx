import React from 'react';
import { LifeOSProvider, useLifeOS } from './store';
import TopBar from './components/TopBar';
import Dashboard from './components/Dashboard';
import Tasks from './components/Tasks';
import Schedule from './components/Schedule';
import Focus from './components/Focus';
import Habits from './components/Habits';
import Notes from './components/Notes';
import Stats from './components/Stats';
import Settings from './components/Settings';

function Toast() {
  const { toast } = useLifeOS();
  return (
    <div
      className={`fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-full bg-night px-6 py-3 text-[14px] font-bold text-paper shadow-[0_14px_40px_-14px_rgba(20,20,10,.6)] transition-all duration-300 ${
        toast ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      {toast}
    </div>
  );
}

function Shell() {
  const { view } = useLifeOS();
  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-16 pt-4 sm:px-7">
      <TopBar />
      <main key={view} className="rise">
        {view === 'dashboard' && <Dashboard />}
        {view === 'tasks' && <Tasks />}
        {view === 'schedule' && <Schedule />}
        {view === 'focus' && <Focus />}
        {view === 'habits' && <Habits />}
        {view === 'notes' && <Notes />}
        {view === 'stats' && <Stats />}
        {view === 'settings' && <Settings />}
      </main>
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <LifeOSProvider>
      <Shell />
    </LifeOSProvider>
  );
}
