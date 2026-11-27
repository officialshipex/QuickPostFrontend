import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Briefcase, X } from 'lucide-react';
import { useAdminTab } from '../../../context/AdminUserContext';
import { useSalesTicketAlerts } from '../../../hooks/useSalesTicketAlerts';

/* Sales employees: pop-up (with chime, from the hook) when a support ticket is transferred to the Sales team.
   Mounted once in the header so it works on every Sales panel page. */
export function SalesTicketAlert() {
  const { isSalesEmployee } = useAdminTab();
  const navigate = useNavigate();
  const { fresh, dismiss } = useSalesTicketAlerts(isSalesEmployee);
  const first = fresh[0];

  return createPortal(
    <AnimatePresence>
      {first && (
        <motion.div role="alert" aria-live="assertive"
          initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          className="fixed z-[700] bottom-4 right-4 left-4 sm:left-auto sm:w-[360px] bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_24px_60px_-18px_rgba(15,23,42,0.4)] p-4">
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-xl bg-[#F0FDF4] flex items-center justify-center shrink-0"><Briefcase className="w-5 h-5 text-[#00A86B]" /></span>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-bold text-[#0F172A]">
                {fresh.length > 1 ? `${fresh.length} new tickets for Sales` : 'New ticket for Sales'}
              </div>
              <div className="mt-0.5 text-[12.5px] text-[#475569] truncate">#{first.ticketNumber} · {first.fullname || first.company || first.email}</div>
              <div className="text-[12px] text-[#94A3B8] truncate">{first.subcategory || first.category}</div>
            </div>
            <button type="button" onClick={dismiss} aria-label="Dismiss" className="w-7 h-7 rounded-full flex items-center justify-center text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#0F172A]">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={dismiss} className="flex-1 h-9 rounded-lg border border-[#E2E8F0] text-[12.5px] font-semibold text-[#475569] hover:bg-[#F8FAFC]">Later</button>
            <button type="button" onClick={() => { dismiss(); navigate(`/admin/sales-tickets${first ? `?open=${first._id}` : ''}`); }}
              className="flex-1 h-9 rounded-lg bg-[#00A86B] hover:bg-[#00965F] text-white text-[12.5px] font-bold">Open ticket</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
