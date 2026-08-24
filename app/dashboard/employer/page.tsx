import { redirect } from 'next/navigation';
import Link from 'next/link';
import { loadCase } from '@/lib/case';
import { currentCaseId } from '@/app/actions';
import { PageHead } from '@/components/panels';

export default async function EmployerPage() {
  const caseId = await currentCaseId();
  if (!caseId) redirect('/login');
  const c = await loadCase(caseId).catch(() => null);
  if (!c) redirect('/login');

  const { member, resolution: r } = c;
  const employerGates = r.gates.filter((g) => g.actor === 'employer' && g.status !== 'green' && g.status !== 'not_applicable');

  const draftFor = (title: string, ask: string) =>
    `Hello,\n\nI am a former employee (UAN ${member.uan}). To release my EPF, I need the following corrected on the EPFO Employer Portal:\n\n${ask}\n\nCould you please action this at the earliest? It takes a few minutes on the portal and my claim cannot proceed without it.\n\nThank you,\n${member.display_name}`;

  const ASKS: Record<string, string> = {
    records_agree: 'Raise a KYC correction so my name and date of birth match my Aadhaar exactly.',
    exit_marked: 'Mark my date of exit (my last working day) against my PF account.',
    service_history: 'Attest my transfer request so my previous service can be merged into one UAN.',
  };

  return (
    <main className="px-5 pb-28 pt-7 lg:pl-9 lg:pr-6">
      <PageHead
        icon="employer"
        title="Employer Requests"
        lead="Some fixes only your employer can make, on a portal you cannot see. Here are the messages, written and ready — naming the exact action so whoever reads it does not have to work out what you need."
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
                <h2 className="text-[16px] font-bold text-ink-900">{g.title}</h2>
                <Link href={`/dashboard/fix/${g.id}`} className="shrink-0 text-[13px] font-semibold text-teal-700 hover:underline">
                  How this works →
                </Link>
              </div>
              <p className="mt-1 text-[13.5px] text-ink-600">{g.blocks}</p>
              <pre className="mt-3 whitespace-pre-wrap rounded-sm bg-ink-50 px-4 py-3.5 font-sans text-[13.5px] leading-relaxed text-ink-800">
{draftFor(g.title, ASKS[g.id] ?? 'Please action the pending correction on my PF account.')}
              </pre>
              <p className="mt-2 text-[12.5px] text-ink-500">
                Copy this into WhatsApp or email to your HR contact. Nothing is sent for you — you
                stay in control of who it goes to.
              </p>
            </section>
          ))
        )}
      </div>
    </main>
  );
}
