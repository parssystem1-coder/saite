import type { TabKey } from '../product-editor.types';
import { PRODUCT_TABS } from '../product-editor.constants';

export function ProductTabs({ activeTab, onChange, badges }: { activeTab: TabKey; onChange: (tab: TabKey) => void; badges?: Partial<Record<TabKey, number>> }) {
  return (
    <nav role="tablist" className="sticky top-[65px] z-20 mb-6 flex overflow-x-auto border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/.96)]">
      <div className="flex min-w-max gap-1">
        {PRODUCT_TABS.map(tab => {
          const badge = badges?.[tab.id] ?? 0;
          return <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} onClick={() => onChange(tab.id)} className={`border-b-2 px-3 py-3 text-xs transition ${activeTab === tab.id ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary-bright))]' : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}>
            {tab.label}{badge > 0 && <span className="mr-1 rounded-full bg-[hsl(var(--destructive)/.16)] px-1.5 py-0.5 text-[10px] text-[hsl(0_80%_72%)]">{badge}</span>}
          </button>;
        })}
      </div>
    </nav>
  );
}
