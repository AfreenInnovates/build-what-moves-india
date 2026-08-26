import Link from 'next/link';
import { Icon } from './Icon';
import { getT } from '@/lib/i18n';

/**
 * The seventh tile in the picker. Shaped like the six people beside it, because
 * setting up your own case is a peer choice, not an afterthought below the grid.
 */
export async function NewProfile() {
  const t = await getT();
  return (
    <Link
      href="/signup"
      className="card-hover group flex h-full flex-col rounded-xl border-2 border-dashed border-teal-200 bg-teal-50/60 p-5 transition hover:border-teal-700 hover:bg-teal-50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[17.5px] font-bold text-teal-900">{t('Set up your own')}</p>
          <span className="mt-1 inline-block rounded-full bg-white px-2.5 py-1 text-[12.5px] font-semibold text-teal-700">
            {t('Takes a minute')}
          </span>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-teal-700">
          <Icon name="people" size={22} aria-hidden />
        </span>
      </div>

      <p className="mt-3.5 flex-1 text-[14px] leading-relaxed text-teal-800">
        Enter your own name and employer, then walk through every section with your case instead of
        someone else&rsquo;s.
      </p>

      <div className="mt-4 flex items-center justify-between border-t border-teal-200 pt-3.5 text-[12.5px] text-teal-700">
        <span>{t('For the demo only')}</span>
        <span className="inline-flex items-center gap-1 font-semibold">
          Start <Icon name="route" size={13} aria-hidden />
        </span>
      </div>
    </Link>
  );
}
