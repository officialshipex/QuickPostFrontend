import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft, Check, CheckCircle2, ChevronRight, Copy, ExternalLink, Eye, Globe, Info, LayoutList, Loader2,
  Palette, PanelBottom, PanelTop, PackageSearch, Pencil, Rocket, Sparkles, X,
} from 'lucide-react';
import { AdminLayout } from '../../../../components/admin/layout/AdminLayout';
import { useAdminTab } from '../../../../context/AdminUserContext';
import { useToast } from '../../../../hooks/useToast';
import { Toast } from '../../../../components/ui/Toast';
import { TableLoader } from '../../../../components/ui/TableLoader';
import { ShineButton } from '../../../../components/ui/ShineButton';
import { copyToClipboard } from '../../../../utils/clipboard';
import { brandedTrackingService, getPublicTrackingUrl } from '../trackingService';
import type { PreviewScenario } from '../previewData';
import type { TrackingPageConfig, TrackingSection } from '../types';
import { BrandingPanel } from './BrandingPanel';
import { HeaderPanel } from './HeaderPanel';
import { HeroPanel } from './HeroPanel';
import { TrackingPanel } from './TrackingPanel';
import { SectionsPanel } from './SectionsPanel';
import { FooterPanel } from './FooterPanel';
import { PreviewFrame, PreviewToolbar, type PreviewDevice } from './PreviewPanel';
import type { ConfigGroupKey } from './panelTypes';

type TabId = 'branding' | 'header' | 'hero' | 'tracking' | 'sections' | 'footer';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'branding', label: 'Branding', icon: Palette },
  { id: 'header', label: 'Header', icon: PanelTop },
  { id: 'hero', label: 'Hero', icon: Sparkles },
  { id: 'tracking', label: 'Tracking', icon: PackageSearch },
  { id: 'sections', label: 'Sections', icon: LayoutList },
  { id: 'footer', label: 'Footer', icon: PanelBottom },
];

