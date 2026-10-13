import { useEffect, useState } from 'react';
import { CalendarClock, ChevronDown, Loader2 } from 'lucide-react';
import { apiMessage, fmtDateTime } from '../vasApi';
import { adminVasApi, type AdminService } from './adminVasApi';
import { inputCls, parseDrafts, PlanEditor, toDrafts, Toggle, type PlanDraft } from './adminShared';

interface Props {
  service: AdminService;
  onChanged: () => void;
  notify: (type: 'success' | 'error' | 'info', text: string) => void;
}

/** Service-wide switches: on/off for everyone, and the price plans for everyone. Per-seller exceptions live under "Special rules". */
export function ServiceSettings({ service, onChanged, notify }: Props) {
  const { config } = service;
  const [enabled, setEnabled] = useState(config.enabled);
  const [pricing, setPricing] = useState(config.pricingEnabled);
  const [rows, setRows] = useState<PlanDraft[]>(toDrafts(config.plans));
  const [saving, setSaving] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [freeUntil, setFreeUntil] = useState('');
  const [expiring, setExpiring] = useState(false);
  const [minDate] = useState(() => new Date(Date.now() + 864e5).toISOString().slice(0, 10)); // tomorrow

  // Reset the form when another service is opened or the saved values change.
  useEffect(() => {
    setEnabled(config.enabled);
    setPricing(config.pricingEnabled);
    setRows(toDrafts(config.plans));
  }, [service.key, config.enabled, config.pricingEnabled, config.plans]);

  const parsed = parseDrafts(rows);
  const dirty =
    enabled !== config.enabled ||
    pricing !== config.pricingEnabled ||
    JSON.stringify(parsed.plans) !== JSON.stringify(config.plans) ||
    rows.length !== config.plans.length;

  const save = async () => {
    if (parsed.error && (rows.length || pricing)) { notify('error', parsed.error); return; }
    if (pricing && !parsed.plans.length) { notify('error', 'Add at least one plan before turning charges on.'); return; }
    setSaving(true);
    try {
      await adminVasApi.updateService(service.key, { enabled, pricingEnabled: pricing, plans: parsed.plans });
      notify('success', `${service.name} settings saved.`);
      onChanged();
    } catch (err) {
      notify('error', apiMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const expireFree = async () => {
    if (!freeUntil) { notify('error', 'Choose an end date.'); return; }
    setExpiring(true);
    try {
      const n = await adminVasApi.expireFree(service.key, new Date(`${freeUntil}T23:59:59`).toISOString());
      notify('success', `End date set for ${n} seller${n === 1 ? '' : 's'}.`);
      setFreeUntil('');
      onChanged();
    } catch (err) {
      notify('error', apiMessage(err));
    } finally {
      setExpiring(false);
    }
  };


  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[14px] font-bold text-[#0F172A]">Availability</h3>
          <p className="text-[12.5px] text-[#64748B] mt-0.5">
            {enabled ? 'Sellers can use this service.' : 'Switched off for all sellers. Live branded pages stop showing; sellers keep their saved work. Use Special rules to keep it on for chosen sellers.'}
          </p>
        </div>
        <Toggle checked={enabled} onChange={setEnabled} label="Service enabled for everyone" />
      </div>

      <div className="border-t border-[#F1F5F9] pt-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h3 className="text-[14px] font-bold text-[#0F172A]">Charges</h3>
            <p className="text-[12.5px] text-[#64748B] mt-0.5">
              {pricing ? 'Sellers must buy one of these plans from their wallet.' : 'Free for everyone right now.'}
            </p>
          </div>
          <Toggle checked={pricing} onChange={setPricing} label="Charge sellers" />
        </div>
        <PlanEditor rows={rows} onChange={setRows} />
        <p className="text-[11.5px] text-[#94A3B8] mt-2">Prices apply to all sellers. For different prices or free access for specific sellers, use Special rules.</p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button" onClick={save} disabled={saving || !dirty}
          className="h-10 px-5 rounded-lg bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] font-bold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save settings
        </button>
        {dirty && <span className="text-[12px] font-semibold text-[#B45309]">Unsaved changes</span>}
      </div>

      {pricing && (
        <div className="border-t border-[#F1F5F9] pt-5">
          <h3 className="text-[14px] font-bold text-[#0F172A] flex items-center gap-2"><CalendarClock className="w-4 h-4 text-[#64748B]" /> Sellers already using it free</h3>
          <p className="text-[12.5px] text-[#64748B] mt-0.5 mb-3">
            Sellers who activated while it was free keep using it with no end date. Give them an end date (for example 30 days' notice) so they pick a plan after it.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input type="date" min={minDate} value={freeUntil} onChange={(e) => setFreeUntil(e.target.value)} className={inputCls} aria-label="Free period ends on" />
            <button type="button" onClick={expireFree} disabled={expiring || !freeUntil} className="h-10 px-4 rounded-lg border border-[#00A86B] text-[#00A86B] hover:bg-[#F0FDF4] text-[13px] font-bold disabled:opacity-50 inline-flex items-center gap-2">
              {expiring && <Loader2 className="w-4 h-4 animate-spin" />} Set end date
            </button>
          </div>
        </div>
      )}

      {config.changeLog.length > 0 && (
        <div className="border-t border-[#F1F5F9] pt-4">
          <button type="button" onClick={() => setLogOpen((o) => !o)} className="w-full flex items-center justify-between text-[12.5px] font-bold text-[#475569]">
            Change history <ChevronDown className={`w-4 h-4 transition-transform ${logOpen ? 'rotate-180' : ''}`} />
          </button>
          {logOpen && (
            <ul className="mt-2 space-y-1.5">
              {config.changeLog.map((l, i) => (
                <li key={i} className="text-[12px] text-[#64748B]">
                  <span className="font-semibold text-[#334155]">{fmtDateTime(l.at)}</span> · {l.by} — {l.summary}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
