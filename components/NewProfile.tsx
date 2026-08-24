import Link from 'next/link';
import { Icon } from './Icon';

/** A short invitation to the full signup flow at /signup. */
export function NewProfile() {
  return (
    <Link
      href="/signup"
      className="card-hover flex items-center gap-4 rounded-xl border-2 border-dashed border-teal-200 bg-teal-50 p-5 transition hover:border-teal-700"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-teal-700">
        <Icon name="people" size={24} aria-hidden />
      </span>
      <div className="flex-1">
        <p className="text-[16px] font-bold text-teal-900">Set up a fresh profile</p>
        <p className="mt-0.5 text-[13.5px] leading-relaxed text-teal-700">
          Enter your own details and employer, then explore every section. For the demo only.
        </p>
      </div>
      <Icon name="route" size={20} className="shrink-0 text-teal-700" aria-hidden />
    </Link>
  );
}
