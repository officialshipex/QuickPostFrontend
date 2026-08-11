import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Clock, Activity, User, MessageSquare, Link, PackageSearch, CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  ndrHistory: any[];
}

const formatDate = (date: string | null, source: string) => {
  if (!date) return 'N/A';
  let d = new Date(date);
  if (source !== 'ShipexIndia') d = new Date(d.getTime() - 5.5 * 3600 * 1000);
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('en-US', { month: 'short' });
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const amPm = hours < 12 ? 'AM' : 'PM';
  hours = hours % 12 || 12;
  return `${day}-${month}-${year}, ${String(hours).padStart(2, '0')}:${minutes} ${amPm}`;
};

const TAB_LABELS: Record<string, string> = { ndr1: 'NDR Attempt 1', ndr2: 'NDR Attempt 2', ndr3: 'NDR Attempt 3', all: 'Full History' };

export function NdrStatusModal({ isOpen, setIsOpen, ndrHistory }: Props) {
  const [activeTab, setActiveTab] = useState('all');
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
    document.addEventListener('keydown', fn);
    return () => { document.body.style.overflow = orig; document.removeEventListener('keydown', fn); };
  }, [isOpen, setIsOpen]);

  const onBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === modalRef.current) setIsOpen(false);
  }, [setIsOpen]);

  if (!isOpen) return null;

  const tabKeys = ['ndr1', 'ndr2', 'ndr3', 'all'];
  const groupsToShow = activeTab === 'all' ? ndrHistory : [ndrHistory[['ndr1', 'ndr2', 'ndr3'].indexOf(activeTab)]];

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center md:bg-black/50 bg-white md:p-0 z-[200]" tabIndex={-1} ref={modalRef} onClick={onBackdropClick}>
      <div className="bg-white md:rounded-2xl md:shadow-2xl w-full h-full md:h-auto md:max-w-3xl md:max-h-[90vh] flex flex-col md:border md:border-[#E2E8F0] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 border-b border-[#E2E8F0] bg-[#F8FAFC] shrink-0">
          <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
            <div className="w-9 h-9 md:w-8 md:h-8 rounded-xl md:rounded-lg bg-[#00A86B]/10 flex items-center justify-center shrink-0">
              <Activity className="w-4.5 h-4.5 md:w-4 md:h-4 text-[#00A86B]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-[14px] font-bold text-[#0F172A]">NDR Status History</h2>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                <span className="md:hidden">{ndrHistory?.length || 0} attempt{ndrHistory?.length === 1 ? '' : 's'} recorded</span>
                <span className="hidden md:inline">Detailed tracking and action history for undelivered reports</span>
              </p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-white transition-colors shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 md:p-5 flex flex-col gap-3 md:gap-4 overflow-hidden flex-1 min-h-0">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 md:gap-2 shrink-0 overflow-x-auto no-scrollbar bg-[#F8FAFC] md:bg-transparent p-1 md:p-0 rounded-xl md:rounded-none">
            {tabKeys.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 md:py-1.5 rounded-lg text-[12px] font-bold transition-all border whitespace-nowrap shrink-0 ${activeTab === tab ? 'bg-[#00A86B] text-white border-[#00A86B] shadow-sm' : 'bg-white text-[#475569] border-[#E2E8F0] md:hover:bg-[#F8FAFC]'}`}>
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>

          {/* Timeline — desktop table layout */}
          <div className="hidden md:block flex-1 min-h-0 overflow-y-auto">
            {/* Table header */}
            <div className="grid grid-cols-[40px_1fr] items-center sticky top-0 z-10 bg-white pb-2 mb-1">
              <div />
              <div className="grid grid-cols-5 gap-3 px-4 py-2 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider border-b border-[#F1F5F9]">
                <div className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-[#00A86B]" /> Date & Time</div>
                <div className="flex items-center gap-1.5"><Activity className="w-3 h-3 text-[#00A86B]" /> Action</div>
                <div className="flex items-center gap-1.5"><User className="w-3 h-3 text-[#00A86B]" /> Action By</div>
                <div className="flex items-center gap-1.5"><MessageSquare className="w-3 h-3 text-[#00A86B]" /> Remarks</div>
                <div className="flex items-center justify-center gap-1.5"><Link className="w-3 h-3 text-[#00A86B]" /> Source</div>
              </div>
            </div>

            {groupsToShow?.map((group, idx) => {
              if (!group) return null;
              const actions = group.actions || [];
              return (
                <div key={idx} className="mb-4">
                  {actions.length > 0 ? actions.map((item: any, aIdx: number) => (
                    <div key={aIdx} className="relative grid grid-cols-[40px_1fr] items-start mb-2">
                      {/* Timeline dot */}
                      <div className="flex flex-col items-center pt-3">
                        <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center border border-[#E2E8F0] z-10 shadow-sm">
                          <span className="w-2 h-2 rounded-full bg-[#00A86B] block" />
                        </div>
                        {aIdx < actions.length - 1 && <div className="w-[2px] bg-[#E2E8F0] flex-1 mt-1 mb-[-8px]" style={{ minHeight: 24 }} />}
                      </div>
                      {/* Content */}
                      <div className="bg-white rounded-xl border border-[#E2E8F0] px-4 py-3 ml-1 hover:border-[#00A86B]/30 transition-colors">
                        <div className="grid grid-cols-5 gap-3 text-[11px] text-[#475569]">
                          <div className="text-[#0F172A] font-medium">{formatDate(item.date, item.source)}</div>
                          <div><span className="px-2 py-0.5 bg-[#F8FAFC] rounded border border-[#E2E8F0] text-[11px] font-semibold">{item.action}</span></div>
                          <div className="font-medium">{item.source === 'Smartship' ? 'Bluedart' : item.source || '—'}</div>
                          <div className="text-[#64748B]">{item.remark || '—'}</div>
                          <div className="flex items-center justify-center">
                            <span className="text-[10px] font-bold text-[#64748B] bg-[#F8FAFC] px-2 py-0.5 rounded border border-[#E2E8F0]">{item.source || '—'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center text-[#94A3B8] text-xs py-8">No data available for this attempt</div>
                  )}
                </div>
              );
            })}

            {(!ndrHistory || ndrHistory.length === 0) && (
              <div className="text-center text-[#94A3B8] text-xs py-12">No NDR history found</div>
            )}
          </div>

          {/* Timeline — mobile stacked cards, industry-style (Shiprocket/NimbusPost pattern) */}
          <div className="md:hidden flex-1 min-h-0 overflow-y-auto -mx-1 px-1">
            {groupsToShow?.map((group, idx) => {
              if (!group) return null;
              const actions = group.actions || [];
              const attemptNo = activeTab === 'all' ? idx + 1 : ['ndr1', 'ndr2', 'ndr3'].indexOf(activeTab) + 1;
              return (
                <div key={idx} className="mb-4">
                  {activeTab === 'all' && (
                    <div className="flex items-center gap-2 mb-2 px-0.5">
                      <div className="w-5 h-5 rounded-full bg-[#0F172A] text-white text-[10px] font-bold flex items-center justify-center shrink-0">{attemptNo}</div>
                      <span className="text-[11px] font-bold text-[#0F172A] uppercase tracking-wide">Attempt {attemptNo}</span>
                      <span className="text-[10px] font-semibold text-[#94A3B8]">· {actions.length} event{actions.length === 1 ? '' : 's'}</span>
                    </div>
                  )}
                  {actions.length > 0 ? (
                    <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-sm">
                      {actions.map((item: any, aIdx: number) => {
                        const isLast = aIdx === actions.length - 1;
                        return (
                          <div key={aIdx} className="relative flex items-start gap-2.5 px-3 py-3">
                            {/* Timeline dot + connector */}
                            <div className="flex flex-col items-center shrink-0 pt-0.5">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 z-10 shrink-0 ${isLast ? 'bg-[#00A86B] border-[#00A86B]' : 'bg-white border-[#CBD5E1]'}`}>
                                {isLast
                                  ? <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                  : <span className="w-1.5 h-1.5 rounded-full bg-[#CBD5E1] block" />}
                              </div>
                              {!isLast && <div className="w-[2px] bg-[#E2E8F0] flex-1 mt-1" style={{ minHeight: 30 }} />}
                            </div>
                            {/* Content */}
                            <div className="flex-1 min-w-0 pb-0.5">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="px-2 py-0.5 bg-[#F0FDF4] text-[#00A86B] rounded-full text-[11px] font-bold whitespace-nowrap">{item.action}</span>
                                <span className="text-[10px] font-semibold text-[#94A3B8] shrink-0">{item.source === 'Smartship' ? 'Bluedart' : item.source || '—'}</span>
                              </div>
                              <div className="flex items-center gap-1 text-[11px] font-medium text-[#64748B]">
                                <Clock className="w-3 h-3 text-[#94A3B8] shrink-0" />
                                {formatDate(item.date, item.source)}
                              </div>
                              {item.remark && (
                                <div className="text-[12px] font-normal text-[#475569] mt-1.5 bg-[#F8FAFC] rounded-lg px-2.5 py-1.5 leading-relaxed">
                                  {item.remark}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center py-8 bg-white rounded-2xl border border-dashed border-[#E2E8F0]">
                      <PackageSearch className="w-7 h-7 text-[#CBD5E1] mb-2" />
                      <span className="text-[#94A3B8] text-[12px] font-medium">No data available for this attempt</span>
                    </div>
                  )}
                </div>
              );
            })}

            {(!ndrHistory || ndrHistory.length === 0) && (
              <div className="flex flex-col items-center justify-center text-center py-16">
                <PackageSearch className="w-9 h-9 text-[#CBD5E1] mb-2" />
                <span className="text-[#94A3B8] text-[13px] font-medium">No NDR history found</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-4 md:px-5 py-3 md:py-4 border-t border-[#E2E8F0] bg-[#F8FAFC] shrink-0">
          <button onClick={() => setIsOpen(false)} className="w-full md:w-auto px-4 py-2 bg-white border border-[#E2E8F0] text-[#475569] text-[12px] font-bold rounded-lg hover:bg-[#F8FAFC] transition-all">Close</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
