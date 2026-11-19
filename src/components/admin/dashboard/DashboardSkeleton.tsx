/* Shimmer placeholders that mirror each dashboard tab's real layout (cards, donuts, tables), so the page
   keeps its shape while data loads — the pattern large marketplaces use instead of a spinner. */

const SHIMMER_CSS = `
@keyframes qp-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
.qp-sk { position: relative; overflow: hidden; background: #EEF2F6; }
.qp-sk::after { content: ''; position: absolute; inset: 0; transform: translateX(-100%);
  background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.75) 50%, rgba(255,255,255,0) 100%);
  animation: qp-shimmer 1.4s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .qp-sk::after { animation: none; } }
`;

/** One shimmering block. */
export function Sk({ className = '', round = 'rounded-md' }: { className?: string; round?: string }) {
  return <span aria-hidden className={`qp-sk block ${round} ${className}`} />;
}

const CARD = 'bg-white rounded-xl border border-[#EEF2F6] shadow-[0_1px_2px_rgba(16,24,40,0.03),0_4px_16px_-6px_rgba(16,24,40,0.06)]';

function KpiTile() {
  return (
    <div className={`${CARD} p-4`}>
      <div className="flex items-center justify-between"><Sk className="h-3 w-24" /><Sk className="h-7 w-7" round="rounded-lg" /></div>
      <Sk className="mt-3 h-6 w-28" />
      <Sk className="mt-2.5 h-3 w-20" />
    </div>
  );
}

function MiniTile() {
  return (
    <div className={`${CARD} p-4`}>
      <Sk className="h-8 w-8" round="rounded-lg" />
      <Sk className="mt-3 h-3 w-24" />
      <Sk className="mt-2 h-5 w-14" />
    </div>
  );
}

function DonutCard({ title = 'w-36', h = 'h-[330px]' }: { title?: string; h?: string }) {
  return (
    <div className={`${CARD} p-5 ${h} flex flex-col`}>
      <Sk className={`h-4 ${title}`} />
      <div className="flex-1 flex items-center justify-center">
        <div className="relative w-[180px] h-[180px]">
          <Sk className="absolute inset-0" round="rounded-full" />
          <span className="absolute inset-[22px] rounded-full bg-white" />
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-3">{[0, 1, 2, 3, 4].map(i => <Sk key={i} className="h-3 w-16" />)}</div>
    </div>
  );
}

function SplitCard({ cols = 3, h = '' }: { cols?: number; h?: string }) {
  return (
    <div className={`${CARD} p-5 ${h}`}>
      <Sk className="h-4 w-48" />
      <div className="mt-4 flex justify-between gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className={`flex flex-col gap-2 ${i === 0 ? 'items-start' : i === cols - 1 ? 'items-end' : 'items-center'}`}>
            <Sk className="h-3 w-16" /><Sk className="h-6 w-10" /><Sk className="h-2.5 w-8" />
          </div>
        ))}
      </div>
      <Sk className="mt-4 h-[18px] w-full" round="rounded-full" />
    </div>
  );
}

function BarsCard({ rows = 3, h = '' }: { rows?: number; h?: string }) {
  return (
    <div className={`${CARD} p-5 ${h}`}>
      <Sk className="h-4 w-28" />
      <Sk className="mt-3 h-4 w-32" />
      <div className="mt-5 space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="grid grid-cols-[120px_1fr] items-center gap-4"><Sk className="h-3 w-24" /><Sk className="h-4 w-full" round="rounded-full" /></div>
        ))}
      </div>
    </div>
  );
}

