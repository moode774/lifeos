import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLifeOS } from '../store';
import { Card, DeleteBtn, EditBtn, Empty, Modal, PageHead, PrimaryBtn, inputCls } from './ui';
import type { Note } from '../types';

export default function Notes() {
  const { s, addNote, updateNote, delNote } = useLifeOS();
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Note | null>(null);
  const [editText, setEditText] = useState('');

  const submit = () => {
    if (!text.trim()) return;
    addNote(text.trim());
    setText('');
  };

  const saveEdit = () => {
    if (editing && editText.trim()) updateNote(editing.id, editText.trim());
    setEditing(null);
  };

  const notes = query.trim() ? s.notes.filter(n => n.text.includes(query.trim())) : s.notes;

  return (
    <section>
      <PageHead title="لا تنسَ" sub="أي شي يخطر ببالك — اكتبه فوراً قبل ما يطير">
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

      <Card className="mb-6 p-4">
        <div className="flex flex-wrap gap-2.5">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="اكتب ملاحظة سريعة..."
            className={cn(inputCls, 'min-w-52 flex-1')}
          />
          <PrimaryBtn onClick={submit}>حفظ</PrimaryBtn>
        </div>
      </Card>

      {notes.length === 0 ? (
        <Card><Empty>{query ? 'لا نتائج للبحث' : 'فاضي — أول ما يخطر ببالك شي، اكتبه هنا فوراً'}</Empty></Card>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map(n => (
            <div key={n.id} className="rise relative rounded-3xl border border-linec border-t-4 border-t-sun bg-card p-5">
              <p className="pe-14 text-[15px] font-medium leading-7">{n.text}</p>
              <div className="mt-3 font-num text-[11px] text-mut">
                {new Date(n.date).toLocaleString('ar', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
              </div>
              <div className="absolute left-2.5 top-2.5 flex">
                <EditBtn onClick={() => { setEditing(n); setEditText(n.text); }} />
                <DeleteBtn onClick={() => delNote(n.id)} />
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <Modal title="تعديل الملاحظة" onClose={() => setEditing(null)}>
          <textarea
            value={editText}
            onChange={e => setEditText(e.target.value)}
            rows={4}
            className={cn(inputCls, 'w-full resize-none')}
          />
          <div className="mt-5 flex justify-end"><PrimaryBtn onClick={saveEdit}>حفظ التعديل</PrimaryBtn></div>
        </Modal>
      )}
    </section>
  );
}
