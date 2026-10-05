import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, ArrowUp } from 'lucide-react';
import type { RtoRiskResult } from '../../services/rtoRisk';

/** Chip styling per risk level — tinted fill + hairline border in the level's colour. */
const RTO_RISK_CHIP: Record<string, string> = {
  High: 'text-[#DC2626] bg-[#FEF2F2] border-[#FECACA]',
  Medium: 'text-[#7C3AED] bg-[#F5F3FF] border-[#DDD6FE]',
  Low: 'text-[#15803D] bg-[#F0FDF4] border-[#BBF7D0]',
};

/**
 * RTO risk, revealed on demand: a "View RTO Risk" link that turns into
 * "RTO Risk : {LEVEL}" — the level as a tinted chip coloured by risk; High gets
 * an up arrow (risk rising), Low a down arrow (risk falling), Medium no arrow.
 * The click never bubbles, so it can sit inside clickable rows and cards.
 */
export function RtoRiskBadge({ risk, className = '' }: { risk: RtoRiskResult; className?: string }) {
  const [revealed, setRevealed] = useState(false);

  if (!revealed) {
    return (
      <div className={`text-[11px] leading-[16px] ${className}`}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setRevealed(true); }}
          className="font-semibold text-[#4F46E5] underline underline-offset-2 decoration-[#4F46E5]/40 hover:decoration-[#4F46E5] hover:text-[#4338CA] transition-colors"
        >
          View RTO Risk
        </button>
      </div>
    );
  }

  return (
    <div className={`text-[11px] leading-[16px] font-semibold flex items-center gap-1.5 ${className}`}>
      <span className="text-[#475569]">RTO Risk :</span>
      <motion.span
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 24 }}
        title={risk.reasons?.length ? risk.reasons.join(' • ') : undefined}
        className={`inline-flex items-center gap-0.5 h-[18px] px-1.5 rounded-[5px] border text-[10.5px] font-bold uppercase tracking-wide ${RTO_RISK_CHIP[risk.level]}`}
      >
        {risk.level === 'High' && <ArrowUp className="w-3 h-3" strokeWidth={2.75} />}
        {risk.level === 'Low' && <ArrowDown className="w-3 h-3" strokeWidth={2.75} />}
        <span className="border-b border-dotted border-current leading-[12px]">{risk.level}</span>
      </motion.span>
    </div>
  );
}
