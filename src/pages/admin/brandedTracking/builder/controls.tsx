import { useRef, useState } from 'react';
import { ChevronDown, ImagePlus, Loader2, X as XIcon } from 'lucide-react';
import { brandedTrackingService } from '../trackingService';
import { inputClass, TXT } from './styles';

/* Builder form primitives — mirror the existing settings pages (Label / Webhook settings). */



export function Field({ label, hint, children, className = '' }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className={`${TXT.label} text-[#334155] block mb-1.5`}>{label}</label>
      {children}
      {hint && <p className="text-[11px] text-[#94A3B8] mt-1 leading-snug">{hint}</p>}
    </div>
  );
}

export function TextInput({ value, onChange, placeholder, maxLength, type = 'text', prefix }: {
  value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number; type?: string; prefix?: string;
}) {
  if (prefix) {
    return (
      <div className="flex items-stretch rounded-lg border border-[#E2E8F0] bg-white focus-within:border-[#00A86B] focus-within:ring-2 focus-within:ring-[#00A86B]/15 transition-colors overflow-hidden">
        <span className="px-3 flex items-center bg-[#F8FAFC] border-r border-[#E2E8F0] text-[12px] text-[#64748B] font-medium shrink-0 max-w-[55%] truncate">{prefix}</span>
        <input type={type} value={value} maxLength={maxLength} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="flex-1 min-w-0 h-10 px-3 text-[12.5px] text-[#0F172A] placeholder:text-[#94A3B8] outline-none" />
      </div>
    );
  }
  return <input type={type} value={value} maxLength={maxLength} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={inputClass} />;
}

export function TextArea({ value, onChange, placeholder, rows = 3, maxLength }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; maxLength?: number }) {
  return (
    <div className="relative">
      <textarea
        value={value}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} h-auto py-2.5 resize-y leading-relaxed`}
      />
      {maxLength && <span className="absolute right-2.5 bottom-2 text-[10px] text-[#94A3B8] pointer-events-none">{value.length}/{maxLength}</span>}
    </div>
  );
}

export function Switch({ checked, onChange, disabled, label }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${checked ? 'bg-[#00A86B]' : 'bg-[#E2E8F0]'}`}
    >
      <span className={`absolute top-0.5 left-0 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

export function ToggleRow({ label, description, checked, onChange, disabled }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="min-w-0">
        <p className={`${TXT.label} text-[#334155]`}>{label}</p>
        {description && <p className="text-[11px] text-[#94A3B8] mt-0.5 leading-snug">{description}</p>}
      </div>
      <Switch checked={checked} onChange={onChange} disabled={disabled} label={label} />
    </div>
  );
}

export function Segmented<T extends string>({ value, onChange, options }: {
  value: T; onChange: (v: T) => void; options: { value: T; label: string; icon?: React.ElementType }[];
}) {
  return (
    <div className="flex p-1 rounded-lg bg-[#F1F5F9] gap-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`flex-1 h-8 px-2 rounded-md text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all ${active ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]'}`}
            aria-pressed={active}
          >
            {o.icon && <o.icon className="w-3.5 h-3.5" />}
            <span className="truncate">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

const SWATCHES = ['#00A86B', '#2563EB', '#7C3AED', '#DB2777', '#DC2626', '#EA580C', '#D97706', '#0F172A', '#FFFFFF'];

export function ColorField({ label, value, onChange, swatches = SWATCHES }: { label: string; value: string; onChange: (v: string) => void; swatches?: string[] }) {
  const [draft, setDraft] = useState(value);
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(value);
  }

  const commit = (v: string) => {
    const hex = v.startsWith('#') ? v : `#${v}`;
    if (/^#[0-9a-f]{6}$/i.test(hex)) onChange(hex.toUpperCase());
    else setDraft(value);
  };

  return (
    <div>
      <label className={`${TXT.label} text-[#334155] block mb-1.5`}>{label}</label>
      <div className="flex items-center gap-2">
        <label className="relative w-10 h-10 rounded-lg border border-[#E2E8F0] cursor-pointer overflow-hidden shrink-0 shadow-[inset_0_0_0_3px_#fff]" style={{ background: value }} title="Pick a colour">
          <input type="color" value={value} onChange={(e) => onChange(e.target.value.toUpperCase())} className="absolute inset-0 opacity-0 cursor-pointer" aria-label={`${label} picker`} />
        </label>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={(e) => commit(e.target.value.trim())}
          onKeyDown={(e) => { if (e.key === 'Enter') commit((e.target as HTMLInputElement).value.trim()); }}
          className={`${inputClass} font-mono uppercase`}
          maxLength={7}
          aria-label={`${label} hex`}
        />
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {[...new Set(swatches.map((s) => s.toUpperCase()))].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            title={s}
            className={`w-5 h-5 rounded-full border transition-transform hover:scale-110 ${value.toUpperCase() === s ? 'ring-2 ring-offset-1 ring-[#00A86B] border-transparent' : 'border-[#E2E8F0]'}`}
            style={{ background: s }}
          />
        ))}
      </div>
    </div>
  );
}

