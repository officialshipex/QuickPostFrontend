import { useRef, useState } from 'react';
import { Upload, X, AlertCircle } from 'lucide-react';

// Loads the picked file into an off-DOM Image() and checks naturalWidth/
// naturalHeight before accepting it — same technique as
// src/components/ui/ProtectedAdImage.tsx, just used for validation here
// instead of rendering. This is a client-side convenience check only; the
// backend does not currently re-validate dimensions on upload.
export function ImageDimensionUpload({
  label, requiredWidth, requiredHeight, value, onFileValidated, onClear, required,
}: {
  label: string;
  requiredWidth: number;
  requiredHeight: number;
  value: string | null;
  onFileValidated: (file: File, previewUrl: string) => void;
  onClear?: () => void;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const handleFile = (file: File | null) => {
    if (!file) return;
    setError('');
    setChecking(true);
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setChecking(false);
      if (img.naturalWidth !== requiredWidth || img.naturalHeight !== requiredHeight) {
        setError(`Must be exactly ${requiredWidth}×${requiredHeight}px (this is ${img.naturalWidth}×${img.naturalHeight}px)`);
        URL.revokeObjectURL(objectUrl);
        return;
      }
      onFileValidated(file, objectUrl);
    };
    img.onerror = () => {
      setChecking(false);
      setError('Could not read that image file');
      URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="text-[12px] font-semibold text-[#64748B]">
        {label}{required && <span className="text-red-500"> *</span>}
        <span className="text-[#94A3B8] font-normal"> ({requiredWidth}×{requiredHeight}px)</span>
      </label>
      <div className="flex items-center gap-3">
        {value ? (
          <div className="relative w-16 h-16 rounded-[8px] border border-[#E2E8F0] overflow-hidden shrink-0 bg-[#F8FAFC] flex items-center justify-center">
            <img src={value} alt={label} className="max-w-full max-h-full object-contain" />
            {onClear && (
              <button
                type="button"
                onClick={onClear}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center text-[#94A3B8] hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-16 h-16 rounded-[8px] border border-dashed border-[#E2E8F0] flex items-center justify-center text-[#94A3B8] hover:border-[#00A86B] hover:text-[#00A86B] transition-colors shrink-0"
          >
            <Upload className="w-5 h-5" />
          </button>
        )}
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-[12px] font-semibold text-[#00A86B] hover:text-[#008F5C] text-left"
          >
            {checking ? 'Checking…' : value ? 'Replace image' : 'Choose image'}
          </button>
          {error && (
            <span className="text-[11px] text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />{error}
            </span>
          )}
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files?.[0] || null)} />
    </div>
  );
}
