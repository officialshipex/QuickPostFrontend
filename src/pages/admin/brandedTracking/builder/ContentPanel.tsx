import { Plus, Trash2 } from 'lucide-react';
import { newId } from '../defaultConfig';
import type { TrackingSection } from '../types';
import { Field, ImageUpload, Segmented, TextArea, TextInput, ToggleRow } from './controls';
import { TXT } from './styles';
import { ALIGN_OPTIONS } from './sectionMeta';

/** Field editor for a single content block. Core sections are edited in their own tabs. */
export function SectionEditor({ section, onChange, onError, goToTab }: {
  section: TrackingSection;
  onChange: (section: TrackingSection) => void;
  onError: (msg: string) => void;
  goToTab: (tab: 'hero' | 'tracking' | 'branding') => void;
}) {
  const storeHint = (
    <p className={`${TXT.value} text-[#64748B]`}>
      Contact details come from{' '}
      <button type="button" onClick={() => goToTab('branding')} className="text-[#00A86B] font-semibold hover:underline">Branding → Store Details</button>.
    </p>
  );

  switch (section.type) {
    case 'hero':
    case 'tracking':
    case 'shipmentDetails':
      return (
        <p className={`${TXT.value} text-[#64748B]`}>
          Configure this section in the{' '}
          <button type="button" onClick={() => goToTab(section.type === 'hero' ? 'hero' : 'tracking')} className="text-[#00A86B] font-semibold hover:underline">
            {section.type === 'hero' ? 'Hero' : 'Tracking'} tab
          </button>.
        </p>
      );

    case 'imageText': {
      const d = section.data;
      const set = (p: Partial<typeof d>) => onChange({ ...section, data: { ...d, ...p } });
      return (
        <div className="space-y-3">
          <ImageUpload label="Image" aspect="banner" maxKb={800} value={d.image} onChange={(image) => set({ image })} onError={onError} hint="Landscape image, under 800 KB." />
          <Field label="Image Position">
            <Segmented value={d.imagePosition} onChange={(imagePosition) => set({ imagePosition })} options={[{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }]} />
          </Field>
          <Field label="Heading"><TextInput value={d.heading} maxLength={80} onChange={(heading) => set({ heading })} /></Field>
          <Field label="Text"><TextArea value={d.body} maxLength={400} onChange={(body) => set({ body })} /></Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Button Text" hint="Leave blank to hide."><TextInput value={d.buttonText} maxLength={24} onChange={(buttonText) => set({ buttonText })} /></Field>
            <Field label="Button URL"><TextInput value={d.buttonUrl} onChange={(buttonUrl) => set({ buttonUrl })} placeholder="https://" /></Field>
          </div>
        </div>
      );
    }

    case 'promoBanner': {
      const d = section.data;
      const set = (p: Partial<typeof d>) => onChange({ ...section, data: { ...d, ...p } });
      return (
        <div className="space-y-3">
          <Field label="Eyebrow"><TextInput value={d.eyebrow} maxLength={40} onChange={(eyebrow) => set({ eyebrow })} placeholder="Exclusive for you" /></Field>
          <Field label="Heading"><TextInput value={d.heading} maxLength={60} onChange={(heading) => set({ heading })} /></Field>
          <Field label="Text"><TextArea rows={2} value={d.body} maxLength={200} onChange={(body) => set({ body })} /></Field>
          <Field label="Coupon Code" hint="Customers can tap to copy. Leave blank to hide.">
            <TextInput value={d.couponCode} maxLength={20} onChange={(couponCode) => set({ couponCode: couponCode.toUpperCase().replace(/\s/g, '') })} placeholder="TRACK10" />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Button Text"><TextInput value={d.buttonText} maxLength={24} onChange={(buttonText) => set({ buttonText })} /></Field>
            <Field label="Button URL"><TextInput value={d.buttonUrl} onChange={(buttonUrl) => set({ buttonUrl })} placeholder="https://yourstore.com" /></Field>
          </div>
          <ImageUpload label="Background Image (optional)" aspect="banner" maxKb={800} value={d.image} onChange={(image) => set({ image })} onError={onError} hint="Without an image the banner uses your brand colors." />
        </div>
      );
    }

    case 'customText': {
      const d = section.data;
      const set = (p: Partial<typeof d>) => onChange({ ...section, data: { ...d, ...p } });
      return (
        <div className="space-y-3">
          <Field label="Heading"><TextInput value={d.heading} maxLength={80} onChange={(heading) => set({ heading })} /></Field>
          <Field label="Text"><TextArea rows={4} value={d.body} maxLength={1000} onChange={(body) => set({ body })} /></Field>
          <Field label="Alignment"><Segmented value={d.alignment} onChange={(alignment) => set({ alignment })} options={ALIGN_OPTIONS} /></Field>
        </div>
      );
    }

    case 'cta': {
      const d = section.data;
      const set = (p: Partial<typeof d>) => onChange({ ...section, data: { ...d, ...p } });
      return (
        <div className="space-y-3">
          <Field label="Heading"><TextInput value={d.heading} maxLength={60} onChange={(heading) => set({ heading })} /></Field>
          <Field label="Text"><TextArea rows={2} value={d.body} maxLength={200} onChange={(body) => set({ body })} /></Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Button Text"><TextInput value={d.buttonText} maxLength={24} onChange={(buttonText) => set({ buttonText })} /></Field>
            <Field label="Button URL"><TextInput value={d.buttonUrl} onChange={(buttonUrl) => set({ buttonUrl })} placeholder="https://" /></Field>
          </div>
        </div>
      );
    }

    case 'video': {
      const d = section.data;
      const set = (p: Partial<typeof d>) => onChange({ ...section, data: { ...d, ...p } });
      return (
        <div className="space-y-3">
          <Field label="Heading"><TextInput value={d.heading} maxLength={80} onChange={(heading) => set({ heading })} /></Field>
          <Field label="Video URL" hint="YouTube, Vimeo or a direct .mp4 link."><TextInput value={d.url} onChange={(url) => set({ url })} placeholder="https://www.youtube.com/watch?v=…" /></Field>
        </div>
      );
    }

    case 'faq': {
      const d = section.data;
      const set = (p: Partial<typeof d>) => onChange({ ...section, data: { ...d, ...p } });
      const setItem = (id: string, p: { question?: string; answer?: string }) => set({ items: d.items.map((i) => (i.id === id ? { ...i, ...p } : i)) });
      return (
        <div className="space-y-3">
          <Field label="Heading"><TextInput value={d.heading} maxLength={60} onChange={(heading) => set({ heading })} /></Field>
          {d.items.map((item, idx) => (
            <div key={item.id} className="p-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">Question {idx + 1}</span>
                <button type="button" onClick={() => set({ items: d.items.filter((i) => i.id !== item.id) })} className="text-[#94A3B8] hover:text-red-500 transition-colors" aria-label="Remove question">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <TextInput value={item.question} maxLength={140} onChange={(question) => setItem(item.id, { question })} placeholder="Question" />
              <TextArea rows={2} value={item.answer} maxLength={600} onChange={(answer) => setItem(item.id, { answer })} placeholder="Answer" />
            </div>
          ))}
          {d.items.length < 10 && (
            <button type="button" onClick={() => set({ items: [...d.items, { id: newId('faq'), question: '', answer: '' }] })} className="w-full h-9 rounded-lg border border-dashed border-[#CBD5E1] text-[12px] font-semibold text-[#64748B] hover:border-[#00A86B] hover:text-[#00A86B] flex items-center justify-center gap-1.5 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Question
            </button>
          )}
        </div>
      );
    }

    case 'storeInfo':
    case 'support':
    case 'contactInfo': {
      const d = section.data;
      const set = (p: Partial<typeof d>) => onChange({ ...section, data: { ...d, ...p } } as TrackingSection);
      return (
        <div className="space-y-3">
          <Field label="Heading"><TextInput value={d.heading} maxLength={60} onChange={(heading) => set({ heading })} /></Field>
          <Field label="Text"><TextArea rows={2} value={d.body} maxLength={300} onChange={(body) => set({ body })} /></Field>
          {storeHint}
        </div>
      );
    }

    case 'whatsapp': {
      const d = section.data;
      const set = (p: Partial<typeof d>) => onChange({ ...section, data: { ...d, ...p } });
      return (
        <div className="space-y-3">
          <Field label="Heading"><TextInput value={d.heading} maxLength={60} onChange={(heading) => set({ heading })} /></Field>
          <Field label="Text"><TextArea rows={2} value={d.body} maxLength={200} onChange={(body) => set({ body })} /></Field>
          <Field label="Button Text"><TextInput value={d.buttonText} maxLength={30} onChange={(buttonText) => set({ buttonText })} /></Field>
          <Field label="Pre-filled Message" hint="Customers can edit it before sending."><TextInput value={d.prefillMessage} maxLength={140} onChange={(prefillMessage) => set({ prefillMessage })} /></Field>
          <ToggleRow label="Floating WhatsApp Button" description="Shown at the bottom-right of every screen." checked={d.showFloatingButton} onChange={(showFloatingButton) => set({ showFloatingButton })} />
          {storeHint}
        </div>
      );
    }

    default:
      return null;
  }
}