export function RangeField({ label, value, min, max, step = 1, unit = 'px', onChange }: { label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className={`${TXT.label} text-[#334155]`}>{label}</label>
        <span className="text-[11px] font-semibold text-[#00A86B] bg-[#F0FDF4] px-2 py-0.5 rounded-md tabular-nums">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[#00A86B] cursor-pointer" aria-label={label} />
    </div>
  );
}

export function ImageUpload({ label, hint, value, onChange, maxKb = 500, aspect = 'logo', onError }: {
  label: string; hint?: string; value?: string; onChange: (v?: string) => void; maxKb?: number; aspect?: 'logo' | 'square' | 'banner'; onError: (msg: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return onError('Please choose an image file (PNG, JPG, SVG or WebP).');
    if (file.size > maxKb * 1024) return onError(`Image must be under ${maxKb >= 1024 ? `${maxKb / 1024} MB` : `${maxKb} KB`}.`);
    setUploading(true);
    try {
      onChange(await brandedTrackingService.uploadAsset(file));
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const previewBox = aspect === 'banner' ? 'w-24 h-14' : aspect === 'square' ? 'w-12 h-12' : 'w-24 h-12';

  return (
    <div>
      <label className={`${TXT.label} text-[#334155] block mb-1.5`}>{label}</label>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp,image/x-icon" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      {value ? (
        <div className="flex items-center gap-3 p-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]">
          <span className={`${previewBox} rounded-md bg-white border border-[#E2E8F0] flex items-center justify-center overflow-hidden shrink-0 bg-[length:10px_10px] bg-[linear-gradient(45deg,#F1F5F9_25%,transparent_25%,transparent_75%,#F1F5F9_75%),linear-gradient(45deg,#F1F5F9_25%,transparent_25%,transparent_75%,#F1F5F9_75%)] bg-[position:0_0,5px_5px]`}>
            <img src={value} alt="" className={`max-w-full max-h-full ${aspect === 'banner' ? 'w-full h-full object-cover' : 'object-contain'}`} />
          </span>
          <div className="flex items-center gap-3 ml-auto pr-1">
            <button type="button" onClick={() => inputRef.current?.click()} className={`${TXT.label} text-[#00A86B] hover:underline`}>Change</button>
            <button type="button" onClick={() => onChange(undefined)} className="text-[#94A3B8] hover:text-red-500 transition-colors" aria-label={`Remove ${label}`}>
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}
          className="w-full flex items-center justify-center gap-2 h-[72px] rounded-lg border border-dashed border-[#CBD5E1] text-[#64748B] text-[12px] font-medium hover:border-[#00A86B] hover:text-[#00A86B] hover:bg-[#F0FDF4]/50 transition-colors disabled:opacity-60"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
          {uploading ? 'Uploading…' : 'Click or drop an image'}
        </button>
      )}
      {hint && <p className="text-[11px] text-[#94A3B8] mt-1 leading-snug">{hint}</p>}
    </div>
  );
}

/** Collapsible group inside a panel. */
export function Group({ title, description, children, defaultOpen = true, action }: { title: string; description?: string; children: React.ReactNode; defaultOpen?: boolean; action?: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-[#F1F5F9] last:border-b-0">
      <div className="flex items-center gap-3 py-4">
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex-1 min-w-0 flex items-center justify-between gap-3 text-left" aria-expanded={open}>
          <span className="min-w-0">
            <span className={`${TXT.title} text-[#0F172A] block`}>{title}</span>
            {description && <span className="text-[11.5px] text-[#94A3B8] block mt-0.5 leading-snug">{description}</span>}
          </span>
          <ChevronDown className={`w-4 h-4 text-[#94A3B8] shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {action}
      </div>
      {open && <div className="pb-5 space-y-4">{children}</div>}
    </section>
  );
}
