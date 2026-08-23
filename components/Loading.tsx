/** Shown by Next while a route's data is being fetched. */
export function FullPageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="deferred flex min-h-[70vh] flex-col items-center justify-center gap-4 px-5">
      <svg className="animate-spin text-teal-700" width="34" height="34" viewBox="0 0 20 20" aria-hidden>
        <circle
          cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeDasharray="38" strokeDashoffset="12" strokeLinecap="round"
        />
      </svg>
      <p className="text-[15px] font-semibold text-ink-700">{label}</p>
      <span className="sr-only" role="status">{label}</span>
    </div>
  );
}
