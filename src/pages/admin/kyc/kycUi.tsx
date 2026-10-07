/* Shared KYC form primitives — used by both the e-KYC and manual KYC flows. */

export function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[12px] md:text-[13px] font-semibold text-[#0F172A] mb-1.5">
      {children} {required && <span className="text-red-500">*</span>}
    </label>
  );
}
