import Link from 'next/link';
import { notFound } from 'next/navigation';
import { loadCase } from '@/lib/case';
import { employerFromToken, requestByRef, markViewed } from '@/lib/employer';
import { employerAction } from '@/app/actions';
import { PROCESSES } from '@/lib/processes';
import { EPFO_SCREENS } from '@/lib/epfo-screens';
import { Icon } from '@/components/Icon';
import { getT } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

/**
 * One request, opened.
 *
 * The employer gets the person's details, the exact change, and where it lives
 * on their own portal - so nobody has to work out what a Joint Declaration is
 * from a WhatsApp message. Opening it records that it was opened, because the
 * member waiting at the other end has no other way of knowing anybody looked.
 */
export default async function EmployerRequestPage({
  params,
}: {
  params: Promise<{ token: string; ref: string }>;
}) {
  const t = await getT();
  const { token, ref } = await params;
  const employer = await employerFromToken(token);
  if (!employer) notFound();

  const req = await requestByRef(employer, ref);
  if (!req) notFound();

  const c = await loadCase(req.case_id).catch(() => null);
  if (!c) notFound();

  const gate = c.resolution.gates.find((g) => g.id === req.gate_id);
  if (!gate) notFound();

  // seeing it counts as opening it; the member's page shows this straight away
  if (req.status === 'pending') await markViewed(employer, ref);

  const done = gate.status === 'green' || req.status === 'done';
  const proc = PROCESSES[req.gate_id];
  const screen = EPFO_SCREENS[req.gate_id];
  const first = req.display_name.split(' ')[0];

  return (
    <main className="mx-auto w-full max-w-[760px] px-5 pb-24 pt-10">
      <Link
        href={`/employer/${token}`}
        className="inline-flex min-h-[44px] items-center gap-1.5 text-[14px] font-semibold text-teal-700 hover:underline"
      >
        <Icon name="back" size={16} aria-hidden /> {t('All requests for')} {employer}
      </Link>

      <p className="mt-5 text-[13px] font-bold uppercase tracking-[0.1em] text-teal-700">
        {t('A request from a former employee')}
      </p>
      <h1 className="mt-2 text-[30px] leading-tight font-bold tracking-tight text-ink-900">
        {req.display_name} {t('needs one thing from you')}
      </h1>

      <dl className="mt-6 grid gap-px overflow-hidden rounded-md border border-ink-100 bg-ink-100 sm:grid-cols-2">
        {[
          [t('Employee'), req.display_name],
          ['UAN', req.uan],
          [t('Establishment'), employer],
          [t('Last working day'), req.date_of_exit ? fmt(req.date_of_exit) : t('not recorded')],
        ].map(([k, v]) => (
          <div key={k} className="bg-white px-4 py-3">
            <dt className="text-[12px] font-bold uppercase tracking-[0.07em] text-ink-500">{k}</dt>
            <dd className="tabular mt-0.5 text-[15px] text-ink-900">{v}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-8 rounded-md border-2 border-ink-100 bg-white p-5">
        <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-stop">{t('What is needed')}</p>
        <h2 className="mt-2 text-[20px] font-bold text-ink-900">{t(gate.title)}</h2>
        <p className="mt-2 text-[15.5px] leading-relaxed text-ink-700">{t(gate.blocks)}</p>

        {proc && (
          <div className="mt-4 rounded-sm bg-ink-50 px-4 py-3">
            <p className="text-[12px] font-bold uppercase tracking-[0.07em] text-ink-500">
              {t('Where this lives on your portal')}
            </p>
            <p className="mt-1 font-mono text-[13px] text-ink-800">{proc.epfoPath}</p>
            {screen && (
              <p className="mt-2 text-[14px] leading-relaxed text-ink-700">
                {t('The screen is')}{' '}
                <span className="font-semibold">{screen.screenTitle}</span>.
              </p>
            )}
          </div>
        )}

        <p className="mt-4 text-[14.5px] leading-relaxed text-ink-600">
          {t(
            'Until this is done their claim cannot move. It is a few minutes of work on a portal you already have access to, and it is the only thing standing between them and money they have already earned.',
          )}
        </p>

        <div className="mt-6">
          {done ? (
            <div className="flex items-center gap-2.5 rounded-md bg-go-soft px-4 py-3 text-[15px] font-semibold text-go">
              <Icon name="check" size={18} aria-hidden />
              {t('Done')}
              {req.done_at ? ` ${t('on')} ${fmt(req.done_at)}` : ''}. {first} {t('has been told.')}
            </div>
          ) : (
            <form action={employerAction}>
              <input type="hidden" name="token" value={token} />
              <input type="hidden" name="ref" value={ref} />
              <button className="w-full rounded-md bg-teal-700 px-6 py-3.5 text-[15.5px] font-bold text-white transition hover:bg-teal-600 sm:w-auto">
                {t('I have done this on the Employer Portal')}
              </button>
            </form>
          )}
        </div>
      </section>

      <p className="mt-6 text-[13.5px] leading-relaxed text-ink-500">
        {t(
          'Marking it done updates their claim straight away, so they can see it has moved without having to ring anyone. In the live system this is where the Employer Portal confirmation would land instead.',
        )}
      </p>
    </main>
  );
}
