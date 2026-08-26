import Link from 'next/link';
import { notFound } from 'next/navigation';
import { employerFromToken, requestsForEmployer } from '@/lib/employer';
import { PROCESSES } from '@/lib/processes';
import { Icon } from '@/components/Icon';
import { getT } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

const STATUS = {
  pending: { label: 'Waiting on you', cls: 'bg-stop-soft text-stop' },
  viewed: { label: 'Opened', cls: 'bg-wait-soft text-wait' },
  done: { label: 'Done', cls: 'bg-go-soft text-go' },
} as const;

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '-';

/**
 * What an employer sees: a queue, not a form.
 *
 * One establishment has many former employees, and they stall for the same few
 * reasons. Sending HR a link to a single field would be an improvement on
 * nothing, but the thing that actually gets these cleared is somebody sitting
 * down once and working through the list - so the list is what the link opens.
 */
export default async function EmployerQueue({ params }: { params: Promise<{ token: string }> }) {
  const t = await getT();
  const { token } = await params;
  const employer = await employerFromToken(token);
  if (!employer) notFound();

  const requests = await requestsForEmployer(employer);
  const waiting = requests.filter((r) => r.status !== 'done').length;

  return (
    <main className="mx-auto w-full max-w-[880px] px-5 pb-24 pt-10">
      <div className="rounded-md border-l-4 border-wait bg-wait-soft px-4 py-3">
        <p className="text-[13.5px] leading-relaxed text-ink-800">
          <span className="font-bold">{t('A demonstration.')}</span>{' '}
          {t(
            'This is what an employer would see if former employees sent them these links. Nothing here reaches EPFO. In production this would sit behind a verified employer account and the link would expire; here anyone holding it can open it, and we are not pretending otherwise.',
          )}
        </p>
      </div>

      <p className="mt-8 text-[13px] font-bold uppercase tracking-[0.1em] text-teal-700">
        {t('Requests from former employees')}
      </p>
      <h1 className="mt-2 text-[32px] leading-tight font-bold tracking-tight text-ink-900">
        {employer}
      </h1>
      <p className="mt-3 max-w-[62ch] text-[16px] leading-relaxed text-ink-700">
        {waiting === 0
          ? t('Nothing is waiting on you. Every request here has been actioned.')
          : `${waiting} ${
              waiting === 1 ? t('person is waiting on you.') : t('people are waiting on you.')
            } ${t('Each one is a few minutes on a portal you already have access to, and until it is done their money stays where it is.')}`}
      </p>

      {requests.length === 0 ? (
        <div className="mt-8 rounded-lg border border-ink-100 bg-white px-5 py-8 text-center">
          <p className="text-[15.5px] text-ink-700">
            {t('No requests have been sent to this establishment yet.')}
          </p>
        </div>
      ) : (
        <ul className="mt-7 space-y-3">
          {requests.map((r) => {
            const s = STATUS[r.status];
            const proc = PROCESSES[r.gate_id];
            return (
              <li key={r.ref}>
                <Link
                  href={`/employer/${token}/${r.ref}`}
                  className="card-hover group block rounded-lg border border-ink-100 bg-white px-5 py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[17px] font-bold text-ink-900">{r.display_name}</p>
                      <p className="tabular mt-0.5 text-[13px] text-ink-500">
                        UAN {r.uan} · {t('sent')} {fmt(r.created_at)}
                        {r.viewed_at && ` · ${t('opened')} ${fmt(r.viewed_at)}`}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[12px] font-bold ${s.cls}`}>
                      {t(s.label)}
                    </span>
                  </div>

                  <p className="mt-2.5 text-[15px] leading-relaxed text-ink-700">
                    {t(proc?.name ?? r.gate_id)}
                  </p>

                  <span className="mt-3 inline-flex items-center gap-1.5 text-[14px] font-bold text-teal-700 group-hover:underline">
                    {r.status === 'done' ? t('See what you did') : t('Open this request')}
                    <Icon name="arrow" size={15} aria-hidden />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-8 text-[13.5px] leading-relaxed text-ink-500">
        {t(
          'Each request opens onto that person’s details and the one change they need, already filled in. Marking it done updates their claim immediately, so they can see it has moved without having to ring anyone.',
        )}
      </p>
    </main>
  );
}
