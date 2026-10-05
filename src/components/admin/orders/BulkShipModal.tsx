import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ListOrdered, Loader2, MapPin, X } from 'lucide-react';
import { apiClient } from '../../../services/apiClient';

// Bulk Ship popup: optionally pick the pickup address for the selected orders and rank the couriers to
// try first (the same "Courier Priority" as Courier Setup, so it also becomes the account's standing
// priority). Both are optional: with nothing chosen the orders keep their own pickup address and the
// account's current priority. `userId` is the seller the selected orders belong to (admin view only; a
// seller's own session needs none).

type Ranked = { name: string; provider: string; mode: string };
type Option = { value: string; label: string; search: string };

interface Props {
  open: boolean;
  onClose: () => void;
  selectedOrders: string[];
  userId?: string;
  onShip: (wh?: Record<string, string>) => Promise<void> | void;
}

const courierKey = (c: { name?: string; provider?: string; mode?: string }) =>
  `${c.name ?? ''}|||${c.provider ?? ''}|||${c.mode ?? ''}`;

// One-line dropdown you can type into to search (keeps the popup short with hundreds of entries). The
// list opens in a portal so the popup's scrolling area never clips it.
function SearchSelect({ options, selected, placeholder, onSelect }: {
  options: Option[];
  selected?: string; // label of the current choice, shown when closed
  placeholder: string;
  onSelect: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [rect, setRect] = useState<DOMRect | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false); // was the list already open when this click began?

  const measure = () => { if (boxRef.current) setRect(boxRef.current.getBoundingClientRect()); };

  useEffect(() => {
    if (!open) return;
    measure();
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!boxRef.current?.contains(t) && !listRef.current?.contains(t)) { setOpen(false); setQuery(''); }
    };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [open]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter(o => o.search.includes(q)) : options;
  }, [options, query]);

  return (
    <div ref={boxRef} className="relative">
      <input
        type="text"
        value={open ? query : (selected || '')}
        onMouseDown={() => { wasOpen.current = open; }}
        // click toggles the list; focus alone also opens it (tabbing in)
        onClick={() => {
          if (wasOpen.current) { if (!query) setOpen(false); } // was open: close (unless mid-search)
          else { setOpen(true); setQuery(''); } // was closed (input may still have focus): open again
        }}
        onFocus={() => { setOpen(true); setQuery(''); }}
        onChange={e => { setQuery(e.target.value); if (!open) setOpen(true); }}
        placeholder={placeholder}
        className="w-full h-10 pl-3 pr-9 rounded-xl border border-[#E2E8F0] bg-white text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B]"
      />
      <ChevronDown className={`w-4 h-4 text-[#94A3B8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-transform ${open ? 'rotate-180' : ''}`} />
      {open && rect && createPortal(
        <div
          ref={listRef}
          style={{ position: 'fixed', top: rect.bottom + 4, left: rect.left, width: rect.width, zIndex: 400 }}
          className="max-h-[220px] overflow-y-auto bg-white border border-[#E2E8F0] rounded-xl shadow-xl py-1"
        >
          {shown.length === 0 ? (
            <p className="text-[12px] text-[#94A3B8] text-center py-3">No match.</p>
          ) : shown.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onSelect(o.value); setOpen(false); setQuery(''); }}
              className="w-full text-left px-3 py-2 text-[12px] text-[#334155] hover:bg-[#F0FDF9] transition-colors"
            >
              {o.label}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}

export function BulkShipModal({ open, onClose, selectedOrders, userId, onShip }: Props) {
  const [pickupList, setPickupList] = useState<any[]>([]);
  const [pickup, setPickup] = useState<any | null>(null);
  const [services, setServices] = useState<Ranked[]>([]);
  const [ranked, setRanked] = useState<Ranked[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const savedKeys = useRef(''); // the priority as it was loaded, so it is saved only when changed

  const scope = userId ? { userId } : {};

  useEffect(() => {
    if (!open) return;
    setPickup(null); setRanked([]); setError(''); setBusy(false); savedKeys.current = '';
    apiClient.get('/order/pickupAddress', { params: { limit: 100, ...scope } })
      .then(res => setPickupList(res.data?.data || []))
      .catch(() => setPickupList([]));
    // Courier priority is secondary: a failure here must never block shipping.
    apiClient.get('/courier/getCourierServices', { params: scope })
      .then(res => {
        const rateCard: any[] = res.data?.data?.rateCard || [];
        const active: Ranked[] = rateCard.filter(c => c.status === 'Active').map(c => ({
          name: c.courierServiceName, provider: c.courierProviderName, mode: c.mode,
        }));
        setServices(active);
        // Start from the priority already saved (only a custom one is a list); nothing saved = empty and the
        // user ranks from scratch. Only entries that are still active services are shown.
        const saved: any[] = res.data?.data?.priorityType === 'Custom' ? (res.data?.data?.courierPriority || []) : [];
        const startList: Ranked[] = saved
          .filter(p => active.some(a => courierKey(a) === courierKey(p)))
          .map(p => ({ name: p.name, provider: p.provider, mode: p.mode }));
        savedKeys.current = startList.map(courierKey).join('##');
        setRanked(startList);
      })
      .catch(() => setServices([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId]);

  const pickupOptions = useMemo<Option[]>(() => pickupList.map(a => {
    const pa = a.pickupAddress || {};
    return {
      value: a._id,
      label: `${pa.contactName || 'Unnamed'} — ${pa.address || ''}, ${pa.city || ''} ${pa.pinCode || ''}`,
      search: Object.values(pa).join(' ').toLowerCase(), // name, address, city, state, pincode, phone
    };
  }), [pickupList]);

  const serviceOptions = useMemo<Option[]>(() => services
    .filter(s => !ranked.some(r => courierKey(r) === courierKey(s)))
    .map(s => ({
      value: courierKey(s),
      label: `${s.name} (${s.mode})`,
      search: `${s.name} ${s.provider} ${s.mode}`.toLowerCase(),
    })), [services, ranked]);

  if (!open) return null;

  const submit = async () => {
    setBusy(true); setError('');
    try {
      if (ranked.length > 0 && ranked.map(courierKey).join('##') !== savedKeys.current) {
        try {
          await apiClient.post('/courier/saveCourierPriority', { type: 'Custom', couriers: ranked }, { params: scope });
        } catch {
          // never block shipping on the priority save
        }
      }
      let wh: Record<string, string> | undefined;
      if (pickup) {
        const pa = pickup.pickupAddress || {};
        wh = {
          contactName: pa.contactName, email: pa.email, phoneNumber: pa.phoneNumber,
          address: pa.address, pinCode: pa.pinCode, city: pa.city, state: pa.state,
        };
        await apiClient.post('/bulk/updatePickup', { formData: wh, setSelectedData: selectedOrders }, { params: scope });
      }
      await onShip(wh);
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Could not start the bulk shipment.');
    } finally {
      setBusy(false);
    }
  };

  const pa = pickup?.pickupAddress;

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => !busy && onClose()} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* header and the Cancel / Ship buttons stay fixed; everything between scrolls */}
        <div className="px-6 pt-6 pb-3 shrink-0 border-b border-[#F1F5F9]">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[15px] font-bold text-[#0F172A]">Bulk Ship</h3>
            <button onClick={() => !busy && onClose()} className="w-7 h-7 rounded-full flex items-center justify-center text-[#94A3B8] hover:bg-[#F8FAFC]"><X className="w-4 h-4" /></button>
          </div>
          <p className="text-[12px] text-[#64748B]">{selectedOrders.length} orders selected.</p>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-[#00A86B]" />
            <h4 className="text-[12px] font-semibold text-[#334155]">Pickup address (optional)</h4>
          </div>
          <SearchSelect
            options={pickupOptions}
            selected={pa ? `${pa.contactName || 'Unnamed'} — ${pa.address || ''}, ${pa.city || ''} ${pa.pinCode || ''}` : ''}
            placeholder="Search or select a pickup address"
            onSelect={v => setPickup(pickupList.find(a => a._id === v) || null)}
          />
          <p className="text-[11px] text-[#94A3B8] mt-1.5">
            Leave empty to ship from each order&apos;s own pickup address.
            {pickup && <button type="button" onClick={() => setPickup(null)} className="ml-2 text-[#00A86B] hover:underline">Clear</button>}
          </p>

          {services.length > 0 && (
            <div className="mt-5 pt-4 border-t border-[#E2E8F0]">
              <div className="flex items-center gap-2 mb-1">
                <ListOrdered className="w-4 h-4 text-[#00A86B]" />
                <h4 className="text-[12px] font-semibold text-[#334155]">Courier priority (optional)</h4>
              </div>
              <p className="text-[11px] text-[#94A3B8] mb-2">Rank the couriers to try first. This also becomes your standing priority for future shipments. Leave blank to keep your current settings.</p>
              <SearchSelect
                options={serviceOptions}
                placeholder="Search or select a courier to add as next priority"
                onSelect={v => { const s = services.find(x => courierKey(x) === v); if (s) setRanked(prev => [...prev, s]); }}
              />
              {ranked.length > 0 && (
                <div className="mt-2 space-y-1">
                  {ranked.map((c, i) => (
                    <div key={courierKey(c)} className="flex items-center justify-between bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2.5 py-1.5">
                      <span className="text-[12px] font-semibold text-[#334155]">
                        <span className="inline-block bg-[#00A86B] text-white text-[10px] font-bold rounded px-1.5 py-0.5 mr-2">{i + 1}</span>
                        {c.name} <span className="text-[#94A3B8] font-normal">({c.mode})</span>
                      </span>
                      <button type="button" onClick={() => setRanked(prev => prev.filter((_, j) => j !== i))} className="text-[#94A3B8] hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setRanked([])} className="text-[11px] text-[#00A86B] hover:underline">Clear priority selections</button>
                </div>
              )}
            </div>
          )}

          {error && <p className="mt-3 text-[12px] text-red-600">{error}</p>}
        </div>

        <div className="flex gap-3 px-6 py-4 shrink-0 border-t border-[#F1F5F9] bg-white">
          <button onClick={onClose} disabled={busy} className="flex-1 h-10 rounded-xl border border-[#E2E8F0] text-[#475569] text-sm font-semibold hover:bg-[#F8FAFC] disabled:opacity-50">Cancel</button>
          <button onClick={submit} disabled={busy}
            className="flex-1 h-10 rounded-xl bg-[#00A86B] text-white text-sm font-bold hover:bg-[#009B63] disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}{busy ? 'Starting…' : 'Ship'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
