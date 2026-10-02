import { ColorField, Field, Group, TextArea, TextInput, ToggleRow } from './controls';
import type { PanelProps } from './panelTypes';

export function FooterPanel({ config, update }: PanelProps) {
  const f = config.footer;
  const s = config.store;
  const set = (patch: Partial<typeof f>) => update('footer', patch);
  const missing = (v: string, what: string) => (v.trim() ? undefined : `Add ${what} in Branding → Store Details.`);

  return (
    <div>
      <div className="py-4 border-b border-[#F1F5F9]">
        <ToggleRow label="Show Footer" checked={f.enabled} onChange={(enabled) => set({ enabled })} />
      </div>

      {f.enabled && (
        <>
          <Group title="Content">
            <ToggleRow label="Show Logo" checked={f.showLogo} onChange={(showLogo) => set({ showLogo })} />
            <Field label="Footer Text">
              <TextArea rows={2} maxLength={200} value={f.text} onChange={(text) => set({ text })} placeholder="A short note about your store" />
            </Field>
            <Field label="Copyright">
              <TextInput value={f.copyright} maxLength={100} onChange={(copyright) => set({ copyright })} placeholder={`© ${new Date().getFullYear()} Your Store`} />
            </Field>
          </Group>

          <Group title="Links">
            <ToggleRow label="Policy Links" description="Privacy, Terms and Refund policy." checked={f.showPolicyLinks} onChange={(showPolicyLinks) => set({ showPolicyLinks })} />
            {f.showPolicyLinks && (
              <div className="space-y-3">
                <Field label="Privacy Policy URL"><TextInput value={f.privacyUrl} onChange={(privacyUrl) => set({ privacyUrl })} placeholder="https://yourstore.com/privacy" /></Field>
                <Field label="Terms & Conditions URL"><TextInput value={f.termsUrl} onChange={(termsUrl) => set({ termsUrl })} placeholder="https://yourstore.com/terms" /></Field>
                <Field label="Refund Policy URL"><TextInput value={f.refundUrl} onChange={(refundUrl) => set({ refundUrl })} placeholder="https://yourstore.com/refunds" /></Field>
              </div>
            )}
            <ToggleRow label="Contact Us Link" checked={f.showContactUs} onChange={(showContactUs) => set({ showContactUs })} />
            {f.showContactUs && (
              <Field label="Contact Page URL" hint="Leave blank to use your support email or phone.">
                <TextInput value={f.contactUrl} onChange={(contactUrl) => set({ contactUrl })} placeholder="https://yourstore.com/contact" />
              </Field>
            )}
          </Group>

          <Group title="Contact & Social">
            <ToggleRow label="Phone Number" description={missing(s.supportPhone, 'a support phone')} checked={f.showPhone} onChange={(showPhone) => set({ showPhone })} />
            <ToggleRow label="Email" description={missing(s.supportEmail, 'a support email')} checked={f.showEmail} onChange={(showEmail) => set({ showEmail })} />
            <ToggleRow label="WhatsApp" description={missing(s.whatsappNumber, 'a WhatsApp number')} checked={f.showWhatsapp} onChange={(showWhatsapp) => set({ showWhatsapp })} />
            <ToggleRow label="Social Media Links" description={Object.values(s.social).some((v) => v.trim()) ? undefined : 'Add social links in Branding → Social Links.'} checked={f.showSocialLinks} onChange={(showSocialLinks) => set({ showSocialLinks })} />
          </Group>

          <Group title="Appearance">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ColorField label="Footer Background" value={f.backgroundColor} onChange={(backgroundColor) => set({ backgroundColor })} swatches={['#0F172A', '#020617', '#111827', '#FFFFFF', '#F8FAFC', config.branding.secondaryColor.toUpperCase()]} />
              <ColorField label="Footer Text" value={f.textColor} onChange={(textColor) => set({ textColor })} swatches={['#CBD5E1', '#94A3B8', '#FFFFFF', '#334155', '#0F172A']} />
            </div>
            <ToggleRow label="“Powered by QuickPost”" description="Shown in the bottom bar of the footer." checked={f.showPoweredByQuickPost} onChange={(showPoweredByQuickPost) => set({ showPoweredByQuickPost })} />
          </Group>
        </>
      )}
    </div>
  );
}
