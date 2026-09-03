/**
 * Branded "no search results" illustration — the Quickpost parcel +
 * magnifying-glass artwork, used wherever a search falls back to an empty
 * result set.
 */
export function NoResultsIllustration({ className = '' }: { className?: string }) {
  return (
    <img
      src="/illustrations/no-results.png"
      alt=""
      aria-hidden
      className={`w-full max-w-[460px] mx-auto object-contain ${className}`}
    />
  );
}
