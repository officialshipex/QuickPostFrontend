import { Phone, Store } from 'lucide-react';
import type { TrackingPageConfig } from '../types';
import { DEFAULT_LOGO, DEFAULT_LOGO_ON_DARK } from '../defaultConfig';
import { buttonStyle, contrastText, safeUrl, type ThemeTokens } from '../theme';
import { contactHref, socialLinks } from './links';


/** Store logo, or a wordmark fallback built from the store name. */
export function StoreMark({ config, t, size, color }: { config: TrackingPageConfig; t: ThemeTokens; size: number; color?: string }) {
  const onDark = color?.toUpperCase() === '#FFFFFF';
  const logo = onDark && config.branding.logo === DEFAULT_LOGO ? DEFAULT_LOGO_ON_DARK : config.branding.logo;
  const name = config.store.name || 'Store';
  if (logo) {
    return <img src={logo} alt={name} style={{ height: size, maxWidth: size * 4.5 }} className="object-contain block" draggable={false} />;
  }
  return (
    <span className="inline-flex items-center gap-2 min-w-0">
      <span
        className="shrink-0 flex items-center justify-center font-extrabold"
        style={{ width: size, height: size, background: t.primary, color: contrastText(t.primary), borderRadius: Math.min(t.radiusSm, size / 2), fontSize: size * 0.46 }}
      >
        {name.charAt(0).toUpperCase()}
      </span>
      <span className="font-extrabold tracking-tight truncate" style={{ fontSize: Math.max(15, size * 0.5), color: color ?? t.text }}>
        {name}
      </span>
    </span>
  );
}


export function TrackingHeader({ config, t }: { config: TrackingPageConfig; t: ThemeTokens }) {
  const h = config.header;
  const headerText = contrastText(h.backgroundColor);
  const socials = h.showSocialIcons ? socialLinks(config.store) : [];

  const actions = (
    <div className="flex items-center gap-2 shrink-0">
      {socials.length > 0 && (
        <div className="hidden @2xl:flex items-center gap-1 mr-1">
          {socials.map(({ key, label, url, Icon }) => (
            <a key={key} href={safeUrl(url)} target="_blank" rel="noopener noreferrer" aria-label={label} className="w-8 h-8 flex items-center justify-center rounded-full opacity-75 hover:opacity-100 transition-opacity" style={{ color: headerText }}>
              <Icon className="w-[17px] h-[17px]" />
            </a>
          ))}
        </div>
      )}
      {h.showContactButton && (
        <a
          href={contactHref(config.store)}
          className="h-9 px-2.5 @2xl:px-4 inline-flex items-center gap-1.5 text-[13px] font-semibold transition-opacity hover:opacity-85"
          style={buttonStyle(t, headerText === '#FFFFFF' ? '#FFFFFF' : t.secondary, true)}
          aria-label="Contact us"
        >
          <Phone className="w-3.5 h-3.5" />
          <span className="hidden @2xl:inline">Contact</span>
        </a>
      )}
      {h.showStoreButton && (
        <a
          href={safeUrl(config.store.websiteUrl)}
          target="_blank"
          rel="noopener noreferrer"
          className="h-9 px-2.5 @2xl:px-4 inline-flex items-center gap-1.5 text-[13px] font-semibold transition-opacity hover:opacity-90"
          style={buttonStyle(t)}
        >
          <Store className="w-3.5 h-3.5" />
          <span className="hidden @md:inline">{h.storeButtonText || 'Visit Store'}</span>
        </a>
      )}
    </div>
  );

  const logo = h.showLogo ? <StoreMark config={config} t={t} size={h.logoSize} color={headerText} /> : <span />;

  return (
    <>
      {h.showAnnouncement && h.announcement.trim() && (
        <div className="px-4 py-2 text-center text-[12.5px] font-medium leading-snug" style={{ background: h.announcementBgColor, color: h.announcementTextColor }}>
          {h.announcement}
        </div>
      )}
      <header
        className={`${h.sticky ? 'sticky top-0' : 'relative'} z-20`}
        style={{ background: h.backgroundColor, boxShadow: t.isDark ? '0 1px 0 rgba(255,255,255,0.06)' : '0 1px 3px rgba(16,24,40,0.06)' }}
      >
        <div className="max-w-[1180px] mx-auto px-4 @2xl:px-8 py-3 min-h-[64px] flex items-center gap-4">
          {h.alignment === 'center' ? (
            <div className="w-full grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <span />
              <div className="flex justify-center min-w-0">{logo}</div>
              <div className="flex justify-end">{actions}</div>
            </div>
          ) : (
            <div className={`w-full flex items-center justify-between gap-3 ${h.alignment === 'right' ? 'flex-row-reverse' : ''}`}>
              <div className="min-w-0 flex">{logo}</div>
              {actions}
            </div>
          )}
        </div>
      </header>
    </>
  );
}
