'use client';

/**
 * Scrolls to a section without writing to the address bar.
 *
 * An anchor link does the scrolling for free but leaves "#how" in the URL, so a
 * refresh or a shared link lands halfway down the page with no explanation.
 * This does the same scroll and leaves the address alone.
 */
export function ScrollTo({
  to,
  className = '',
  children,
}: {
  /** the id to scroll to, without the hash */
  to: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() =>
        document.getElementById(to)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      className={className}
    >
      {children}
    </button>
  );
}
