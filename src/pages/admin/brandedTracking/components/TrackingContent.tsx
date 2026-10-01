import { useState } from 'react';
import { ArrowRight, Check, ChevronDown, Clock, Copy, Globe, ImageIcon, Mail, MapPin, Phone, PlayCircle } from 'lucide-react';
import type { TrackingPageConfig, TrackingSection } from '../types';
import { buttonStyle, cardStyle, contrastText, mailUrl, safeUrl, telUrl, whatsappUrl, type ThemeTokens } from '../theme';
import { WhatsappIcon } from './BrandIcons';
import { StoreMark } from './TrackingHeader';

const WHATSAPP_GREEN = '#25D366';

interface BlockProps {
  config: TrackingPageConfig;
  t: ThemeTokens;
  isPreview: boolean;
}

function LinkButton({ text, url, t, color }: { text: string; url?: string; t: ThemeTokens; color?: string }) {
  if (!text) return null;
  return (
    <a
      href={safeUrl(url)}
      target="_blank"
      rel="noopener noreferrer"
      className="h-11 px-6 inline-flex items-center justify-center gap-2 text-[14px] font-bold transition-opacity hover:opacity-90"
      style={buttonStyle(t, color)}
    >
      {text} <ArrowRight className="w-4 h-4" />
    </a>
  );
}

function SectionHeading({ title, body, t, center = false }: { title: string; body?: string; t: ThemeTokens; center?: boolean }) {
  return (
    <div className={center ? 'text-center' : ''}>
      {title && <h2 className="text-[19px] @2xl:text-[22px] font-extrabold tracking-tight" style={{ color: t.text }}>{title}</h2>}
      {body && <p className="text-[14px] leading-relaxed mt-1.5" style={{ color: t.muted }}>{body}</p>}
    </div>
  );
}

function ImagePlaceholder({ t, label }: { t: ThemeTokens; label: string }) {
  return (
    <div className="w-full h-full min-h-[200px] flex flex-col items-center justify-center gap-2 text-[12.5px] font-medium" style={{ background: `color-mix(in srgb, ${t.primary} 8%, ${t.surface})`, color: t.muted }}>
      <ImageIcon className="w-7 h-7 opacity-60" />
      {label}
    </div>
  );
}

function Hint({ children, t }: { children: React.ReactNode; t: ThemeTokens }) {
  return <p className="text-[12px] italic" style={{ color: t.muted }}>{children}</p>;
}

/* ── Video embed helper ───────────────────────────────────────────────── */
function toEmbed(url: string): { kind: 'iframe' | 'video'; src: string } | null {
  const v = url.trim();
  if (!v) return null;
  const yt = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/.exec(v);
  if (yt) return { kind: 'iframe', src: `https://www.youtube-nocookie.com/embed/${yt[1]}` };
  const vimeo = /vimeo\.com\/(\d+)/.exec(v);
  if (vimeo) return { kind: 'iframe', src: `https://player.vimeo.com/video/${vimeo[1]}` };
  if (/\.(mp4|webm)(\?|$)/i.test(v)) return { kind: 'video', src: safeUrl(v)! };
  return null;
}

/* ── Contact channels shared by support + contact blocks ─────────────── */
function getChannels(config: TrackingPageConfig) {
  const s = config.store;
  return [
    { key: 'phone', icon: Phone, label: 'Call us', value: s.supportPhone, href: telUrl(s.supportPhone) },
    { key: 'email', icon: Mail, label: 'Email', value: s.supportEmail, href: mailUrl(s.supportEmail) },
    { key: 'whatsapp', icon: WhatsappIcon, label: 'WhatsApp', value: s.whatsappNumber, href: whatsappUrl(s.whatsappNumber) },
  ].filter((c) => c.value.trim());
}

/* ── Blocks ───────────────────────────────────────────────────────────── */