function TableCard({ rows = 6, cols = 7 }: { rows?: number; cols?: number }) {
  return (
    <div className={`${CARD} overflow-hidden`}>
      <div className="px-5 py-4 flex items-center justify-between border-b border-[#EEF2F6]">
        <div className="flex items-center gap-3"><Sk className="h-9 w-9" round="rounded-xl" /><div><Sk className="h-4 w-40" /><Sk className="mt-1.5 h-3 w-16" /></div></div>
        <Sk className="h-9 w-[240px] hidden sm:block" round="rounded-full" />
      </div>
      <div className="px-5 py-3 bg-[#F8FAFC] flex gap-6">{Array.from({ length: cols }).map((_, i) => <Sk key={i} className="h-3 flex-1" />)}</div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="px-5 py-3.5 flex items-center gap-6 border-t border-[#F1F5F9]">
          <div className="flex items-center gap-3 flex-[2]"><Sk className="h-9 w-9" round="rounded-full" /><div className="flex-1"><Sk className="h-3.5 w-3/4" /><Sk className="mt-1.5 h-3 w-1/2" /></div></div>
          {Array.from({ length: cols - 1 }).map((_, i) => <Sk key={i} className="h-3.5 flex-1" />)}
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton({ tab, isAdminView = false }: { tab: string; isAdminView?: boolean }) {
  return (
    <div role="status" aria-live="polite" aria-label="Loading dashboard">
      <style>{SHIMMER_CSS}</style>
      <span className="sr-only">Loading…</span>

      {tab === 'overview' && (
        <div className="space-y-3">
          <div className={`grid gap-3 grid-cols-2 md:grid-cols-3 ${isAdminView ? 'lg:grid-cols-6' : 'lg:grid-cols-5'}`}>
            {Array.from({ length: isAdminView ? 6 : 5 }).map((_, i) => <KpiTile key={i} />)}
          </div>
          <Sk className="mt-4 h-3.5 w-28" />
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">{[0, 1, 2, 3].map(i => <MiniTile key={i} />)}</div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <DonutCard />
            <BarsCard h="h-[330px]" />
            <div className="grid gap-3"><SplitCard /><SplitCard cols={2} /></div>
          </div>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">{[0, 1, 2, 3].map(i => <MiniTile key={i} />)}</div>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_1.4fr] gap-3">
            <BarsCard rows={2} h="h-[340px]" /><DonutCard h="h-[340px]" /><BarsCard rows={5} h="h-[340px]" />
          </div>
        </div>
      )}

      {tab === 'shipments' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 xl:grid-cols-[260px_minmax(0,1fr)] gap-3">
            <div className="grid grid-cols-2 xl:grid-cols-1 gap-3"><KpiTile /><KpiTile /></div>
            <div className={`${CARD} p-5`}>
              <div className="flex items-center justify-between"><Sk className="h-4 w-56" /><div className="flex gap-2"><Sk className="h-6 w-28" round="rounded-full" /><Sk className="h-6 w-16" round="rounded-full" /></div></div>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">{[0, 1, 2, 3].map(i => <div key={i} className="rounded-xl border border-[#EEF2F6] p-4 flex flex-col items-center gap-2"><Sk className="h-3 w-16" /><Sk className="h-6 w-12" /></div>)}</div>
              <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl border border-[#EEF2F6] py-5">
                {[0, 1].map(i => <div key={i} className="flex flex-col items-center gap-2"><Sk className="h-[90px] w-[180px]" round="rounded-t-full" /><Sk className="h-3 w-20" /></div>)}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3"><DonutCard h="h-[380px]" /><BarsCard rows={6} h="h-[380px]" /><DonutCard h="h-[380px]" /></div>
          <Sk className="mt-4 h-3.5 w-32" />
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">{Array.from({ length: 7 }).map((_, i) => <MiniTile key={i} />)}</div>
        </div>
      )}

      {tab === 'summary' && (
        <div className="space-y-3">
          {isAdminView && <TableCard rows={5} cols={8} />}
          <TableCard rows={6} cols={10} />
        </div>
      )}

      {tab !== 'overview' && tab !== 'shipments' && tab !== 'summary' && (
        <div className={`${CARD} py-16 flex flex-col items-center gap-3`}><Sk className="h-4 w-64" /><Sk className="h-3 w-48" /></div>
      )}
    </div>
  );
}

/** Header + tabs placeholder for the very first load (before the page chrome renders). */
export function DashboardPageSkeleton({ isAdminView = false }: { isAdminView?: boolean }) {
  return (
    <div>
      <style>{SHIMMER_CSS}</style>
      <div className="mb-3 lg:mb-4 flex items-center justify-between">
        <div><Sk className="h-7 w-44" /><Sk className="mt-2 h-3 w-60" /></div>
        <Sk className="h-9 w-28 hidden lg:block" round="rounded-full" />
      </div>
      <div className="mb-2 border-b border-[#E2E8F0] flex gap-8 pb-3">{[0, 1, 2, 3].map(i => <Sk key={i} className="h-6 w-24" />)}</div>
      <DashboardSkeleton tab="overview" isAdminView={isAdminView} />
    </div>
  );
}
