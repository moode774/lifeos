import React, { useRef, useState } from 'react';
import { Bell, Download, Upload, Cloud, CloudOff, RefreshCw, LogOut, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLifeOS } from '../store';
import { Card, CardTitle, GhostBtn, PageHead, PrimaryBtn, Toggle, inputCls } from './ui';

function AccountCard() {
  const { user, syncStatus, authBusy, signUp, signIn, signOut, syncNow } = useLifeOS();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async () => {
    setMsg(null);
    if (!email.trim() || password.length < 6) { setMsg('اكتب بريدك وكلمة مرور 6 خانات على الأقل'); return; }
    const err = mode === 'signup' ? await signUp(email.trim(), password) : await signIn(email.trim(), password);
    if (err === 'CONFIRM_EMAIL') setMsg('تم إنشاء الحساب — افتح بريدك واضغط رابط التأكيد، ثم ارجع وسجّل دخول');
    else if (err) setMsg(err.includes('Invalid') ? 'البريد أو كلمة المرور غير صحيحة' : err);
    else { setEmail(''); setPassword(''); }
  };

  const statusLabel =
    syncStatus === 'synced' ? 'متزامن' :
    syncStatus === 'syncing' ? 'جاري المزامنة...' :
    syncStatus === 'error' ? 'خطأ بالمزامنة — جرب مرة ثانية' : '—';

  if (user) {
    return (
      <Card className="md:col-span-2">
        <CardTitle>المزامنة السحابية</CardTitle>
        <div className="flex flex-wrap items-center gap-4">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sun/25 text-ink"><Cloud size={20} /></span>
          <div className="flex-1">
            <div className="text-[15px] font-extrabold">{user.email}</div>
            <div className="flex items-center gap-1.5 text-[12.5px] text-mut">
              {syncStatus === 'synced' && <CheckCircle2 size={13} className="text-[#6f9a55]" />}
              {statusLabel} — بياناتك تنحفظ تلقائياً وتوصل كل أجهزتك
            </div>
          </div>
          <GhostBtn onClick={() => void syncNow()}>
            <span className="flex items-center gap-2"><RefreshCw size={14} /> زامن الآن</span>
          </GhostBtn>
          <GhostBtn onClick={() => void signOut()}>
            <span className="flex items-center gap-2"><LogOut size={14} /> خروج</span>
          </GhostBtn>
        </div>
      </Card>
    );
  }

  return (
    <Card className="md:col-span-2">
      <CardTitle>المزامنة السحابية</CardTitle>
      <p className="mb-4 text-[13.5px] leading-7 text-mut">
        <CloudOff size={13} className="mb-0.5 inline" /> غير متصل — بياناتك على هذا الجهاز فقط.
        أنشئ حساب (مجاني) وبتتزامن بياناتك تلقائياً بين اللابتوب والجوال وأي جهاز تسجّل فيه.
      </p>
      <div className="flex flex-wrap gap-2.5">
        <input
          type="email" dir="ltr" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="you@email.com" className={cn(inputCls, 'min-w-52 flex-1 text-left')}
        />
        <input
          type="password" dir="ltr" value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && void submit()}
          placeholder="كلمة المرور" className={cn(inputCls, 'min-w-40 flex-1 text-left')}
        />
        <PrimaryBtn onClick={() => void submit()} className={authBusy ? 'opacity-60' : ''}>
          {authBusy ? '...' : mode === 'signup' ? 'إنشاء حساب' : 'تسجيل دخول'}
        </PrimaryBtn>
      </div>
      <button
        onClick={() => setMode(m => (m === 'signup' ? 'signin' : 'signup'))}
        className="mt-3 text-[13px] font-bold text-mut underline-offset-4 hover:text-ink hover:underline"
      >
        {mode === 'signup' ? 'عندك حساب؟ سجّل دخول' : 'ما عندك حساب؟ أنشئ واحد'}
      </button>
      {msg && <div className="mt-3 rounded-2xl bg-sun/20 px-4 py-3 text-[13px] font-bold">{msg}</div>}
    </Card>
  );
}

export default function Settings() {
  const { s, setName, setSetting, notifStatus, requestNotifs, exportData, importData } = useLifeOS();
  const fileRef = useRef<HTMLInputElement>(null);

  const notifLabel =
    notifStatus === 'granted' ? 'مفعّلة' :
    notifStatus === 'denied' ? 'مرفوضة من إعدادات المتصفح' :
    notifStatus === 'unsupported' ? 'غير مدعومة في هذا المتصفح' : 'لم تُفعّل بعد';

  return (
    <section>
      <PageHead title="التخصيص" sub="خلّه على ذوقك تماماً" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <AccountCard />

        <Card>
          <CardTitle>هويتك</CardTitle>
          <label className="block text-sm text-mut">
            اسمك
            <input
              value={s.name}
              onChange={e => setName(e.target.value)}
              placeholder="اكتب اسمك"
              className={`${inputCls} mt-2 w-full`}
            />
          </label>
        </Card>

        <Card>
          <CardTitle>المظهر والصوت</CardTitle>
          <div className="space-y-5">
            <Toggle
              on={s.settings.dark}
              onChange={v => setSetting('dark', v)}
              label="الوضع الداكن"
              desc="مريح للعين بالليل"
            />
            <Toggle
              on={s.settings.sound}
              onChange={v => setSetting('sound', v)}
              label="الأصوات"
              desc="نغمة عند إنجاز مهمة وانتهاء جلسة التركيز"
            />
          </div>
        </Card>

        <Card>
          <CardTitle>الإشعارات</CardTitle>
          <p className="mb-4 text-[13.5px] leading-7 text-mut">
            فعّل إشعارات المتصفح حتى يوصلك تنبيه المهام وتحوّلات الجدول حتى لو التطبيق بالخلفية.
          </p>
          <div className="flex items-center gap-3">
            <PrimaryBtn onClick={() => void requestNotifs()}>
              <span className="flex items-center gap-2"><Bell size={15} /> تفعيل الإشعارات</span>
            </PrimaryBtn>
            <span className="text-[13px] font-bold text-mut">الحالة: {notifLabel}</span>
          </div>
        </Card>

        <Card>
          <CardTitle>نسخة احتياطية</CardTitle>
          <p className="mb-4 text-[13.5px] leading-7 text-mut">
            صدّر بياناتك كملف واحتفظ به، أو استرجعها بأي وقت.
          </p>
          <div className="flex flex-wrap gap-3">
            <PrimaryBtn onClick={exportData}>
              <span className="flex items-center gap-2"><Download size={15} /> تصدير</span>
            </PrimaryBtn>
            <GhostBtn onClick={() => fileRef.current?.click()}>
              <span className="flex items-center gap-2"><Upload size={15} /> استيراد</span>
            </GhostBtn>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              hidden
              onChange={async e => {
                const f = e.target.files?.[0];
                if (f) await importData(f);
                e.target.value = '';
              }}
            />
          </div>
        </Card>
      </div>
    </section>
  );
}
