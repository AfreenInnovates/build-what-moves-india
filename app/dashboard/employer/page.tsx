import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { loadCase } from '@/lib/case';
import { currentCaseId } from '@/app/actions';
import { headers } from 'next/headers';
import { getT } from '@/lib/i18n';
import { employerToken, requestsForCase } from '@/lib/employer';
import { SendToEmployer } from '@/components/SendToEmployer';
import { fill } from '@/lib/insights';
import { PageHead } from '@/components/panels';

export default async function EmployerPage() {
  const caseId = await currentCaseId();
  if (!caseId) redirect('/login');
  const c = await loadCase(caseId).catch(() => null);
  if (!c) redirect('/login');
  const t = await getT();
  // the link has to be openable from another device, so it needs the real host
  const h = await headers();
  const base = `${h.get('x-forwarded-proto') ?? 'http'}://${h.get('host') ?? 'localhost:3000'}`;
  // one link per establishment; it opens their whole queue, not a single form
  const link = `${base}/employer/${employerToken(c.member.employer_name)}`;

  const { member, resolution: r } = c;
  const sent = new Map(
    (await requestsForCase(c.caseId)).map((r) => [
      r.gate_id as string,
      { status: r.status, viewedAt: r.viewed_at },
    ]),
  );

  /**
   * Outstanding employer steps, plus any you have already sent.
   *
   * A finished step used to drop out of this list the moment the employer acted,
   * which took the "your employer has done this" message with it - so the one
   * thing you were waiting to be told simply vanished. Anything you have sent
   * stays here, showing where it got to.
   */
  const employerGates = r.gates.filter(
    (g) =>
      g.status !== 'not_applicable' &&
      // still outstanding and theirs to do, or something you already sent -
      // a cleared gate has no route and therefore no actor, so asking for
      // actor === 'employer' quietly dropped exactly the ones just completed
      ((g.actor === 'employer' && g.status !== 'green') || sent.has(g.id)),
  );

  // Written in the reader's language too. The person sending this may not read
  // English, and a message you cannot read is one you cannot check before it
  // goes to your old employer.
  const draftFor = (title: string, ask: string) =>
    [
      t('Hello,'),
      '',
      fill(
        t(
          'I am a former employee (UAN {uan}). To release my EPF, I need the following corrected on the EPFO Employer Portal:',
        ),
        { uan: member.uan },
      ),
      '',
      ask,
      '',
      t(
        'Could you please action this at the earliest? It takes a few minutes on the portal and my claim cannot proceed without it.',
      ),
      '',
      t('Thank you,'),
      member.display_name,
    ].join('\n');

  const ASKS: Record<string, string> = {
    records_agree: t(
      'Raise a KYC correction so my name and date of birth match my Aadhaar exactly.',
    ),
    exit_marked: t('Mark my date of exit (my last working day) against my PF account.'),
    service_history: t(
      'Attest my transfer request so my previous service can be merged into one UAN.',
    ),
  };

  return (
    <main className="px-5 pb-28 pt-7 lg:pl-9 lg:pr-6">
      <PageHead
        icon="employer"
        title={t("Employer Requests")}
        lead={t("Some fixes only your employer can make, on a portal you cannot see. Here are the messages, written and ready - naming the exact action so whoever reads it does not have to work out what you need.")}
      />
      <div className="mt-6 max-w-[760px] space-y-5">
        {employerGates.length === 0 ? (
          <div className="rounded-md border-l-4 border-go bg-go-soft px-4 py-4 text-[15px] text-ink-800">
            Nothing here needs your employer right now. Every remaining step is either yours to do or
            EPFO&rsquo;s.
          </div>
        ) : (
          employerGates.map((g) => (
            <section key={g.id} className="rounded-md border border-ink-100 bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[16px] font-bold text-ink-900">{t(g.title)}</h2>
                <Link href={`/dashboard/fix/${g.id}`} className="shrink-0 text-[13px] font-semibold text-teal-700 hover:underline">
                  {t('How this works')} <Icon name="arrow" size={14} aria-hidden />
                </Link>
              </div>
              <p className="mt-1 text-[13.5px] text-ink-600">{t(g.blocks)}</p>
              <pre className="mt-3 whitespace-pre-wrap rounded-sm bg-ink-50 px-4 py-3.5 font-sans text-[13.5px] leading-relaxed text-ink-800">
{draftFor(t(g.title), ASKS[g.id] ?? t('Please action the pending correction on my PF account.'))}
              </pre>
              <p className="mt-2 text-[12.5px] text-ink-500">
                {t('Nothing is sent for you - you stay in control of who it goes to.')}
              </p>
              <SendToEmployer
                gateId={g.id}
                link={link}
                status={(sent.get(g.id)?.status as 'pending' | 'viewed' | 'done') ?? 'none'}
                viewedAt={
                  sent.get(g.id)?.viewedAt
                    ? new Date(sent.get(g.id)!.viewedAt!).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })
                    : null
                }
                labels={Object.fromEntries(
                  [
                    'Send this to my employer',
                    'Sending',
                    'This creates a link that opens onto the one thing they have to do, with your details already filled in. You choose who to send it to.',
                    'Sent. Waiting on your employer',
                    'The request is sitting with your old company. You will see here the moment somebody opens it.',
                    'Your employer has opened this',
                    'Somebody at your old company has looked at your request. It has not been marked done yet.',
                    'Your employer has done this',
                    'They opened your request and marked it complete. This step is no longer holding up your claim.',
                    'Copy the link again',
                    'Copied',
                  ].map((k) => [k, t(k)]),
                )}
              />
            </section>
          ))
        )}
      </div>
    </main>
  );
}
