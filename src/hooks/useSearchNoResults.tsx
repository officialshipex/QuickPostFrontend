import { NoResultsIllustration } from '../components/ui/NoResultsIllustration';

interface NoResultsStateProps {
  /** The term the user searched for — shown as "No results for “…”". Omit to show a generic message. */
  query?: string;
  /** Overrides the default title entirely. */
  title?: string;
  /** Short muted line under the title. */
  subtitle?: string;
  className?: string;
}

/**
 * Drop-in replacement for a plain "No results found" line — a branded
 * illustration (open parcel + magnifying glass over a crossed-out document)
 * with a title/subtitle, sized for inline use under any search bar or
 * results list.
 */
function NoResultsState({ query, title, subtitle, className = '' }: NoResultsStateProps) {
  const heading = title ?? (query ? `No results for “${query}”` : 'No results found');
  const caption = subtitle ?? 'Try a different keyword or check the spelling.';

  return (
    <div className={`flex flex-col items-center justify-center text-center py-8 px-4 ${className}`}>
      <NoResultsIllustration />
      <p className="text-[14px] font-bold text-[#0F172A] mt-2">{heading}</p>
      <p className="text-[12.5px] text-[#94A3B8] font-medium mt-1 max-w-[260px]">{caption}</p>
    </div>
  );
}

/**
 * Hook wrapper — returns the ready-to-render empty-state component (bind it
 * with `<NoResultsState query={searchTerm} />` wherever a search currently
 * falls back to plain "No results found" text) plus the bare illustration
 * for callers who want to compose their own copy/layout around it.
 */
export function useSearchNoResults() {
  return { NoResultsState, NoResultsIllustration };
}