export function ContentBlock({ section, config, t, isPreview }: BlockProps & { section: TrackingSection }) {
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const channels = getChannels(config);
  const store = config.store;

  switch (section.type) {
    case 'imageText': {
      const d = section.data;
      return (
        <div className="overflow-hidden grid grid-cols-1 @2xl:grid-cols-2" style={cardStyle(t)}>
          <div className={`min-h-[200px] ${d.imagePosition === 'right' ? '@2xl:order-2' : ''}`}>
            {d.image ? <img src={d.image} alt="" className="w-full h-full object-cover" /> : <ImagePlaceholder t={t} label="Add an image" />}
          </div>
          <div className="p-6 @2xl:p-10 flex flex-col justify-center gap-5 items-start">
            <SectionHeading title={d.heading} body={d.body} t={t} />
            <LinkButton text={d.buttonText} url={d.buttonUrl} t={t} />
          </div>
        </div>
      );
    }

    case 'promoBanner': {
      const d = section.data;
      const onImage = !!d.image;
      const fg = onImage ? '#FFFFFF' : contrastText(t.secondary);
      return (
        <div
          className="relative overflow-hidden px-6 py-9 @2xl:px-12 @2xl:py-12"
          style={{
            borderRadius: t.radius,
            background: onImage
              ? `linear-gradient(90deg, rgba(2,6,23,0.78), rgba(2,6,23,0.35)), url(${d.image}) center / cover`
              : `linear-gradient(120deg, ${t.secondary} 0%, color-mix(in srgb, ${t.secondary} 70%, ${t.primary}) 100%)`,
          }}
        >
          {!onImage && <span className="absolute -right-16 -top-16 w-64 h-64 rounded-full opacity-20" style={{ background: t.primary }} />}
          <div className="relative flex flex-col @2xl:flex-row @2xl:items-center @2xl:justify-between gap-6">
            <div className="max-w-[560px]">
              {d.eyebrow && <p className="text-[11.5px] font-bold uppercase tracking-[0.14em] mb-2" style={{ color: onImage ? '#FFFFFF' : t.primary }}>{d.eyebrow}</p>}
              <h2 className="text-[24px] @2xl:text-[30px] font-extrabold leading-tight tracking-tight" style={{ color: fg }}>{d.heading}</h2>
              {d.body && <p className="text-[14px] leading-relaxed mt-2 opacity-85" style={{ color: fg }}>{d.body}</p>}
            </div>
            <div className="flex flex-col @md:flex-row gap-3 shrink-0">
              {d.couponCode && (
                <button
                  type="button"
                  onClick={() => { navigator.clipboard?.writeText(d.couponCode).catch(() => undefined); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                  className="h-11 px-4 inline-flex items-center justify-center gap-2 text-[13.5px] font-bold tracking-wider"
                  style={{ border: `1.5px dashed ${fg}`, color: fg, borderRadius: t.buttonStyle === 'pill' ? 999 : t.radiusSm }}
                >
                  {d.couponCode} {copied ? <Check className="w-4 h-4" /> : <Copy className="w-3.5 h-3.5 opacity-80" />}
                </button>
              )}
              <LinkButton text={d.buttonText} url={d.buttonUrl} t={t} color={t.button} />
            </div>
          </div>
        </div>
      );
    }

    case 'customText': {
      const d = section.data;
      return (
        <div className="py-2" style={{ textAlign: d.alignment }}>
          {d.heading && <h2 className="text-[19px] @2xl:text-[22px] font-extrabold tracking-tight" style={{ color: t.text }}>{d.heading}</h2>}
          {d.body && <p className="text-[14px] leading-relaxed mt-2 whitespace-pre-line" style={{ color: t.muted, marginLeft: d.alignment === 'center' ? 'auto' : undefined, marginRight: d.alignment === 'center' ? 'auto' : undefined, maxWidth: 720 }}>{d.body}</p>}
        </div>
      );
    }

    case 'cta': {
      const d = section.data;
      return (
        <div className="p-6 @2xl:p-8 flex flex-col @2xl:flex-row @2xl:items-center @2xl:justify-between gap-5" style={{ ...cardStyle(t), background: `color-mix(in srgb, ${t.primary} 7%, ${t.surface})` }}>
          <SectionHeading title={d.heading} body={d.body} t={t} />
          <div className="shrink-0"><LinkButton text={d.buttonText} url={d.buttonUrl} t={t} /></div>
        </div>
      );
    }

    case 'video': {
      const d = section.data;
      const embed = toEmbed(d.url);
      return (
        <div className="space-y-4">
          {d.heading && <SectionHeading title={d.heading} t={t} />}
          <div className="relative w-full aspect-video overflow-hidden" style={{ borderRadius: t.radius, background: '#000' }}>
            {embed?.kind === 'iframe' && (
              <iframe src={embed.src} title={d.heading || 'Video'} className="absolute inset-0 w-full h-full" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy" />
            )}
            {embed?.kind === 'video' && <video src={embed.src} controls className="absolute inset-0 w-full h-full object-cover" />}
            {!embed && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/70 text-[13px]" style={{ background: `linear-gradient(135deg, ${t.secondary}, #000)` }}>
                <PlayCircle className="w-12 h-12" strokeWidth={1.4} />
                {isPreview ? 'Paste a YouTube, Vimeo or MP4 link to show your video' : null}
              </div>
            )}
          </div>
        </div>
      );
    }

    case 'faq': {
      const d = section.data;
      if (!d.items.length) return isPreview ? <Hint t={t}>Add at least one question to show the FAQ section.</Hint> : null;
      return (
        <div className="p-5 @2xl:p-7" style={cardStyle(t)}>
          <SectionHeading title={d.heading} t={t} />
          <div className="mt-3">
            {d.items.map((item, i) => {
              const open = openFaq === item.id;
              return (
                <div key={item.id} style={{ borderTop: i === 0 ? undefined : `1px solid ${t.border}` }}>
                  <button type="button" onClick={() => setOpenFaq(open ? null : item.id)} className="w-full flex items-center justify-between gap-4 py-4 text-left" aria-expanded={open}>
                    <span className="text-[14px] font-semibold" style={{ color: t.text }}>{item.question || 'Untitled question'}</span>
                    <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} style={{ color: t.muted }} />
                  </button>
                  {open && <p className="pb-4 pr-8 text-[13.5px] leading-relaxed whitespace-pre-line" style={{ color: t.muted }}>{item.answer}</p>}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    case 'storeInfo': {
      const d = section.data;
      return (
        <div className="p-6 @2xl:p-8 flex flex-col @2xl:flex-row gap-6" style={cardStyle(t)}>
          <div className="shrink-0"><StoreMark config={config} t={t} size={44} /></div>
          <div className="flex-1 min-w-0 space-y-4">
            <SectionHeading title={d.heading} body={d.body} t={t} />
            <div className="grid grid-cols-1 @2xl:grid-cols-3 gap-3 text-[13px]">
              {store.address && <p className="flex items-start gap-2" style={{ color: t.muted }}><MapPin className="w-4 h-4 shrink-0 mt-0.5" style={{ color: t.primary }} />{store.address}</p>}
              {store.supportHours && <p className="flex items-start gap-2" style={{ color: t.muted }}><Clock className="w-4 h-4 shrink-0 mt-0.5" style={{ color: t.primary }} />{store.supportHours}</p>}
              {store.websiteUrl && (
                <a href={safeUrl(store.websiteUrl)} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 font-semibold hover:underline" style={{ color: t.primary }}>
                  <Globe className="w-4 h-4 shrink-0 mt-0.5" />{store.websiteUrl.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          </div>
        </div>
      );
    }

    case 'support': {
      const d = section.data;
      return (
        <div className="p-6 @2xl:p-8" style={cardStyle(t)}>
          <div className="flex flex-col @2xl:flex-row @2xl:items-center @2xl:justify-between gap-5">
            <div>
              <SectionHeading title={d.heading} body={d.body} t={t} />
              {store.supportHours && <p className="text-[12.5px] mt-2 inline-flex items-center gap-1.5" style={{ color: t.muted }}><Clock className="w-3.5 h-3.5" />{store.supportHours}</p>}
            </div>
            <div className="flex flex-wrap gap-2.5 shrink-0">
              {channels.map((c) => (
                <a key={c.key} href={c.href} target={c.key === 'whatsapp' ? '_blank' : undefined} rel="noopener noreferrer" className="h-10 px-4 inline-flex items-center gap-2 text-[13px] font-semibold transition-opacity hover:opacity-85" style={buttonStyle(t, c.key === 'whatsapp' ? WHATSAPP_GREEN : t.primary, c.key !== 'phone')}>
                  <c.icon className="w-4 h-4" /> {c.label}
                </a>
              ))}
              {!channels.length && isPreview && <Hint t={t}>Add phone, email or WhatsApp in Branding → Store Details.</Hint>}
            </div>
          </div>
        </div>
      );
    }

    case 'whatsapp': {
      const d = section.data;
      const href = whatsappUrl(store.whatsappNumber, d.prefillMessage);
      return (
        <div className="p-6 @2xl:p-8 flex flex-col @2xl:flex-row @2xl:items-center gap-5" style={{ borderRadius: t.radius, background: `color-mix(in srgb, ${WHATSAPP_GREEN} 9%, ${t.surface})`, boxShadow: t.shadow }}>
          <span className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-white" style={{ background: WHATSAPP_GREEN }}><WhatsappIcon className="w-6 h-6" /></span>
          <div className="flex-1 min-w-0">
            <SectionHeading title={d.heading} body={d.body} t={t} />
            {!href && isPreview && <div className="mt-1"><Hint t={t}>Add your WhatsApp number in Branding → Store Details.</Hint></div>}
          </div>
          <a href={href} target="_blank" rel="noopener noreferrer" className="h-11 px-6 inline-flex items-center justify-center gap-2 text-[14px] font-bold text-white shrink-0 transition-opacity hover:opacity-90" style={{ background: WHATSAPP_GREEN, borderRadius: t.buttonStyle === 'pill' ? 999 : t.radiusSm }}>
            <WhatsappIcon className="w-4 h-4" /> {d.buttonText || 'Chat on WhatsApp'}
          </a>
        </div>
      );
    }

    case 'contactInfo': {
      const d = section.data;
      const items = [
        ...channels.map((c) => ({ key: c.key, icon: c.icon, label: c.label, value: c.value, href: c.href })),
        ...(store.address ? [{ key: 'address', icon: MapPin, label: 'Address', value: store.address, href: undefined }] : []),
      ];
      if (!items.length && !isPreview) return null;
      return (
        <div className="space-y-4">
          <SectionHeading title={d.heading} body={d.body} t={t} />
          {items.length ? (
            <div className="grid grid-cols-1 @md:grid-cols-2 @3xl:grid-cols-4 gap-3">
              {items.map((c) => (
                <a key={c.key} href={c.href} target={c.key === 'whatsapp' ? '_blank' : undefined} rel="noopener noreferrer" className="p-4 flex items-start gap-3 transition-transform hover:-translate-y-0.5" style={cardStyle(t)}>
                  <span className="w-9 h-9 flex items-center justify-center shrink-0" style={{ background: `color-mix(in srgb, ${t.primary} 12%, transparent)`, color: t.primary, borderRadius: t.radiusSm }}><c.icon className="w-4 h-4" /></span>
                  <span className="min-w-0">
                    <span className="block text-[12px] font-semibold" style={{ color: t.muted }}>{c.label}</span>
                    <span className="block text-[13.5px] font-semibold break-words" style={{ color: t.text }}>{c.value}</span>
                  </span>
                </a>
              ))}
            </div>
          ) : (
            <Hint t={t}>Add contact details in Branding → Store Details.</Hint>
          )}
        </div>
      );
    }

    default:
      return null;
  }
}
