'use client';

import { Icon } from './Icon';

/**
 * The one control on the handout that cannot be a server component.
 *
 * Deliberately not a PDF library: the browser's own print dialog saves to PDF on
 * every platform this is likely to be opened on, including the Android phones
 * this audience actually uses, and it adds nothing to the bundle.
 */
export function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-sm bg-teal-700 px-5 py-2.5 text-[14px]
                 font-bold text-white transition hover:bg-teal-600 print:hidden"
    >
      <Icon name="records" size={16} aria-hidden />
      {label}
    </button>
  );
}
