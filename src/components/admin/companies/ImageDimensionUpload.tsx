import { useRef, useState } from 'react';
import { Upload, X, AlertCircle } from 'lucide-react';

const MAX_FILE_SIZE_MB = 2;

// Loads the picked file into an off-DOM Image() and checks its real
// dimensions/shape before accepting it — same technique as
// src/components/ui/ProtectedAdImage.tsx, just used for validation here
// instead of rendering. This is a client-side convenience check only; the
// backend does not currently re-validate dimensions on upload.
//
// Checks a MINIMUM resolution and an aspect-ratio RANGE rather than one
// exact pixel size — a real company logo is essentially never a perfect
// square (ShipexFrontend's own current logo is a ~2.6:1 wide wordmark), so
// forcing e.g. exactly 512×512 just forces every admin to pre-distort their
// logo into a square before they can upload it, which is what was actually
// making logos look wrong everywhere they render downstream.
export function ImageDimensionUpload({
  label, minWidth, minHeight, aspectRatio, value, onFileValidated, onClear, required, hint,
}: {
  label: string;
  minWidth: number;
  minHeight: number;
  aspectRatio: { min: number; max: number }; // width / height
  value: string | null;
  onFileValidated: (file: File, previewUrl: string) => void;
  onClear?: () => void;
  required?: boolean;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const handleFile = (file: File | null) => {
    if (!file) return;
    setError('');

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File is too large — please keep it under ${MAX_FILE_SIZE_MB}MB`);
      return;
    }

    setChecking(true);
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setChecking(false);
      const { naturalWidth: w, naturalHeight: h } = img;

      if (w < minWidth || h < minHeight) {
        setError(`Too small — needs to be at least ${minWidth}×${minHeight}px (this is ${w}×${h}px)`);
        URL.revokeObjectURL(objectUrl);
        return;
      }

      const ratio = w / h;
      if (ratio < aspectRatio.min || ratio > aspectRatio.max) {
        setError(`Wrong shape for this spot (this image is ${w}×${h}px) — ${hint || 'try a different image'}`);
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
        {hint && <span className="text-[#94A3B8] font-normal"> ({hint})</span>}
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
