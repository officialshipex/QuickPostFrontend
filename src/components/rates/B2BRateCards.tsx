/* A seller's B2B (Cargo) rate card: per service, the zone-to-zone price matrix (₹/kg) and every charge, in words.
   Data from GET /b2b/myRateCard (Shipex-backend B2B/utils/b2bRateCardView.js) — the seller's own copy only.
   Used on the Cargo panel's profile → Rate Cards (the B2C panel keeps the B2C weight-slab table). */
import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../../services/apiClient';

const TXT = {
  title: 'text-[14px] font-semibold',
  label: 'text-[12px] font-semibold',
  value: 'text-[12px] font-normal',
  meta: 'text-[10px] font-semibold',
};

export interface B2BRateCardView {
  _id: string;
  courierServiceName: string;
  mode: string;
  status: 'Active' | 'Inactive';
  zones: { from: string[]; to: string[]; prices: Record<string, Record<string, number>> };
  charges: { label: string; value: string }[];
  ifApplicable: { label: string; value: string }[];
}

/** Loads and shows the B2B rate card of `userId` (an admin viewing a seller) or of the logged-in seller. */
export function B2BRateCards({ userId, reloadKey = 0 }: { userId?: string; reloadKey?: number }) {
  const [cards, setCards] = useState<B2BRateCardView[]>([]);
  const [planName, setPlanName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setCards([]); // never show the previous account's rates while this one loads
    try {
      const res = await apiClient.get('/b2b/myRateCard', { params: userId ? { userId } : {} });
      setCards(res.data?.rateCards || []);
      setPlanName(res.data?.planName || null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not load the B2B rate card.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load, reloadKey]);

  if (loading) return <p className={`text-center py-10 text-[#94A3B8] ${TXT.value}`}>Loading B2B rate cards…</p>;
  if (error) return <p className={`text-center py-10 text-red-500 ${TXT.value}`}>{error}</p>;
  if (!cards.length) {
    return <p className={`text-center py-10 text-[#94A3B8] ${TXT.value}`}>No B2B rate cards{planName ? ` in plan "${planName}"` : ''} yet.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {planName && <p className={`${TXT.value} text-[#64748B]`}>B2B plan: <span className="font-semibold text-[#0F172A]">{planName}</span> · prices are ₹ per kg, from zone (rows) to zone (columns)</p>}
      {cards.map((card) => (
        <div key={card._id || card.courierServiceName} className="border border-[#E2E8F0] rounded-xl overflow-hidden bg-white">
          <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-[#F8FAFC] border-b border-[#E2E8F0]">
            <div className="min-w-0">
              <p className={`${TXT.title} text-[#0F172A] truncate`}>{card.courierServiceName}</p>
              <p className={`${TXT.value} text-[#64748B]`}>{card.mode}</p>
            </div>
            <span className={`${TXT.meta} px-2 py-0.5 rounded-full shrink-0 ${card.status === 'Active' ? 'bg-[#ECFDF5] text-[#00A86B]' : 'bg-[#F1F5F9] text-[#94A3B8]'}`}>{card.status}</span>
          </div>

          {/* zone matrix */}
          {card.zones.from.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr className="bg-[#E6F9F2]">
                    <th className={`px-3 py-2 ${TXT.label} text-[#64748B] text-left whitespace-nowrap`}>From \ To</th>
                    {card.zones.to.map((z) => <th key={z} className={`px-3 py-2 ${TXT.label} text-[#64748B] whitespace-nowrap`}>{z}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {card.zones.from.map((from) => (
                    <tr key={from} className="border-t border-[#F1F5F9]">
                      <td className={`px-3 py-2 ${TXT.label} text-[#0F172A] text-left whitespace-nowrap`}>{from}</td>
                      {card.zones.to.map((to) => {
                        const price = card.zones.prices[from]?.[to];
                        return <td key={to} className={`px-3 py-2 ${TXT.value} text-[#374151] whitespace-nowrap`}>{price != null ? `₹${price}` : '—'}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className={`px-4 py-3 ${TXT.value} text-[#94A3B8]`}>No zone prices set.</p>
          )}

          {/* charges */}
          <div className="px-4 py-3 border-t border-[#E2E8F0] grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
            {card.charges.map((c) => (
              <div key={c.label} className="flex justify-between gap-3">
                <span className={`${TXT.value} text-[#64748B]`}>{c.label}</span>
                <span className={`${TXT.value} text-[#0F172A] text-right`}>{c.value}</span>
              </div>
            ))}
          </div>
          {card.ifApplicable.length > 0 && (
            <div className="px-4 pb-3">
              <p className={`${TXT.meta} text-[#94A3B8] uppercase tracking-wide mb-1`}>Charged only if it happens</p>
              <p className={`${TXT.value} text-[#64748B]`}>{card.ifApplicable.map((c) => `${c.label}: ${c.value}`).join(' · ')}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
