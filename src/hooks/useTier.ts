// Tier is derived from monthly shipment volume — thresholds per the tier table (Silver 0–1,000 … Titanium 10,000+).
export const getTier = (monthlyShipments: number): string => {
  const n = monthlyShipments || 0;
  if (n >= 10001) return 'Titanium';
  if (n >= 6001) return 'Diamond';
  if (n >= 3001) return 'Platinum';
  if (n >= 1001) return 'Gold';
  return 'Silver';
};

const TIER_BADGE_STYLES: Record<string, string> = {
  'Silver': 'bg-slate-50 text-slate-700 border-slate-200',
  'Gold': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'Platinum': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Diamond': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Titanium': 'bg-purple-50 text-purple-700 border-purple-200',
};

export const getTierBadgeClass = (tier: string) =>
  `${TIER_BADGE_STYLES[tier] || 'bg-blue-50 text-blue-700 border-blue-200'} px-2.5 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap shadow-sm`;
