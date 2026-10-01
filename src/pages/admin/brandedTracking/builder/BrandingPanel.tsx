import { Moon, Sun } from 'lucide-react';
import { FONT_OPTIONS, RADIUS_PX, slugify, THEME_PRESETS } from '../defaultConfig';
import { ensureFontLoaded } from '../theme';
import type { BorderRadius, ButtonStyle } from '../types';
import { ColorField, Field, Group, ImageUpload, Segmented, TextArea, TextInput } from './controls';
import { TXT } from './styles';
import type { PanelProps } from './panelTypes';

const PALETTES = [
  { name: 'QuickPost', primary: '#00A86B', secondary: '#0F172A', button: '#00A86B' },
  { name: 'Ocean', primary: '#2563EB', secondary: '#0B1F44', button: '#2563EB' },
  { name: 'Royal', primary: '#7C3AED', secondary: '#1E1B4B', button: '#7C3AED' },
  { name: 'Blush', primary: '#DB2777', secondary: '#3F0D25', button: '#DB2777' },
  { name: 'Sunset', primary: '#EA580C', secondary: '#2A1206', button: '#EA580C' },
  { name: 'Mono', primary: '#111827', secondary: '#111827', button: '#111827' },
];

const RADIUS_OPTIONS: { value: BorderRadius; label: string }[] = [
  { value: 'sharp', label: 'Sharp' },
  { value: 'soft', label: 'Soft' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'extra', label: 'Extra' },
];

const BUTTON_OPTIONS: { value: ButtonStyle; label: string }[] = [
  { value: 'solid', label: 'Solid' },
  { value: 'outline', label: 'Outline' },
  { value: 'pill', label: 'Pill' },
];

