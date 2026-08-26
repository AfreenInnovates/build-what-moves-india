import Link from 'next/link';
import { redirect } from 'next/navigation';
import { loadCase } from '@/lib/case';
import { currentCaseId } from '@/app/actions';
import { Assistant } from '@/components/Assistant';
import { SectionNav } from '@/components/SectionNav';
import { ProgressRing } from '@/components/ProgressRing';
import { BackToCases } from '@/components/BackToCases';
import { Icon } from '@/components/Icon';
import { alerts } from '@/lib/insights';
import { getLang, translator } from '@/lib/i18n';
import { SECTIONS } from '@/lib/sections';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const caseId = await currentCaseId();
  if (!caseId) redirect('/login');

  const c = await loadCase(caseId).catch(() => null);
  if (!c) redirect('/login');

  const { resolution: r, member } = c;
  const applicable = r.gates.filter((g) => g.status !== 'not_applicable').length;
  const done = r.gates.filter((g) => g.status === 'green').length;
  const needsAttention = alerts(c).filter((a) => a.severity !== 'good').length;
  const t = translator(await getLang());
  // translated on the server, where the dictionary lives, then handed to the
  // client nav as plain strings
  const navLabels = Object.fromEntries(SECTIONS.map((s) => [s.href, t(s.label)]));

  return (
    <div className="mx-auto flex w-full max-w-[1680px] gap-0 px-0 lg:px-6">
      <aside className="hidden w-[300px] shrink-0 border-r border-ink-100 bg-white lg:block">
        <div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto px-4 py-6">
          <div className="mb-5 grid grid-cols-2 gap-2">
            <BackToCases className="flex items-center justify-center gap-1.5 rounded-md border-2 border-ink-100 bg-white px-2 py-2.5 text-[13px] font-semibold text-ink-700 transition hover:border-teal-700 hover:text-teal-700 disabled:opacity-60">
              <Icon name="back" size={15} aria-hidden /> {t('Cases')}
            </BackToCases>
            <Link
              href="/"
              className="flex items-center justify-center gap-1.5 rounded-md border-2 border-ink-100 bg-white px-2 py-2.5 text-[13px] font-semibold text-ink-700 transition hover:border-teal-700 hover:text-teal-700"
            >
              <Icon name="home" size={15} aria-hidden /> {t('Home')}
            </Link>
          </div>

          <p className="text-[16px] font-bold text-ink-900">
            {t('Hello')}, {member.display_name.split(' ')[0]}
          </p>
          <p className="tabular text-[12.5px] text-ink-500">UAN {member.uan}</p>

          <div className="mt-4 rounded-lg border border-ink-100 bg-white px-4 py-4" data-tour="countdown">
            <p className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-ink-500">
              {done === applicable ? t('Ready to file in') : t('Your money is')}
            </p>
            <p className="tabular mt-0.5 text-[26px] font-bold leading-none text-signal">
              {r.totalDays}
              <span className="ml-1.5 text-[13px] font-semibold text-ink-500">
                {t('working days away')}
              </span>
            </p>
            <div className="mt-3.5 border-t border-ink-100 pt-3.5">
              <ProgressRing
                done={done}
                total={applicable}
                label={`${applicable > 0 ? Math.round((done / applicable) * 100) : 0}%`}
                sublabel={t('done')}
                size={96}
              />
            </div>
          </div>

          <div className="mt-6">
            <p className="mb-2 px-1 text-[11.5px] font-bold uppercase tracking-[0.08em] text-ink-500">
              {t('Your EPF')}
            </p>
            <SectionNav alertCount={needsAttention} labels={navLabels} />
          </div>

          <div className="mt-6 rounded-sm border-l-4 border-teal-700 bg-teal-50 px-3 py-3">
            <p className="flex items-center gap-1.5 text-[13px] font-bold text-teal-900"><Icon name="explain" size={16} aria-hidden /> {t('Explain My EPF')}</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-teal-700">
              {t('Tap Ask Saathi at the bottom of the screen. Type your question, or just say it out loud.')}
            </p>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>

      <Assistant
        member={{
          name: member.display_name,
          uan: member.uan,
          employer: member.employer_name,
          totalDays: r.totalDays,
        }}
      />
    </div>
  );
}