/** Comparable snapshot of a config, ignoring persistence metadata. */
const fingerprint = (c: TrackingPageConfig | null) => {
  if (!c) return '';
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { status, publishedAt, updatedAt, ...rest } = c;
  return JSON.stringify(rest);
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function useViewportHeight() {
  const [h, setH] = useState(() => window.innerHeight);
  useEffect(() => {
    const onResize = () => setH(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return h;
}

export function BrandedTrackingBuilder() {
  const navigate = useNavigate();
  const { currentUserId, loadingAdminTab } = useAdminTab();
  const { toast, showToast, closeToast } = useToast(3500);
  const viewportHeight = useViewportHeight();

  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<TrackingPageConfig | null>(null);
  const [saved, setSaved] = useState<TrackingPageConfig | null>(null);
  const [published, setPublished] = useState<TrackingPageConfig | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('branding');
  const [device, setDevice] = useState<PreviewDevice>('desktop');
  const [scenario, setScenario] = useState<PreviewScenario>('inTransit');
  const [previewKey, setPreviewKey] = useState(0);
  const [fullPreview, setFullPreview] = useState(false);
  const [mobilePane, setMobilePane] = useState<'edit' | 'preview'>('edit');
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [confirmUnpublish, setConfirmUnpublish] = useState(false);
  const [copied, setCopied] = useState(false);

  /* ── Load ── */
  useEffect(() => {
    if (loadingAdminTab) return;
    let cancelled = false;
    brandedTrackingService
      .load(currentUserId, '')
      .then(({ draft, published: pub }) => {
        if (cancelled) return;
        setConfig(draft);
        setSaved(draft);
        setPublished(pub);
      })
      .catch(() => {
        if (!cancelled) showToast('error', 'Could not load your tracking page settings. Please refresh and try again.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [loadingAdminTab, currentUserId, showToast]);

  /* ── Dirty tracking ── */
  const currentPrint = useMemo(() => fingerprint(config), [config]);
  const savedPrint = useMemo(() => fingerprint(saved), [saved]);
  const publishedPrint = useMemo(() => fingerprint(published), [published]);
  const isDirty = !!config && currentPrint !== savedPrint;
  const isPublished = !!published;
  const hasUnpublishedChanges = isPublished && currentPrint !== publishedPrint;

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  /* ── Editing helpers ── */
  const update = useCallback(<K extends ConfigGroupKey>(key: K, patch: Partial<TrackingPageConfig[K]>) => {
    setConfig((c) => (c ? { ...c, [key]: { ...c[key], ...patch } } : c));
  }, []);

  const setSections = useCallback((updater: (s: TrackingSection[]) => TrackingSection[]) => {
    setConfig((c) => (c ? { ...c, sections: updater(c.sections) } : c));
  }, []);

  const onError = useCallback((msg: string) => showToast('error', msg), [showToast]);

  const goToTab = (tab: TabId) => {
    setActiveTab(tab);
    setMobilePane('edit');
  };

  /* ── Validation ── */
  const validate = async (c: TrackingPageConfig): Promise<string | null> => {
    if (!c.store.name.trim()) return 'Please enter your store name.';
    if (c.store.slug.length < 3) return 'Tracking page URL must be at least 3 characters.';
    if (c.store.supportEmail.trim() && !EMAIL_RE.test(c.store.supportEmail.trim())) return 'Please enter a valid support email.';
    const phone = c.store.supportPhone.replace(/\D/g, '');
    if (c.store.supportPhone.trim() && (phone.length < 10 || phone.length > 13)) return 'Please enter a valid support phone number.';
    const wa = c.store.whatsappNumber.replace(/\D/g, '');
    if (c.store.whatsappNumber.trim() && (wa.length < 10 || wa.length > 13)) return 'Please enter a valid WhatsApp number.';
    if (!(await brandedTrackingService.isSlugAvailable(currentUserId, c.store.slug))) return 'This tracking page URL is already taken. Please choose another.';
    return null;
  };

  const runValidation = async (c: TrackingPageConfig) => {
    const error = await validate(c);
    if (error) {
      showToast('error', error);
      goToTab('branding');
      return false;
    }
    return true;
  };

  /* ── Actions ── */
  const handleSave = async () => {
    if (!config || saving) return;
    setSaving(true);
    try {
      if (!(await runValidation(config))) return;
      const next = await brandedTrackingService.saveDraft(currentUserId, { ...config, status: isPublished ? 'published' : 'draft' });
      setConfig(next);
      setSaved(next);
      showToast('success', isPublished ? 'Changes saved. Publish to make them live for customers.' : 'Changes saved as draft.');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!config || publishing) return;
    setPublishing(true);
    try {
      if (!(await runValidation(config))) return;
      const result = await brandedTrackingService.publish(currentUserId, config);
      setConfig(result.draft);
      setSaved(result.draft);
      setPublished(result.published);
      showToast('success', isPublished ? 'Changes published. Customers now see the updated page.' : 'Your branded tracking page is live!');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to publish. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    setConfirmUnpublish(false);
    setPublishing(true);
    try {
      const result = await brandedTrackingService.unpublish(currentUserId);
      // Keep any unsaved edits in the editor; only the publish state changes.
      setConfig((c) => (c ? { ...c, status: 'draft', publishedAt: undefined } : result.draft));
      setSaved(result.draft);
      setPublished(null);
      showToast('info', 'Branded page unpublished. Customers will see the standard QuickPost tracking page.');
    } catch {
      showToast('error', 'Failed to unpublish. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  const handleDiscard = () => {
    if (saved) setConfig(saved);
    showToast('info', 'Unsaved changes discarded.');
  };

  const publicUrl = config ? getPublicTrackingUrl(published?.store.slug || config.store.slug) : '';

  const handleCopyUrl = async () => {
    await copyToClipboard(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  /* ── Render ── */
  if (loading || !config) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <div className="relative w-20 h-20"><TableLoader /></div>
          <p className="text-[13px] font-semibold text-[#94A3B8]">Loading Branded Tracking Page…</p>
        </div>
      </AdminLayout>
    );
  }

  const previewHeight = Math.max(520, viewportHeight - 210);
  const panelProps = { config, update, setSections, onError };

  const statusChip = isPublished ? (
    <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-[#F0FDF4] border border-[#00A86B]/25 text-[11px] font-bold text-[#00A86B]">
      <span className="w-1.5 h-1.5 rounded-full bg-[#00A86B]" /> Published
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] text-[11px] font-bold text-[#64748B]">
      <span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]" /> Draft
    </span>
  );

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto pb-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[12px] font-semibold text-[#94A3B8] mb-3" aria-label="Breadcrumb">
          <button type="button" onClick={() => navigate('/user/vas/auto-secure')} className="inline-flex items-center gap-1 hover:text-[#00A86B] transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Value Added Services
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#475569]">Branded Tracking Page</span>
        </nav>

        {/* Page header */}
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4 mb-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-[20px] font-bold text-[#0F172A]">Branded Tracking Page</h1>
              {statusChip}
              {isDirty ? (
                <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-[#FFFBEB] border border-[#D97706]/25 text-[11px] font-bold text-[#B45309]">Unsaved changes</span>
              ) : hasUnpublishedChanges ? (
                <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-[#EFF6FF] border border-[#2563EB]/20 text-[11px] font-bold text-[#2563EB]">Saved · not published</span>
              ) : null}
            </div>
            <p className="text-[13px] text-[#64748B] mt-1">Create a fully branded tracking experience for your customers with your own logo, colors, content and layout.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {isDirty && (
              <button type="button" onClick={handleDiscard} className="h-10 px-3 rounded-lg text-[12px] font-semibold text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors">
                Discard
              </button>
            )}
            <button type="button" onClick={() => setFullPreview(true)} className="h-10 px-4 rounded-lg bg-white border border-[#E2E8F0] text-[12px] font-semibold text-[#475569] hover:bg-[#F8FAFC] transition-colors flex items-center gap-1.5">
              <Eye className="w-4 h-4" /> Preview
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="h-10 px-4 rounded-lg bg-white border border-[#00A86B] text-[12px] font-semibold text-[#00A86B] hover:bg-[#F0FDF4] transition-colors flex items-center gap-1.5 disabled:border-[#E2E8F0] disabled:text-[#94A3B8] disabled:bg-white disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : !isDirty ? <Check className="w-4 h-4" /> : null}
              {saving ? 'Saving…' : isDirty ? 'Save Changes' : 'Saved'}
            </button>
            <ShineButton
              type="button"
              onClick={handlePublish}
              disabled={publishing || (isPublished && !hasUnpublishedChanges)}
              className="h-10 px-5 rounded-lg bg-[#00A86B] hover:bg-[#009B63] text-white text-[12px] font-semibold shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
              {isPublished ? (hasUnpublishedChanges ? 'Publish Changes' : 'Published') : 'Publish'}
            </ShineButton>
          </div>
        </div>

        {/* Live status banner */}
        {isPublished ? (
          <div className="mb-4 flex flex-col md:flex-row md:items-center gap-3 px-4 py-3 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0]">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <CheckCircle2 className="w-4 h-4 text-[#00A86B] shrink-0" />
              <p className="text-[12.5px] text-[#14532D] min-w-0">
                <span className="font-semibold">Live at </span>
                <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#00A86B] hover:underline break-all">{publicUrl.replace(/^https?:\/\//, '')}</a>
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0 pl-6 md:pl-0">
              <button type="button" onClick={handleCopyUrl} className="text-[12px] font-semibold text-[#00A86B] hover:underline inline-flex items-center gap-1">
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? 'Copied' : 'Copy link'}
              </button>
              <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="text-[12px] font-semibold text-[#00A86B] hover:underline inline-flex items-center gap-1">
                <ExternalLink className="w-3.5 h-3.5" /> Open
              </a>
              <button type="button" onClick={() => setConfirmUnpublish(true)} className="text-[12px] font-semibold text-red-600 hover:underline">Unpublish</button>
            </div>
          </div>
        ) : (
          <div className="mb-4 flex items-start gap-2.5 px-4 py-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
            <Info className="w-4 h-4 text-[#64748B] shrink-0 mt-0.5" />
            <p className="text-[12.5px] text-[#475569]">
              Your customers currently see the standard QuickPost tracking page. Customise your page, then <span className="font-semibold text-[#0F172A]">Publish</span> to switch them to your branded experience.
            </p>
          </div>
        )}

        {/* Mobile / tablet: edit ↔ preview switch */}
        <div className="lg:hidden flex p-1 rounded-lg bg-[#F1F5F9] gap-1 mb-4">
          {([['edit', Pencil, 'Edit'], ['preview', Eye, 'Live Preview']] as const).map(([id, Icon, label]) => (
            <button key={id} type="button" onClick={() => setMobilePane(id)} className={`flex-1 h-9 rounded-md text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all ${mobilePane === id ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B]'}`}>
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)] xl:grid-cols-[420px_minmax(0,1fr)] gap-4 items-start">
          {/* ── Editor ── */}
          <div
            className={`${mobilePane === 'edit' ? 'block' : 'hidden'} lg:block bg-white border border-[#E2E8F0] rounded-2xl min-w-0 lg:max-h-[var(--pane-h)] lg:overflow-y-auto`}
            style={{ '--pane-h': `${previewHeight + 92}px` } as React.CSSProperties}
          >
            <div className="sticky top-0 z-10 bg-white rounded-t-2xl border-b border-[#E2E8F0] px-2 pt-2">
              <div className="grid grid-cols-6 -mb-px" role="tablist" aria-label="Customisation sections">
                {TABS.map((tab) => {
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setActiveTab(tab.id)}
                      className={`min-w-0 h-14 px-1 flex flex-col items-center justify-center gap-1 text-[11px] font-semibold border-b-2 transition-colors ${active ? 'border-[#00A86B] text-[#00A86B]' : 'border-transparent text-[#64748B] hover:text-[#0F172A]'}`}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span className="truncate max-w-full">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="px-5"
                role="tabpanel"
              >
                {activeTab === 'branding' && <BrandingPanel {...panelProps} />}
                {activeTab === 'header' && <HeaderPanel {...panelProps} />}
                {activeTab === 'hero' && <HeroPanel {...panelProps} />}
                {activeTab === 'tracking' && <TrackingPanel {...panelProps} />}
                {activeTab === 'sections' && <SectionsPanel {...panelProps} goToTab={goToTab} />}
                {activeTab === 'footer' && <FooterPanel {...panelProps} />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── Live preview ── */}
          <div className={`${mobilePane === 'preview' ? 'block' : 'hidden'} lg:block bg-white border border-[#E2E8F0] rounded-2xl p-4 min-w-0`}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="relative flex w-2 h-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[#00A86B] opacity-60 animate-ping" />
                  <span className="relative inline-flex w-2 h-2 rounded-full bg-[#00A86B]" />
                </span>
                <h2 className="text-[14px] font-semibold text-[#0F172A]">Live Preview</h2>
              </div>
              <PreviewToolbar device={device} onDevice={setDevice} scenario={scenario} onScenario={setScenario} onReplay={() => setPreviewKey((k) => k + 1)} onExpand={() => setFullPreview(true)} />
            </div>
            <PreviewFrame key={previewKey} config={config} device={device} scenario={scenario} height={previewHeight} />
            <p className="text-[11px] text-[#94A3B8] mt-2.5 flex items-center gap-1.5">
              <Globe className="w-3 h-3" /> Preview uses a sample shipment. Customers see live tracking from their AWB or order ID.
            </p>
          </div>
        </div>
      </div>

      {/* ── Full-screen preview ── */}
      <AnimatePresence>
        {fullPreview && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-[#0F172A]/60 backdrop-blur-sm flex flex-col" role="dialog" aria-modal="true" aria-label="Full-screen preview">
            <div className="bg-white border-b border-[#E2E8F0] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-[#0F172A]">Preview · {config.store.name}</p>
                <p className="text-[11.5px] text-[#94A3B8]">{isDirty ? 'Showing unsaved changes' : 'Showing saved version'}</p>
              </div>
              <div className="flex items-center gap-2">
                <PreviewToolbar device={device} onDevice={setDevice} scenario={scenario} onScenario={setScenario} />
                <button type="button" onClick={() => setFullPreview(false)} className="w-10 h-10 rounded-lg border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] flex items-center justify-center" aria-label="Close preview">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 md:p-6" onClick={(e) => { if (e.target === e.currentTarget) setFullPreview(false); }}>
              <div className={`mx-auto ${device === 'desktop' ? 'max-w-[1320px]' : 'max-w-[440px]'}`}>
                <PreviewFrame config={config} device={device} scenario={scenario} height={Math.max(480, viewportHeight - 170)} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Unpublish confirmation ── */}
      <AnimatePresence>
        {confirmUnpublish && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirmUnpublish(false)} className="fixed inset-0 bg-[#0F172A]/50 backdrop-blur-sm z-[200]" />
            <div className="fixed inset-0 flex items-center justify-center z-[201] p-4 pointer-events-none">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: 'spring', duration: 0.4 }} className="w-full max-w-[400px] bg-white rounded-2xl shadow-2xl p-6 pointer-events-auto border border-[#E2E8F0]">
                <h2 className="text-[15px] font-bold text-[#0F172A] mb-1.5">Unpublish branded tracking page?</h2>
                <p className="text-[13px] text-[#64748B] leading-relaxed mb-5">
                  Customers will be switched back to the standard QuickPost tracking page. Your design is kept as a draft and can be published again anytime.
                </p>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setConfirmUnpublish(false)} className="flex-1 h-10 rounded-full border border-[#E2E8F0] text-[#64748B] hover:text-[#334155] hover:bg-[#F8FAFC] text-[13px] font-bold transition-all">
                    Keep Live
                  </button>
                  <button type="button" onClick={handleUnpublish} className="flex-1 h-10 rounded-full bg-red-600 hover:bg-red-700 text-white text-[13px] font-bold shadow-sm transition-all">
                    Unpublish
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <Toast toast={toast} onClose={closeToast} />
    </AdminLayout>
  );
}
