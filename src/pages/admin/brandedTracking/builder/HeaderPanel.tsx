import { ColorField, Field, Group, RangeField, Segmented, TextInput, ToggleRow } from './controls';
import type { PanelProps } from './panelTypes';
import { ALIGN_OPTIONS } from './sectionMeta';


export function HeaderPanel({ config, update }: PanelProps) {
  const h = config.header;
  const set = (patch: Partial<typeof h>) => update('header', patch);
  const hasSocial = Object.values(config.store.social).some((v) => v.trim());
  const hasContact = !!(config.store.supportEmail.trim() || config.store.supportPhone.trim());

  return (
    <div>
      <div className="py-4 border-b border-[#F1F5F9]">
        <ToggleRow label="Show Header" description="Top navigation bar with your logo and quick actions." checked={h.enabled} onChange={(enabled) => set({ enabled })} />
      </div>

      {h.enabled && (
        <>
          <Group title="Logo">
            <ToggleRow label="Show Logo" checked={h.showLogo} onChange={(showLogo) => set({ showLogo })} />
            {h.showLogo && (
              <>
                <RangeField label="Logo Height" value={h.logoSize} min={24} max={64} onChange={(logoSize) => set({ logoSize })} />
                <Field label="Logo Alignment">
                  <Segmented value={h.alignment} onChange={(alignment) => set({ alignment })} options={ALIGN_OPTIONS} />
                </Field>
              </>
            )}
          </Group>

          <Group title="Buttons & Icons">
            <ToggleRow label="“Visit Store” Button" description={config.store.websiteUrl ? undefined : 'Add your store website in Branding → Store Details.'} checked={h.showStoreButton} onChange={(showStoreButton) => set({ showStoreButton })} />
            {h.showStoreButton && (
              <Field label="Button Text">
                <TextInput value={h.storeButtonText} maxLength={24} onChange={(storeButtonText) => set({ storeButtonText })} placeholder="Visit Store" />
              </Field>
            )}
            <ToggleRow label="Contact Button" description={hasContact ? 'Opens your support email or phone.' : 'Add support email or phone in Branding → Store Details.'} checked={h.showContactButton} onChange={(showContactButton) => set({ showContactButton })} />
            <ToggleRow label="Social Icons" description={hasSocial ? 'Visible on desktop screens.' : 'Add social links in Branding → Social Links.'} checked={h.showSocialIcons} onChange={(showSocialIcons) => set({ showSocialIcons })} />
          </Group>

          <Group title="Behaviour & Colors">
            <ToggleRow label="Sticky Header" description="Header stays visible while customers scroll." checked={h.sticky} onChange={(sticky) => set({ sticky })} />
            <ColorField label="Header Background" value={h.backgroundColor} onChange={(backgroundColor) => set({ backgroundColor })} swatches={['#FFFFFF', '#F8FAFC', '#0F172A', '#111827', config.branding.primaryColor.toUpperCase(), config.branding.secondaryColor.toUpperCase()]} />
          </Group>
        </>
      )}

      <Group title="Announcement Bar" description="A thin strip above the header for offers or delivery notices.">
        <ToggleRow label="Show Announcement Bar" checked={h.showAnnouncement} onChange={(showAnnouncement) => set({ showAnnouncement })} />
        {h.showAnnouncement && (
          <>
            <Field label="Announcement Text">
              <TextInput value={h.announcement} maxLength={120} onChange={(announcement) => set({ announcement })} placeholder="Free shipping on prepaid orders above ₹499" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ColorField label="Bar Background" value={h.announcementBgColor} onChange={(announcementBgColor) => set({ announcementBgColor })} />
              <ColorField label="Bar Text" value={h.announcementTextColor} onChange={(announcementTextColor) => set({ announcementTextColor })} swatches={['#FFFFFF', '#0F172A', '#FEF3C7', '#DCFCE7']} />
            </div>
          </>
        )}
      </Group>
    </div>
  );
}
