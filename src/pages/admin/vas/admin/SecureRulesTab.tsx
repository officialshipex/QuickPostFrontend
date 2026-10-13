import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { apiMessage, fmtMoney } from '../vasApi';
import { secureAdminApi, type SecureRules } from '../secure/secureApi';
import type { AdminService } from './adminVasApi';
import { inputCls } from './adminShared';

interface Props {
  service: AdminService;
  onChanged: () => void;
  notify: (type: 'success' | 'error' | 'info', text: string) => void;
}

type Draft = Record<keyof SecureRules, string>;
const toDraft = (r: SecureRules): Draft => ({
  threshold: String(r.threshold), courierMatch: r.courierMatch, premiumPercent: String(r.premiumPercent),
  minPremium: String(r.minPremium), maxCover: String(r.maxCover), claimWindowDays: String(r.claimWindowDays),
});

/** What the plan covers, what it costs per shipment, and how long a seller has to claim. Applies to shipments booked after the change. */
export function SecureRulesTab({ service, onChanged, notify }: Props) {
  const [saved, setSaved] = useState<SecureRules | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const isIndiaPost = service.key === 'auto-secure-india-post';

  useEffect(() => {
    let live = true;
    setDraft(null);
    secureAdminApi.rules(service.key).then((r) => { if (live) { setSaved(r); setDraft(toDraft(r)); } }).catch((e) => notify('error', apiMessage(e)));
    return () => { live = false; };
  }, [service.key, notify]);

  if (!draft || !saved) return <p className="text-[13px] text-[#94A3B8] py-10 text-center">Loading…</p>;

  const set = (k: keyof SecureRules, v: string) => setDraft({ ...draft, [k]: v });
  const dirty = JSON.stringify(draft) !== JSON.stringify(toDraft(saved));

  // Worked example from the numbers on screen
  const pct = Number(draft.premiumPercent) || 0;
  const min = Number(draft.minPremium) || 0;
  const cap = Number(draft.maxCover) || 0;
  const sample = Math.max(Number(draft.threshold) + 1500, 3000);
  const premium = Math.round(Math.max(min, (sample * pct) / 100) * 100) / 100;

  const save = async () => {
    setSaving(true);
    try {
      const next = await secureAdminApi.saveRules(service.key, {
        threshold: Number(draft.threshold), courierMatch: draft.courierMatch, premiumPercent: Number(draft.premiumPercent),
        minPremium: Number(draft.minPremium), maxCover: Number(draft.maxCover), claimWindowDays: Number(draft.claimWindowDays),
      });
      setSaved(next); setDraft(toDraft(next));
      notify('success', 'Cover rules saved. They apply to shipments booked from now on.');
      onChanged();
    } catch (err) {
      notify('error', apiMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // A plain function (not a component) so the inputs keep focus while typing.
  const field = (k: keyof SecureRules, label: string, hint: string, prefix?: string, suffix?: string) => (
    <div key={k}>
      <label className="text-[12px] font-bold text-[#475569] block mb-1.5">{label}</label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[#64748B]">{prefix}</span>}
        <input type="number" min={0} value={draft[k]} onChange={(e) => set(k, e.target.value)} className={`${inputCls} w-full ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-12' : ''}`} />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-[#64748B]">{suffix}</span>}
      </div>
      <p className="text-[11.5px] text-[#94A3B8] mt-1">{hint}</p>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5 space-y-5">
      <div>
        <h3 className="text-[14px] font-bold text-[#0F172A]">Cover rules — {service.name}</h3>
        <p className="text-[12.5px] text-[#64748B] mt-0.5">Changes apply to shipments booked after you save. Shipments already covered keep the premium and cover they were issued with.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {isIndiaPost ? (
          <div>
            <label className="text-[12px] font-bold text-[#475569] block mb-1.5">Courier name contains</label>
            <input value={draft.courierMatch} onChange={(e) => set('courierMatch', e.target.value)} maxLength={60} className={`${inputCls} w-full`} placeholder="india post" />
            <p className="text-[11.5px] text-[#94A3B8] mt-1">Shipments whose courier name or service contains this text (any capitals) are covered.</p>
          </div>
        ) : (
          field('threshold', 'Cover shipments valued above', 'Shipments at or below this value are not covered.', '₹')
        )}
        {field('maxCover', 'Maximum cover per shipment', 'A claim can never pay more than this, or the shipment value if lower.', '₹')}
        {field('premiumPercent', 'Premium', "Charged from the seller's wallet as this share of the shipment value.", undefined, '%')}
        {field('minPremium', 'Minimum premium', 'Charged when the percentage comes to less.', '₹')}
        {field('claimWindowDays', 'Claim window', 'How long after the shipment is Lost, Damaged or Delivered a seller can file.', undefined, 'days')}
      </div>

      <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-4 py-3 text-[12.5px] text-[#475569]">
        Example: a <span className="font-semibold text-[#0F172A]">{fmtMoney(sample)}</span> shipment costs the seller <span className="font-semibold text-[#0F172A]">{fmtMoney(premium)}</span> and is covered up to <span className="font-semibold text-[#0F172A]">{fmtMoney(Math.min(sample, cap))}</span>.
        {pct === 0 && min === 0 && <span className="text-[#B45309] font-semibold"> Premium is zero — cover is free.</span>}
      </div>

      <div className="flex items-center gap-3">
        <button type="button" onClick={save} disabled={saving || !dirty} className="h-10 px-5 rounded-lg bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] font-bold disabled:opacity-50 inline-flex items-center gap-2">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save rules
        </button>
        {dirty && <span className="text-[12px] font-semibold text-[#B45309]">Unsaved changes</span>}
      </div>
    </div>
  );
}
