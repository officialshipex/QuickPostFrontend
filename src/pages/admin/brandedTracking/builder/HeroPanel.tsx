import { Field, Group, ImageUpload, RangeField, Segmented, TextArea, TextInput, ToggleRow } from './controls';
import { ALIGN_OPTIONS } from './sectionMeta';
import type { PanelProps } from './panelTypes';

const SEARCH_DESCRIPTION = 'Enter your AWB or order ID to see the latest delivery updates.';
const LINK_DESCRIPTION = 'Live delivery updates for your order, straight from the courier.';

export function HeroPanel({ config, update, onError }: PanelProps) {
  const hero = config.hero;
  const set = (patch: Partial<typeof hero>) => update('hero', patch);

  return (
    <div>
      <div className="py-4 border-b border-[#F1F5F9]">
        <ToggleRow
          label="Show Hero Section"
          description={!hero.showSearch ? 'Heading, description and banner at the top of the page.' : hero.enabled ? 'The tracking search box sits inside the hero.' : 'Search box moves to the top of the tracking section.'}
          checked={hero.enabled}
          onChange={(enabled) => set({ enabled })}
        />
        <ToggleRow
          label="Show AWB / Order ID Search Bar"
          description={hero.showSearch
            ? 'Customers can look up any shipment by AWB or order ID.'
            : 'Hidden. Customers see their shipment only through the tracking link (…/track/your-store?awb=AWB_NUMBER) shared in order SMS and emails.'}
          checked={hero.showSearch}
          onChange={(showSearch) => {
            // Swap the stock description so it never asks customers to use a search box that isn't there.
            const stock = showSearch ? LINK_DESCRIPTION : SEARCH_DESCRIPTION;
            set({ showSearch, ...(hero.description === stock ? { description: showSearch ? SEARCH_DESCRIPTION : LINK_DESCRIPTION } : {}) });
          }}
        />
      </div>

      <Group title="Content">
        <Field label="Heading">
          <TextInput value={hero.title} maxLength={60} onChange={(title) => set({ title })} placeholder="Track Your Order" />
        </Field>
        {hero.enabled && (
          <Field label="Description">
            <TextArea rows={2} maxLength={160} value={hero.description} onChange={(description) => set({ description })} placeholder="Enter your tracking number to see the latest delivery updates." />
          </Field>
        )}
      </Group>

      {hero.enabled && (
        <>
          <Group title="Banner Image" description="Optional. Text turns white automatically over images.">
            <ImageUpload label="Background Image" aspect="banner" maxKb={1024} hint="Recommended 1920×640 px, JPG or WebP, under 1 MB." value={hero.bannerImage} onChange={(bannerImage) => set({ bannerImage })} onError={onError} />
            {hero.bannerImage && (
              <RangeField label="Image Overlay" unit="%" value={hero.overlayOpacity} min={0} max={85} step={5} onChange={(overlayOpacity) => set({ overlayOpacity })} />
            )}
          </Group>

          <Group title="Layout">
            <Field label="Content Alignment">
              <Segmented value={hero.alignment} onChange={(alignment) => set({ alignment })} options={ALIGN_OPTIONS} />
            </Field>
            <Field label="Section Height">
              <Segmented
                value={hero.height}
                onChange={(height) => set({ height })}
                options={[{ value: 'compact', label: 'Compact' }, { value: 'standard', label: 'Standard' }, { value: 'large', label: 'Large' }]}
              />
            </Field>
          </Group>

          <Group title="Call to Action" description={hero.showSearch ? 'A secondary link below the search box.' : 'A secondary link below the description.'}>
            <ToggleRow label="Show CTA Link" checked={hero.showCta} onChange={(showCta) => set({ showCta })} />
            {hero.showCta && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Link Text">
                  <TextInput value={hero.ctaText} maxLength={30} onChange={(ctaText) => set({ ctaText })} placeholder="Continue Shopping" />
                </Field>
                <Field label="Link URL">
                  <TextInput value={hero.ctaUrl} onChange={(ctaUrl) => set({ ctaUrl })} placeholder="https://yourstore.com" />
                </Field>
              </div>
            )}
          </Group>
        </>
      )}
    </div>
  );
}
