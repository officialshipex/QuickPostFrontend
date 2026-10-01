import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowUp, ChevronDown, GripVertical, Lock, PanelBottom, PanelTop, Plus, Trash2 } from 'lucide-react';
import { createContentSection } from '../defaultConfig';
import { isSectionVisible } from '../sectionVisibility';
import type { ContentSectionType, TrackingSection } from '../types';
import { Switch } from './controls';
import { TXT } from './styles';
import { SectionEditor } from './ContentPanel';
import type { PanelProps } from './panelTypes';
import { ADDABLE_SECTIONS, SECTION_META, SINGLETON_SECTIONS } from './sectionMeta';

type GoToTab = (tab: 'hero' | 'tracking' | 'branding' | 'header' | 'footer') => void;

function LockedRow({ icon: Icon, label, description, checked, onChange, onEdit }: {
  icon: React.ElementType; label: string; description: string; checked: boolean; onChange: (v: boolean) => void; onEdit: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC]">
      <span className="w-5 flex justify-center text-[#CBD5E1]" title="Fixed position"><Lock className="w-3.5 h-3.5" /></span>
      <span className="w-8 h-8 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-[#64748B] shrink-0"><Icon className="w-4 h-4" /></span>
      <button type="button" onClick={onEdit} className="flex-1 min-w-0 text-left">
        <span className={`${TXT.label} text-[#0F172A] block`}>{label}</span>
        <span className="text-[11px] text-[#94A3B8] block truncate">{description}</span>
      </button>
      <Switch checked={checked} onChange={onChange} label={`Show ${label}`} />
    </div>
  );
}

