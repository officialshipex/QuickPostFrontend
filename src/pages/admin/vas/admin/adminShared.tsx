import { Plus, Trash2 } from 'lucide-react';
import type { VasPlan } from '../vasApi';
import type { FollowUpStatus, SubStatus } from './adminVasApi';

export const inputCls = 'h-10 px-3 rounded-lg border border-[#E2E8F0] bg-white text-[13px] text-[#0F172A] outline-none focus:border-[#00A86B] focus:ring-2 focus:ring-[#00A86B]/10 transition-colors';

export function Toggle({ checked, onChange, disabled, label }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full shrink-0 transition-colors disabled:opacity-60 ${checked ? 'bg-[#00A86B]' : 'bg-[#CBD5E1]'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  );
}

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-[#F0FDF4] text-[#16A34A] border-[#16A34A]/20',
  inactive: 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]',
  expired: 'bg-[#FEF2F2] text-red-600 border-red-200',
};
const STATUS_LABEL: Record<SubStatus, string> = { active: 'Active', inactive: 'Deactivated', expired: 'Expired' };

export function StatusBadge({ status, blocked }: { status: SubStatus; blocked?: boolean }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className={`inline-flex items-center h-6 px-2.5 rounded-full border text-[11px] font-bold ${STATUS_STYLE[status]}`}>{STATUS_LABEL[status]}</span>
      {blocked && <span className="inline-flex items-center h-6 px-2 rounded-full bg-[#FFFBEB] border border-[#FDE68A] text-[10.5px] font-bold text-[#B45309]">Switched off</span>}
    </span>
  );
}

const FOLLOW_STYLE: Record<FollowUpStatus, string> = {
  none: '',
  open: 'bg-[#FEF2F2] text-red-600 border-red-200',
  contacted: 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]',
  resolved: 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]',
};
export const FOLLOW_LABEL: Record<FollowUpStatus, string> = { none: 'No follow-up', open: 'Needs follow-up', contacted: 'Contacted', resolved: 'Resolved' };

export function FollowBadge({ status }: { status: FollowUpStatus }) {
  if (status === 'none') return <span className="text-[12px] text-[#CBD5E1]">—</span>;
  return <span className={`inline-flex items-center h-6 px-2.5 rounded-full border text-[11px] font-bold whitespace-nowrap ${FOLLOW_STYLE[status]}`}>{FOLLOW_LABEL[status]}</span>;
}

/** Editable list of "N months → ₹price" rows. Values are kept as strings while typing. */
export interface PlanDraft { months: string; price: string }

export const toDrafts = (plans: VasPlan[]): PlanDraft[] => plans.map((p) => ({ months: String(p.months), price: String(p.price) }));

/** Returns the clean plans, or an error message. */
export function parseDrafts(rows: PlanDraft[]): { plans: VasPlan[]; error?: string } {
  const plans: VasPlan[] = [];
  for (const r of rows) {
    const months = Number(r.months);
    const price = Number(r.price);
    if (!Number.isInteger(months) || months < 1 || months > 60) return { plans, error: 'Months must be a whole number between 1 and 60.' };
    if (!Number.isFinite(price) || price < 0 || r.price.trim() === '') return { plans, error: 'Enter a price of 0 or more for every plan.' };
    plans.push({ months, price });
  }
  if (new Set(plans.map((p) => p.months)).size !== plans.length) return { plans, error: 'Two plans have the same number of months.' };
  return { plans: plans.sort((a, b) => a.months - b.months) };
}

export function PlanEditor({ rows, onChange, disabled }: { rows: PlanDraft[]; onChange: (rows: PlanDraft[]) => void; disabled?: boolean }) {
  const set = (i: number, patch: Partial<PlanDraft>) => onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  return (
    <div className="space-y-2">
      {rows.length === 0 && <p className="text-[12.5px] text-[#94A3B8]">No plans yet. Add one, e.g. 1 month → ₹500.</p>}
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="number" min={1} max={60} inputMode="numeric" value={r.months} disabled={disabled}
            onChange={(e) => set(i, { months: e.target.value })}
            className={`${inputCls} w-24`} aria-label="Months" placeholder="Months"
          />
          <span className="text-[12.5px] text-[#64748B] shrink-0">month(s) →</span>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[#64748B]">₹</span>
            <input
              type="number" min={0} inputMode="decimal" value={r.price} disabled={disabled}
              onChange={(e) => set(i, { price: e.target.value })}
              className={`${inputCls} w-32 pl-7`} aria-label="Price" placeholder="Price"
            />
          </div>
          <button type="button" disabled={disabled} onClick={() => onChange(rows.filter((_, idx) => idx !== i))} className="w-9 h-9 rounded-lg text-[#94A3B8] hover:text-red-600 hover:bg-red-50 flex items-center justify-center" aria-label="Remove plan">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        type="button" disabled={disabled} onClick={() => onChange([...rows, { months: '', price: '' }])}
        className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-[#00A86B] hover:underline disabled:opacity-60"
      >
        <Plus className="w-3.5 h-3.5" /> Add plan
      </button>
    </div>
  );
}
