import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, X } from 'lucide-react';
import { apiMessage, fmtMoney, planLabel } from '../vasApi';
import { adminVasApi, type AccessMode, type AdminService, type ChargeMode, type OverrideRow, type SellerRef } from './adminVasApi';
import { inputCls, parseDrafts, PlanEditor, type PlanDraft } from './adminShared';

interface Props {
  service: AdminService;
  onChanged: () => void;
  notify: (type: 'success' | 'error' | 'info', text: string) => void;
}

const ACCESS_LABEL: Record<AccessMode, string> = { default: 'Same as everyone', enabled: 'Always on', disabled: 'Switched off' };
const CHARGE_LABEL: Record<ChargeMode, string> = { default: 'Same as everyone', free: 'Free', custom: 'Own plans' };

/** Exceptions for chosen sellers: switch the service off/on just for them, or give them free access / their own price plans. */
export function ServiceRules({ service, onChanged, notify }: Props) {
  const [rules, setRules] = useState<OverrideRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SellerRef[]>([]);
  const [picked, setPicked] = useState<SellerRef[]>([]);
  const [access, setAccess] = useState<AccessMode>('default');
  const [chargeMode, setChargeMode] = useState<ChargeMode>('default');
  const [rows, setRows] = useState<PlanDraft[]>([{ months: '1', price: '' }]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRules(await adminVasApi.overrides(service.key)); }
    catch (err) { notify('error', apiMessage(err)); }
    finally { setLoading(false); }
  }, [service.key, notify]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (query.trim().length < 2) { setSuggestions([]); return; }
    const t = setTimeout(async () => {
      try { setSuggestions(await adminVasApi.searchSellers(query.trim())); } catch { setSuggestions([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const reset = () => {
    setAdding(false); setQuery(''); setSuggestions([]); setPicked([]);
    setAccess('default'); setChargeMode('default'); setRows([{ months: '1', price: '' }]); setNote('');
  };

  const save = async () => {
    if (!picked.length) { notify('error', 'Choose at least one seller.'); return; }
    if (access === 'default' && chargeMode === 'default') { notify('error', 'Choose what changes for these sellers.'); return; }
    let plans: { months: number; price: number }[] = [];
    if (chargeMode === 'custom') {
      const parsed = parseDrafts(rows);
      if (parsed.error || !parsed.plans.length) { notify('error', parsed.error || 'Add at least one plan.'); return; }
      plans = parsed.plans;
    }
    setSaving(true);
    try {
      const n = await adminVasApi.setOverrides(service.key, { userIds: picked.map((p) => p._id), access, chargeMode, plans, note });
      notify('success', `Rule saved for ${n} seller${n === 1 ? '' : 's'}.`);
      reset();
      await load();
      onChanged();
    } catch (err) {
      notify('error', apiMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (r: OverrideRow) => {
    try {
      await adminVasApi.clearOverride(service.key, r.userId);
      notify('success', 'Rule removed — this seller now follows the normal settings.');
      await load();
      onChanged();
    } catch (err) {
      notify('error', apiMessage(err));
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[14px] font-bold text-[#0F172A]">Special rules for chosen sellers</h3>
            <p className="text-[12.5px] text-[#64748B] mt-0.5">Switch {service.name} off or on for specific sellers, make it free for them, or give them their own plans. These win over the settings for everyone.</p>
          </div>
          {!adding && (
            <button type="button" onClick={() => setAdding(true)} className="h-9 px-4 rounded-lg bg-[#00A86B] hover:bg-[#009B63] text-white text-[12.5px] font-bold inline-flex items-center gap-1.5 shrink-0">
              <Plus className="w-4 h-4" /> Add rule
            </button>
          )}
        </div>

        {adding && (
          <div className="mt-4 pt-4 border-t border-[#F1F5F9] space-y-4">
            <div>
              <label className="text-[12px] font-bold text-[#475569] block mb-1.5">Sellers</label>
              {picked.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {picked.map((p) => (
                    <span key={p._id} className="inline-flex items-center gap-1.5 h-7 pl-2.5 pr-1.5 rounded-full bg-[#F0FDF4] border border-[#00A86B]/25 text-[12px] font-semibold text-[#166534]">
                      {p.fullname}
                      <button type="button" onClick={() => setPicked((l) => l.filter((x) => x._id !== p._id))} className="w-4 h-4 rounded-full hover:bg-[#00A86B]/15 flex items-center justify-center" aria-label={`Remove ${p.fullname}`}><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
              <div className="relative">
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Type a name, email or phone (min 2 letters)" className={`${inputCls} w-full`} autoComplete="off" aria-label="Find seller" />
                {suggestions.length > 0 && (
                  <ul className="absolute z-20 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white rounded-lg border border-[#E2E8F0] shadow-lg">
                    {suggestions.filter((s) => !picked.some((p) => p._id === s._id)).map((s) => (
                      <li key={s._id}>
                        <button type="button" onClick={() => { setPicked((l) => [...l, s]); setQuery(''); setSuggestions([]); }} className="w-full text-left px-3 py-2 hover:bg-[#F8FAFC]">
                          <p className="text-[13px] font-semibold text-[#0F172A]">{s.fullname}</p>
                          <p className="text-[11.5px] text-[#94A3B8]">{s.email}{s.phoneNumber ? ` · ${s.phoneNumber}` : ''}</p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] font-bold text-[#475569] block mb-1.5">Access</label>
                <select value={access} onChange={(e) => setAccess(e.target.value as AccessMode)} className={`${inputCls} w-full`}>
                  <option value="default">{ACCESS_LABEL.default}</option>
                  <option value="disabled">Switch off for these sellers</option>
                  <option value="enabled">Keep on (even if off for everyone)</option>
                </select>
              </div>
              <div>
                <label className="text-[12px] font-bold text-[#475569] block mb-1.5">Charges</label>
                <select value={chargeMode} onChange={(e) => setChargeMode(e.target.value as ChargeMode)} className={`${inputCls} w-full`}>
                  <option value="default">{CHARGE_LABEL.default}</option>
                  <option value="free">Free for these sellers</option>
                  <option value="custom">Their own plans</option>
                </select>
              </div>
            </div>

            {chargeMode === 'custom' && (
              <div>
                <label className="text-[12px] font-bold text-[#475569] block mb-1.5">Plans for these sellers</label>
                <PlanEditor rows={rows} onChange={setRows} />
              </div>
            )}

            <div>
              <label className="text-[12px] font-bold text-[#475569] block mb-1.5">Note (optional)</label>
              <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="Why this rule? e.g. early partner, abuse reported" className={`${inputCls} w-full`} />
            </div>

            <div className="flex items-center gap-2">
              <button type="button" onClick={save} disabled={saving} className="h-10 px-5 rounded-lg bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] font-bold disabled:opacity-60 inline-flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save rule
              </button>
              <button type="button" onClick={reset} className="h-10 px-4 rounded-lg text-[13px] font-semibold text-[#64748B] hover:bg-[#F1F5F9]">Cancel</button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[720px]">
            <thead>
              <tr className="bg-[#E6F9F2] border-b border-[#E2E8F0] text-[11px] uppercase tracking-wider font-bold text-[#64748B]">
                <th className="p-3 pl-4">Seller</th>
                <th className="p-3">Access</th>
                <th className="p-3">Charges</th>
                <th className="p-3">Note</th>
                <th className="p-3 w-12" />
              </tr>
            </thead>
            <tbody className="text-[12.5px] text-[#475569]">
              {loading ? (
                <tr><td colSpan={5} className="p-10 text-center text-[#94A3B8]">Loading…</td></tr>
              ) : rules.length === 0 ? (
                <tr><td colSpan={5} className="p-10 text-center text-[#94A3B8]">No special rules. Every seller follows the settings for everyone.</td></tr>
              ) : rules.map((r) => (
                <tr key={r._id} className="border-b border-[#F1F5F9]">
                  <td className="p-3 pl-4">
                    <p className="font-semibold text-[#0F172A] text-[13px]">{r.user?.fullname || 'Deleted user'}</p>
                    <p className="text-[11.5px] text-[#94A3B8]">{r.user?.email}</p>
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex h-6 items-center px-2.5 rounded-full border text-[11px] font-bold ${r.access === 'disabled' ? 'bg-[#FEF2F2] text-red-600 border-red-200' : r.access === 'enabled' ? 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]' : 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]'}`}>{ACCESS_LABEL[r.access]}</span>
                  </td>
                  <td className="p-3">
                    {r.chargeMode === 'custom' ? r.plans.map((p) => `${planLabel(p)} ${fmtMoney(p.price)}`).join(' · ') : CHARGE_LABEL[r.chargeMode]}
                  </td>
                  <td className="p-3 max-w-[260px] truncate">{r.note || '—'}</td>
                  <td className="p-3">
                    <button type="button" onClick={() => remove(r)} className="w-8 h-8 rounded-lg text-[#94A3B8] hover:text-red-600 hover:bg-red-50 flex items-center justify-center" aria-label="Remove rule"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