export function SectionsPanel({ config, update, setSections, onError, goToTab }: PanelProps & { goToTab: GoToTab }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [handleId, setHandleId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const sections = config.sections;

  const move = (id: string, to: number) => {
    setSections((list) => {
      const from = list.findIndex((s) => s.id === id);
      if (from < 0 || to < 0 || to >= list.length || from === to) return list;
      const next = [...list];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const setVisible = (section: TrackingSection, visible: boolean) => {
    if (section.type === 'hero') return update('hero', { enabled: visible });
    if (section.type === 'shipmentDetails') return update('tracking', { showShipmentDetails: visible, showPackageDetails: visible });
    setSections((list) => list.map((s) => (s.id === section.id ? { ...s, enabled: visible } : s)));
  };

  const replaceSection = (section: TrackingSection) => setSections((list) => list.map((s) => (s.id === section.id ? section : s)));

  const removeSection = (id: string) => {
    setSections((list) => list.filter((s) => s.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const addSection = (type: ContentSectionType) => {
    const section = createContentSection(type);
    setSections((list) => [...list, section]);
    setExpandedId(section.id);
    setAddOpen(false);
  };

  const summary = (s: TrackingSection) => {
    if (s.type === 'hero') return config.hero.title || SECTION_META.hero.description;
    if (s.data && 'heading' in s.data && s.data.heading) return s.data.heading;
    return SECTION_META[s.type].description;
  };

  return (
    <div className="py-4 space-y-4">
      <div>
        <p className={`${TXT.title} text-[#0F172A]`}>Page Sections</p>
        <p className="text-[11.5px] text-[#94A3B8] mt-0.5 leading-snug">Drag to reorder, toggle to show or hide, and expand a section to edit its content.</p>
      </div>

      <div className="space-y-2">
        <LockedRow icon={PanelTop} label="Header" description="Always at the top" checked={config.header.enabled} onChange={(enabled) => update('header', { enabled })} onEdit={() => goToTab('header')} />

        {sections.map((s, idx) => {
          const meta = SECTION_META[s.type];
          const visible = isSectionVisible(config, s);
          const isCore = s.type === 'hero' || s.type === 'tracking' || s.type === 'shipmentDetails';
          const expanded = expandedId === s.id;
          return (
            <div
              key={s.id}
              draggable={handleId === s.id}
              onDragStart={(e) => { setDragId(s.id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', s.id); }}
              onDragOver={(e) => { e.preventDefault(); if (dragId && dragId !== s.id) move(dragId, idx); }}
              onDragEnd={() => { setDragId(null); setHandleId(null); }}
              onDrop={(e) => e.preventDefault()}
              className={`rounded-xl border bg-white transition-shadow ${dragId === s.id ? 'opacity-60 border-[#00A86B] shadow-lg' : expanded ? 'border-[#00A86B]/40 shadow-sm' : 'border-[#E2E8F0]'}`}
            >
              <div className="flex items-center gap-2 sm:gap-3 px-3 py-2.5">
                <span
                  onMouseDown={() => setHandleId(s.id)}
                  onMouseUp={() => setHandleId(null)}
                  className="w-5 flex justify-center text-[#94A3B8] hover:text-[#0F172A] cursor-grab active:cursor-grabbing shrink-0"
                  title="Drag to reorder"
                  aria-hidden
                >
                  <GripVertical className="w-4 h-4" />
                </span>
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${visible ? 'bg-[#F0FDF4] text-[#00A86B]' : 'bg-[#F1F5F9] text-[#94A3B8]'}`}>
                  <meta.icon className="w-4 h-4" />
                </span>
                <button type="button" onClick={() => setExpandedId(expanded ? null : s.id)} className="flex-1 min-w-0 text-left">
                  <span className={`${TXT.label} block ${visible ? 'text-[#0F172A]' : 'text-[#94A3B8]'}`}>{meta.label}</span>
                  <span className="text-[11px] text-[#94A3B8] block truncate">{summary(s)}</span>
                </button>
                <div className="hidden sm:flex flex-col -my-1">
                  <button type="button" onClick={() => move(s.id, idx - 1)} disabled={idx === 0} className="p-0.5 text-[#94A3B8] hover:text-[#0F172A] disabled:opacity-30" aria-label={`Move ${meta.label} up`}><ArrowUp className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => move(s.id, idx + 1)} disabled={idx === sections.length - 1} className="p-0.5 text-[#94A3B8] hover:text-[#0F172A] disabled:opacity-30" aria-label={`Move ${meta.label} down`}><ArrowDown className="w-3.5 h-3.5" /></button>
                </div>
                <Switch checked={visible} onChange={(v) => setVisible(s, v)} disabled={s.type === 'tracking'} label={`Show ${meta.label}`} />
                <button type="button" onClick={() => setExpandedId(expanded ? null : s.id)} className="p-1 text-[#94A3B8] hover:text-[#0F172A]" aria-label={expanded ? 'Collapse' : 'Edit section'} aria-expanded={expanded}>
                  <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </button>
              </div>

              <AnimatePresence initial={false}>
                {expanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="px-4 pb-4 pt-3 border-t border-[#F1F5F9] space-y-3">
                      {/* Touch-friendly reordering on small screens */}
                      <div className="flex sm:hidden items-center gap-2">
                        <button type="button" onClick={() => move(s.id, idx - 1)} disabled={idx === 0} className="h-8 px-3 rounded-lg border border-[#E2E8F0] text-[12px] font-semibold text-[#475569] flex items-center gap-1 disabled:opacity-40"><ArrowUp className="w-3.5 h-3.5" /> Move up</button>
                        <button type="button" onClick={() => move(s.id, idx + 1)} disabled={idx === sections.length - 1} className="h-8 px-3 rounded-lg border border-[#E2E8F0] text-[12px] font-semibold text-[#475569] flex items-center gap-1 disabled:opacity-40"><ArrowDown className="w-3.5 h-3.5" /> Move down</button>
                      </div>
                      {s.type === 'tracking' && <p className="text-[11.5px] text-[#94A3B8]">The tracking section is required and cannot be hidden.</p>}
                      <SectionEditor section={s} onChange={replaceSection} onError={onError} goToTab={goToTab} />
                      {!isCore && (
                        <div className="pt-1 flex justify-end">
                          <button type="button" onClick={() => removeSection(s.id)} className="text-[12px] font-semibold text-red-600 hover:text-red-700 flex items-center gap-1.5">
                            <Trash2 className="w-3.5 h-3.5" /> Remove section
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        <LockedRow icon={PanelBottom} label="Footer" description="Always at the bottom" checked={config.footer.enabled} onChange={(enabled) => update('footer', { enabled })} onEdit={() => goToTab('footer')} />
      </div>

      {/* Add section */}
      <div>
        <button
          type="button"
          onClick={() => setAddOpen((o) => !o)}
          className={`w-full h-10 rounded-xl border border-dashed text-[12.5px] font-semibold flex items-center justify-center gap-1.5 transition-colors ${addOpen ? 'border-[#00A86B] text-[#00A86B] bg-[#F0FDF4]' : 'border-[#CBD5E1] text-[#475569] hover:border-[#00A86B] hover:text-[#00A86B]'}`}
          aria-expanded={addOpen}
        >
          <Plus className={`w-4 h-4 transition-transform ${addOpen ? 'rotate-45' : ''}`} /> Add Section
        </button>
        <AnimatePresence>
          {addOpen && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }} className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ADDABLE_SECTIONS.map((type) => {
                const meta = SECTION_META[type];
                const exists = SINGLETON_SECTIONS.includes(type) && sections.some((s) => s.type === type);
                return (
                  <button
                    key={type}
                    type="button"
                    disabled={exists}
                    onClick={() => addSection(type)}
                    className="flex items-start gap-2.5 p-2.5 rounded-lg border border-[#E2E8F0] text-left hover:border-[#00A86B] hover:bg-[#F0FDF4]/60 transition-colors disabled:opacity-45 disabled:hover:border-[#E2E8F0] disabled:hover:bg-transparent disabled:cursor-not-allowed"
                  >
                    <span className="w-7 h-7 rounded-md bg-[#F1F5F9] text-[#475569] flex items-center justify-center shrink-0"><meta.icon className="w-3.5 h-3.5" /></span>
                    <span className="min-w-0">
                      <span className="text-[12px] font-semibold text-[#0F172A] block">{meta.label}</span>
                      <span className="text-[10.5px] text-[#94A3B8] block leading-snug">{exists ? 'Already on the page' : meta.description}</span>
                    </span>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
