import { MapPin } from 'lucide-react';

interface LocationChipProps {
  label: string;
  city: string;
  state: string;
}

function LocationChip({ label, city, state }: LocationChipProps) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <MapPin className="w-[18px] h-[18px] text-[#4C6FE0]" fill="#4C6FE0" strokeWidth={0} />
        <span className="text-[14px] font-bold text-[#0F172A]">{label}</span>
      </div>
      <div className="rounded-xl border-2 border-dashed border-[#C7CFFA] bg-[#F5F6FE] px-5 py-3.5 text-center">
        <div className="text-[13px] text-[#94A3B8] font-medium">{city || 'City,'}</div>
        <div className="text-[17px] text-[#475569] font-bold">{state || 'State'}</div>
      </div>
    </div>
  );
}

export function RouteSummary({
  pickupCity, pickupState, deliveryCity, deliveryState,
}: {
  pickupCity: string; pickupState: string; deliveryCity: string; deliveryState: string;
}) {
  return (
    <div className="relative z-10 w-full max-w-[340px] mx-auto animate-[strapFadeIn_0.4s_ease-out]">
      <LocationChip label="Pickup Location" city={pickupCity} state={pickupState} />

      <div className="flex justify-center py-1.5">
        <div className="w-px h-6 border-l-2 border-dashed border-[#C7CFFA]" />
      </div>

      <LocationChip label="Delivery Location" city={deliveryCity} state={deliveryState} />

      <div className="mt-4">
        <img src="/illustrations/rate.png" alt="" className="w-full max-w-[280px] mx-auto" aria-hidden />
      </div>
    </div>
  );
}
