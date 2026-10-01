import { Mail, Phone } from 'lucide-react';
import type { TrackingPageConfig } from '../types';
import { mailUrl, safeUrl, telUrl, whatsappUrl, type ThemeTokens } from '../theme';
import { WhatsappIcon } from './BrandIcons';
import { contactHref, socialLinks } from './links';
import { StoreMark } from './TrackingHeader';

export function TrackingFooter({ config, t }: { config: TrackingPageConfig; t: ThemeTokens }) {
  const f = config.footer;
  const s = config.store;
  const socials = f.showSocialLinks ? socialLinks(s) : [];
  const policyLinks = f.showPolicyLinks
    ? [
        { label: 'Privacy Policy', url: f.privacyUrl },
        { label: 'Terms & Conditions', url: f.termsUrl },
        { label: 'Refund Policy', url: f.refundUrl },
      ]
    : [];
  const contacts = [
    f.showPhone && s.supportPhone && { key: 'phone', icon: Phone, value: s.supportPhone, href: telUrl(s.supportPhone) },
    f.showEmail && s.supportEmail && { key: 'email', icon: Mail, value: s.supportEmail, href: mailUrl(s.supportEmail) },
    f.showWhatsapp && s.whatsappNumber && { key: 'wa', icon: WhatsappIcon, value: s.whatsappNumber, href: whatsappUrl(s.whatsappNumber) },
  ].filter(Boolean) as { key: string; icon: React.ElementType; value: string; href?: string }[];

  const linkClass = 'text-[13px] hover:underline underline-offset-4 transition-opacity hover:opacity-100 opacity-85';
  const divider = `color-mix(in srgb, ${f.textColor} 16%, transparent)`;

  return (
    <footer style={{ background: f.backgroundColor, color: f.textColor }}>
      <div className="max-w-[1180px] mx-auto px-4 @2xl:px-8 py-10">
        <div className="grid grid-cols-1 @2xl:grid-cols-[1.4fr_1fr_1fr] gap-8">
          <div className="space-y-3">
            {f.showLogo && <StoreMark config={config} t={t} size={34} color="#FFFFFF" />}
            {f.text && <p className="text-[13px] leading-relaxed max-w-[360px] opacity-85">{f.text}</p>}
            {socials.length > 0 && (
              <div className="flex items-center gap-2 pt-1">
                {socials.map(({ key, label, url, Icon }) => (
                  <a key={key} href={safeUrl(url)} target="_blank" rel="noopener noreferrer" aria-label={label} className="w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-100 opacity-80" style={{ border: `1px solid ${divider}` }}>
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {(policyLinks.length > 0 || f.showContactUs) && (
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.1em] mb-3 opacity-60">Help</p>
              <ul className="space-y-2">
                {f.showContactUs && <li><a href={safeUrl(f.contactUrl) || contactHref(s)} className={linkClass}>Contact Us</a></li>}
                {policyLinks.map((l) => (
                  <li key={l.label}><a href={safeUrl(l.url)} target="_blank" rel="noopener noreferrer" className={linkClass}>{l.label}</a></li>
                ))}
              </ul>
            </div>
          )}

          {contacts.length > 0 && (
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.1em] mb-3 opacity-60">Get in touch</p>
              <ul className="space-y-2.5">
                {contacts.map((c) => (
                  <li key={c.key}>
                    <a href={c.href} target={c.key === 'wa' ? '_blank' : undefined} rel="noopener noreferrer" className={`${linkClass} inline-flex items-center gap-2 break-all`}>
                      <c.icon className="w-4 h-4 shrink-0" /> {c.value}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {(f.copyright || f.showPoweredByQuickPost) && (
          <div className="mt-8 pt-5 flex flex-col @2xl:flex-row @2xl:items-center @2xl:justify-between gap-2 text-[12px]" style={{ borderTop: `1px solid ${divider}` }}>
            <span className="opacity-70">{f.copyright}</span>
            {f.showPoweredByQuickPost && (
              <a href="https://quickpost.in" target="_blank" rel="noopener noreferrer" className="opacity-70 hover:opacity-100 transition-opacity">
                Tracking powered by <span className="font-bold">QuickPost</span>
              </a>
            )}
          </div>
        )}
      </div>
    </footer>
  );
}
