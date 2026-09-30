// No color picker exists elsewhere in this codebase yet — a native
// <input type="color"> paired with a hex text input keeps this dependency-free.
export function ColorField({
  label, value, onChange, required,
}: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[12px] font-semibold text-[#64748B]">
        {label}{required && <span className="text-red-500"> *</span>}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : '#00A86B'}
          onChange={e => onChange(e.target.value)}
          className="w-10 h-10 rounded-[8px] border border-[#E2E8F0] cursor-pointer p-0.5 shrink-0"
        />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="#00A86B"
          className="flex-1 border border-[#E2E8F0] rounded-[8px] px-3 py-2 text-[12px] text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#00A86B]/40 focus:border-[#00A86B] transition-colors"
        />
      </div>
    </div>
  );
}
