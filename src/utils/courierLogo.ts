export const getCourierLogo = (partner: string) => {
  const p = (partner || '').toUpperCase();
  if (p.includes('DELHIVERY')) return '/brands/delhivery.png';
  if (p.includes('BLUEDART') || p.includes('BLUE DART')) return '/brands/bluedart.png';
  if (p.includes('EKART')) return '/brands/ekart.png';
  if (p.includes('XPRESSBEES')) return '/brands/xpressbees.png';
  if (p.includes('SHREE MARUTI')) return '/brands/shree_maruti.jpg';
  if (p.includes('DTDC')) return '/brands/dtdc.png';
  if (p.includes('SHADOWFAX')) return '/brands/shadowfax.png';
  if (p.includes('AMAZON')) return '/brands/amazon.png';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(partner || '?')}&background=f8fafc&color=0f172a&bold=true&font-size=0.4`;
};

/** Same lookup for rate calculators: null instead of an avatar when there is no logo, so the caller can show
    its own fallback. Also matches "Shree"/"Maruti" alone and Losung. */
export function getCourierBrandLogo(name = ''): string | null {
  const n = name.toLowerCase();
  if (n.includes('shree') || n.includes('maruti')) return '/brands/shree_maruti.jpg';
  if (n.includes('losung') || n.includes('lousung')) return '/brands/losung.jpg';
  const logo = getCourierLogo(name);
  return logo.startsWith('/brands/') ? logo : null;
}
