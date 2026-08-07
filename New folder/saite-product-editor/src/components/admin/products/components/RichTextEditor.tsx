\'use client\';

import { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import { Bold, Italic, Link2, List, ListOrdered, Redo2, Table2, Underline as UnderlineIcon, Undo2, X } from 'lucide-react';

const EMOJIS = ['⚡','🔄','🌐','🖨️','📄','🛡️','📱','✅','❌','⭐','🔥','💡','🎯','🚚','📦','💰','🔧','🏷️','📌','❤️','👍','👎','🙂','😉','😎','🤝','❓','⚠️','🎉','🚀','🛒','🔒','📊','📝','🔗','📅','🏢','💼','🧾','🛠️'];

type Props = { value: string; onChange: (html: string) => void; uploadImage?: (file: File) => Promise<string>; customEmojis?: string[]; onAddEmoji?: (emoji: string) => Promise<void> | void };
const btn = 'rounded-md border border-transparent px-2 py-1.5 text-xs text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--surface-3))] hover:text-[hsl(var(--foreground))]';

export function RichTextEditor({ value, onChange, uploadImage, customEmojis = [], onAddEmoji }: Props) {
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [tableOpen, setTableOpen] = useState(false);
  const [emojiText, setEmojiText] = useState('');
  const [tableMenu, setTableMenu] = useState<{ x: number; y: number } | null>(null);
  const editor = useEditor({
    immediatelyRender: false,
    content: value,
    extensions: [
      StarterKit.configure({ heading: { levels: [1,2,3,4,5,6] } }), Underline,
      Link.configure({ openOnClick: false, linkOnPaste: true }), Image,
      Placeholder.configure({ placeholder: 'متن کامل معرفی محصول را بنویسید...' }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }), Table.configure({ resizable: true }), TableRow, TableHeader, TableCell,
    ],
    editorProps: { attributes: { class: 'prose-editor min-h-[520px] max-w-none p-5 text-sm leading-8 outline-none', dir: 'rtl' } },
    onUpdate: ({ editor: instance }) => onChange(instance.getHTML()),
  });
  if (!editor) return <div className="min-h-[560px] animate-pulse rounded-lg bg-[hsl(var(--surface-1))]" />;
  const addLink = () => { const url = window.prompt('آدرس لینک را وارد کنید', editor.getAttributes('link').href ?? 'https://'); if (url === null) return; url.trim() ? editor.chain().focus().setLink({ href: url.trim() }).run() : editor.chain().focus().unsetLink().run(); };
  const addImage = async () => { const input = document.createElement('input'); input.type='file'; input.accept='image/*'; input.click(); input.onchange=async()=>{ const file=input.files?.[0]; if(!file) return; const url=uploadImage ? await uploadImage(file) : window.prompt('آدرس امن تصویر'); if(url) editor.chain().focus().setImage({src:url,alt:'تصویر محصول'}).run(); }; };
  const insertEmoji = (emoji: string) => { editor.chain().focus().insertContent(emoji).run(); setEmojiOpen(false); };
  const insertTable = (rows: number, cols: number, withHeader: boolean) => { editor.chain().focus().insertTable({ rows, cols, withHeaderRow: withHeader }).run(); setTableOpen(false); };
  const allEmojis = [...EMOJIS, ...customEmojis];
  const filteredEmojis = allEmojis.filter(e => !emojiText || e.includes(emojiText));
  const tableCommand = (command: 'addRowBefore' | 'addRowAfter' | 'deleteRow' | 'addColumnBefore' | 'addColumnAfter' | 'deleteColumn' | 'toggleHeaderRow' | 'mergeCells' | 'splitCell' | 'deleteTable') => {
    const chain = editor.chain().focus();
    if (command === 'addRowBefore') chain.addRowBefore().run();
    if (command === 'addRowAfter') chain.addRowAfter().run();
    if (command === 'deleteRow') chain.deleteRow().run();
    if (command === 'addColumnBefore') chain.addColumnBefore().run();
    if (command === 'addColumnAfter') chain.addColumnAfter().run();
    if (command === 'deleteColumn') chain.deleteColumn().run();
    if (command === 'toggleHeaderRow') chain.toggleHeaderRow().run();
    if (command === 'mergeCells') chain.mergeCells().run();
    if (command === 'splitCell') chain.splitCell().run();
    if (command === 'deleteTable') chain.deleteTable().run();
    setTableMenu(null);
  };
  const tableMenuItems = [
    ['addRowBefore', 'افزودن سطر قبل'], ['addRowAfter', 'افزودن سطر بعد'], ['deleteRow', 'حذف سطر'],
    ['addColumnBefore', 'افزودن ستون قبل'], ['addColumnAfter', 'افزودن ستون بعد'], ['deleteColumn', 'حذف ستون'],
    ['toggleHeaderRow', 'تبدیل ردیف عنوان'], ['mergeCells', 'ادغام سلول‌ها'], ['splitCell', 'جدا کردن سلول'], ['deleteTable', 'حذف جدول'],
  ] as const;
  return <div className="overflow-visible rounded-[var(--radius-lg)] border border-[hsl(var(--border))] bg-[hsl(var(--surface-1))] focus-within:border-[hsl(var(--primary)/.7)]">
    <div className="relative flex flex-wrap items-center gap-1 border-b border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-2">
      <button type="button" className={btn} title="بازگشت" onClick={()=>editor.chain().focus().undo().run()}><Undo2 size={15}/></button><button type="button" className={btn} title="جلو رفتن" onClick={()=>editor.chain().focus().redo().run()}><Redo2 size={15}/></button><span className="mx-1 h-6 w-px bg-[hsl(var(--border))]"/>
      {[1,2,3,4,5,6].map(level=><button key={level} type="button" className={`${btn} ${editor.isActive('heading',{level})?'bg-[hsl(var(--primary)/.16)] text-[hsl(var(--primary-bright))]':''}`} onClick={()=>editor.chain().focus().toggleHeading({level: level as 1|2|3|4|5|6}).run()}>H{level}</button>)}
      <button type="button" className={btn} onClick={()=>editor.chain().focus().toggleBold().run()}><Bold size={15}/></button><button type="button" className={btn} onClick={()=>editor.chain().focus().toggleItalic().run()}><Italic size={15}/></button><button type="button" className={btn} onClick={()=>editor.chain().focus().toggleUnderline().run()}><UnderlineIcon size={15}/></button><button type="button" className={btn} onClick={()=>editor.chain().focus().toggleBulletList().run()}><List size={15}/></button><button type="button" className={btn} onClick={()=>editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={15}/></button><button type="button" className={btn} onClick={addLink}><Link2 size={15}/></button><button type="button" className={btn} onClick={addImage}>تصویر</button>
      <div className="relative"><button type="button" className={`${btn} text-base`} onClick={()=>setEmojiOpen(v=>!v)} title="افزودن ایموجی">😀</button>{emojiOpen&&<div className="absolute right-0 top-10 z-50 w-72 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface-3))] p-3 shadow-xl"><div className="mb-2 flex items-center gap-2"><input value={emojiText} onChange={e=>setEmojiText(e.target.value)} placeholder="جستجو یا انتخاب ایموجی" className="min-h-8 flex-1 rounded border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-2 text-xs"/><button type="button" onClick={()=>setEmojiOpen(false)}><X size={14}/></button></div><div className="grid max-h-44 grid-cols-8 gap-1 overflow-y-auto">{filteredEmojis.map((emoji,i)=><button type="button" key={`${emoji}-${i}`} onClick={()=>insertEmoji(emoji)} className="rounded p-1 text-xl hover:bg-[hsl(var(--surface-2))]">{emoji}</button>)}</div><button type="button" className="mt-2 w-full rounded border border-dashed border-[hsl(var(--border))] py-1 text-[10px] text-[hsl(var(--muted-foreground))]" onClick={()=>{const e=window.prompt('ایموجی جدید را وارد کنید');if(e?.trim())insertEmoji(e.trim())}}>+ افزودن ایموجی جدید</button></div>}</div>
      <button type="button" className={`${btn} text-base`} onClick={async()=>{const e=window.prompt('ایموجی جدید را وارد کنید');if(e?.trim()){await onAddEmoji?.(e.trim());insertEmoji(e.trim());}}} title="ذخیره ایموجی جدید">＋😀</button><div className="relative"><button type="button" className={btn} onClick={()=>setTableOpen(v=>!v)} title="ساخت جدول"><Table2 size={15}/></button>{tableOpen&&<div className="absolute right-0 top-10 z-50 w-64 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface-3))] p-3 shadow-xl"><p className="mb-2 text-xs font-bold">ساخت جدول</p><div className="grid grid-cols-2 gap-2"><label className="text-[10px]">سطر<input id="tableRows" type="number" min="1" max="20" defaultValue="3" className="mt-1 min-h-8 w-full rounded border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-2"/></label><label className="text-[10px]">ستون<input id="tableCols" type="number" min="1" max="10" defaultValue="3" className="mt-1 min-h-8 w-full rounded border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-2"/></label></div><label className="mt-2 flex gap-2 text-[10px]"><input id="tableHeader" type="checkbox" defaultChecked/> ردیف عنوان</label><button type="button" className="mt-3 w-full rounded bg-[hsl(var(--primary))] py-2 text-xs font-bold" onClick={()=>insertTable(Number((document.getElementById('tableRows') as HTMLInputElement)?.value||3),Number((document.getElementById('tableCols') as HTMLInputElement)?.value||3),(document.getElementById('tableHeader') as HTMLInputElement)?.checked??true)}>درج جدول</button></div>}</div>
    </div>
    <div onContextMenu={event => {
      if (!editor.isActive('table')) return;
      event.preventDefault();
      setTableMenu({ x: event.clientX, y: event.clientY });
    }} onClick={() => tableMenu && setTableMenu(null)}>
      <EditorContent editor={editor}/>
    </div>
    {tableMenu && <div role="menu" className="fixed z-[100] w-56 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface-3))] p-1 shadow-2xl" style={{ left: Math.min(tableMenu.x, window.innerWidth - 240), top: Math.min(tableMenu.y, window.innerHeight - 360) }} onClick={event => event.stopPropagation()}>{tableMenuItems.map(([command, label]) => <button key={command} type="button" role="menuitem" className="block w-full rounded px-3 py-2 text-right text-xs text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-2))] hover:text-[hsl(var(--primary-bright))]" onClick={() => tableCommand(command)}>{label}</button>)}</div>}
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[hsl(var(--border))] px-4 py-2 text-[10px] text-[hsl(var(--muted-foreground))]"><span>جدول، ایموجی و HTML برای API آماده‌اند.</span><span>برای ویرایش جدول، داخل یک سلول کلیک کن.</span></div>
  </div>;
}