export function BrandingPanel({ config, update, onError }: PanelProps) {
  const b = config.branding;
  const s = config.store;

  const setTheme = (theme: 'light' | 'dark') => {
    if (theme === b.theme) return;
    const p = THEME_PRESETS[theme];
    update('branding', { theme, backgroundColor: p.backgroundColor, textColor: p.textColor });
    update('header', { backgroundColor: p.headerBg });
    update('footer', { backgroundColor: p.footerBg, textColor: p.footerText });
  };

  return (
    <div>
      <Group title="Store Details" description="Shown in the header, contact blocks and footer.">
        <Field label="Store Name">
          <TextInput value={s.name} maxLength={60} onChange={(name) => update('store', { name })} placeholder="e.g. Urban Threads" />
        </Field>
        <Field label="Tracking Page URL" hint="Lowercase letters, numbers and hyphens only. Share this link in order SMS and emails.">
          <TextInput prefix={`${window.location.host}/track/`} value={s.slug} maxLength={40} onChange={(v) => update('store', { slug: slugify(v.replace(/\s/g, '-')) })} placeholder="your-store" />
        </Field>
        <Field label="Store Website">
          <TextInput value={s.websiteUrl} onChange={(websiteUrl) => update('store', { websiteUrl })} placeholder="https://yourstore.com" />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Support Email">
            <TextInput type="email" value={s.supportEmail} onChange={(supportEmail) => update('store', { supportEmail })} placeholder="support@yourstore.com" />
          </Field>
          <Field label="Support Phone">
            <TextInput type="tel" value={s.supportPhone} onChange={(supportPhone) => update('store', { supportPhone })} placeholder="+91 98765 43210" />
          </Field>
          <Field label="WhatsApp Number" hint="10-digit Indian numbers get +91 automatically.">
            <TextInput type="tel" value={s.whatsappNumber} onChange={(whatsappNumber) => update('store', { whatsappNumber })} placeholder="98765 43210" />
          </Field>
          <Field label="Support Hours">
            <TextInput value={s.supportHours} onChange={(supportHours) => update('store', { supportHours })} placeholder="Mon – Sat, 10 AM – 7 PM" />
          </Field>
        </div>
        <Field label="Store Address">
          <TextArea rows={2} maxLength={200} value={s.address} onChange={(address) => update('store', { address })} placeholder="Building, street, city, state, PIN" />
        </Field>
      </Group>

      <Group title="Social Links" description="Used by header icons and footer." defaultOpen={false}>
        {(['instagram', 'facebook', 'x', 'youtube', 'linkedin'] as const).map((k) => (
          <Field key={k} label={k === 'x' ? 'X (Twitter)' : k.charAt(0).toUpperCase() + k.slice(1)}>
            <TextInput value={s.social[k]} onChange={(v) => update('store', { social: { ...s.social, [k]: v } })} placeholder={`https://${k === 'x' ? 'x' : k}.com/yourstore`} />
          </Field>
        ))}
      </Group>

      <Group title="Logo & Favicon">
        <ImageUpload label="Store Logo" hint="PNG or SVG with transparent background, under 500 KB." value={b.logo} onChange={(logo) => update('branding', { logo: logo ?? '' })} onError={onError} />
        <ImageUpload label="Favicon" aspect="square" maxKb={100} hint="Square image, 32×32 or 64×64 px, under 100 KB." value={b.favicon} onChange={(favicon) => update('branding', { favicon: favicon ?? '' })} onError={onError} />
      </Group>

      <Group title="Theme & Colors">
        <Field label="Theme">
          <Segmented value={b.theme} onChange={setTheme} options={[{ value: 'light', label: 'Light', icon: Sun }, { value: 'dark', label: 'Dark', icon: Moon }]} />
        </Field>
        <Field label="Quick Palettes">
          <div className="grid grid-cols-3 gap-2">
            {PALETTES.map((p) => {
              const active = b.primaryColor === p.primary && b.secondaryColor === p.secondary;
              return (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => update('branding', { primaryColor: p.primary, secondaryColor: p.secondary, buttonColor: p.button })}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-colors ${active ? 'border-[#00A86B] bg-[#F0FDF4]' : 'border-[#E2E8F0] hover:border-[#CBD5E1]'}`}
                >
                  <span className="flex -space-x-1.5 shrink-0">
                    <span className="w-4 h-4 rounded-full border-2 border-white" style={{ background: p.primary }} />
                    <span className="w-4 h-4 rounded-full border-2 border-white" style={{ background: p.secondary }} />
                  </span>
                  <span className="text-[11.5px] font-semibold text-[#334155] truncate">{p.name}</span>
                </button>
              );
            })}
          </div>
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ColorField label="Primary Color" value={b.primaryColor} onChange={(primaryColor) => update('branding', { primaryColor })} />
          <ColorField label="Secondary Color" value={b.secondaryColor} onChange={(secondaryColor) => update('branding', { secondaryColor })} />
          <ColorField label="Button Color" value={b.buttonColor} onChange={(buttonColor) => update('branding', { buttonColor })} />
          <ColorField label="Background Color" value={b.backgroundColor} onChange={(backgroundColor) => update('branding', { backgroundColor })} swatches={['#F1F3F6', '#FFFFFF', '#F8FAFC', '#F5F5F4', '#FFFBEB', '#F0FDF4', '#0B1120', '#111827', '#000000']} />
          <ColorField label="Text Color" value={b.textColor} onChange={(textColor) => update('branding', { textColor })} swatches={['#0F172A', '#1E293B', '#334155', '#111827', '#E2E8F0', '#F8FAFC', '#FFFFFF']} />
        </div>
      </Group>

      <Group title="Typography">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {FONT_OPTIONS.map((f) => {
            const active = b.fontFamily === f;
            return (
              <button
                key={f}
                type="button"
                onMouseEnter={() => ensureFontLoaded(f)}
                onFocus={() => ensureFontLoaded(f)}
                onClick={() => update('branding', { fontFamily: f })}
                className={`h-[68px] rounded-lg border flex flex-col items-center justify-center gap-0.5 transition-colors ${active ? 'border-[#00A86B] bg-[#F0FDF4]' : 'border-[#E2E8F0] hover:border-[#CBD5E1]'}`}
              >
                <span className="text-[20px] font-bold text-[#0F172A] leading-none" style={{ fontFamily: `'${f}', sans-serif` }}>Aa</span>
                <span className={`text-[11px] font-semibold ${active ? 'text-[#00A86B]' : 'text-[#64748B]'}`}>{f}</span>
              </button>
            );
          })}
        </div>
      </Group>

      <Group title="Corners & Buttons">
        <Field label="Border Radius">
          <div className="grid grid-cols-4 gap-2">
            {RADIUS_OPTIONS.map((o) => {
              const active = b.borderRadius === o.value;
              return (
                <button key={o.value} type="button" onClick={() => update('branding', { borderRadius: o.value })} className={`h-16 rounded-lg border flex flex-col items-center justify-center gap-1.5 transition-colors ${active ? 'border-[#00A86B] bg-[#F0FDF4]' : 'border-[#E2E8F0] hover:border-[#CBD5E1]'}`}>
                  <span className="w-6 h-6 border-t-2 border-l-2 border-[#0F172A]" style={{ borderTopLeftRadius: Math.min(RADIUS_PX[o.value], 14) }} />
                  <span className={`text-[11px] font-semibold ${active ? 'text-[#00A86B]' : 'text-[#64748B]'}`}>{o.label}</span>
                </button>
              );
            })}
          </div>
        </Field>
        <Field label="Button Style">
          <div className="grid grid-cols-3 gap-2">
            {BUTTON_OPTIONS.map((o) => {
              const active = b.buttonStyle === o.value;
              const radius = o.value === 'pill' ? 999 : Math.round(RADIUS_PX[b.borderRadius] * 0.66);
              return (
                <button key={o.value} type="button" onClick={() => update('branding', { buttonStyle: o.value })} className={`h-16 rounded-lg border flex flex-col items-center justify-center gap-1.5 transition-colors ${active ? 'border-[#00A86B] bg-[#F0FDF4]' : 'border-[#E2E8F0] hover:border-[#CBD5E1]'}`}>
                  <span
                    className="h-5 w-14 text-[9px] font-bold flex items-center justify-center"
                    style={o.value === 'outline'
                      ? { border: `1.5px solid ${b.buttonColor}`, color: b.buttonColor, borderRadius: radius }
                      : { background: b.buttonColor, color: '#fff', borderRadius: radius }}
                  >
                    Track
                  </span>
                  <span className={`text-[11px] font-semibold ${active ? 'text-[#00A86B]' : 'text-[#64748B]'}`}>{o.label}</span>
                </button>
              );
            })}
          </div>
        </Field>
        <p className={`${TXT.value} text-[#94A3B8]`}>Corners apply to cards, inputs and images across the page.</p>
      </Group>
    </div>
  );
}
