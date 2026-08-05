import { Check } from 'lucide-react';
import type { SeoChecks } from '../product-editor.types';
import { editorSurfaceClass } from './EditorSection';

export function SeoScore({ score, checks }: { score: number; checks: SeoChecks }) {
  const circumference = 2 * Math.PI * 31;
  return <div className={editorSurfaceClass}>
    <div className="border-b border-[hsl(var(--border))] px-4 py-3 text-sm font-bold">امتیاز سئو</div>
    <div className="p-4">
      <div className="mb-4 flex items-center gap-3">
        <div className="relative h-[76px] w-[76px]">
          <svg width="76" height="76" className="-rotate-90"><circle cx="38" cy="38" r="31" fill="none" stroke="hsl(var(--surface-3))" strokeWidth="7" /><circle cx="38" cy="38" r="31" fill="none" stroke="hsl(var(--primary))" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${circumference * score / 100} ${circumference}`} /></svg>
          <strong className="absolute inset-0 grid place-items-center text-xl">{score}</strong>
        </div>
        <div><h3 className="text-sm font-bold">{score >= 85 ? 'عالی' : score >= 70 ? 'آماده انتشار' : 'نیاز به تکمیل'}</h3><p className="text-[11px] text-[hsl(var(--muted-foreground))]">انتشار از امتیاز ۷۰ باز می‌شود.</p></div>
      </div>
      <div className="grid gap-1.5">{Object.entries(checks).map(([key, done]) => <div key={key} className={`flex items-center gap-2 text-xs ${done ? 'text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))]'}`}><span className={`grid h-4 w-4 place-items-center rounded-full border text-[9px] ${done ? 'border-[hsl(var(--stock-in))] bg-[hsl(var(--stock-in))] text-[hsl(var(--surface-0))]' : 'border-[hsl(var(--border))] text-transparent'}`}><Check size={10} /></span>{key}</div>)}</div>
    </div>
  </div>;
}
