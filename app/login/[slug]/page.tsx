import Link from 'next/link';
import { notFound } from 'next/navigation';
import { one } from '@/lib/db';
import { DemoLogin } from '@/components/DemoLogin';
import { Icon } from '@/components/Icon';
import type { MemberRow } from '@/lib/case';


export const dynamic = 'force-dynamic';

export default async function PersonaLoginPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = await one<MemberRow>(`select * from members where slug = $1`, [slug]);
  if (!m) notFound();


  return (
    <main className="mx-auto w-full max-w-[460px] px-5 pb-28 pt-12">
      <Link
        href="/login"
        className="inline-flex min-h-[44px] items-center gap-1.5 text-[14px] font-semibold text-teal-700 hover:underline"
      >
        <Icon name="back" size={16} aria-hidden /> All cases
      </Link>

      <div className="mt-4 mb-6">
        <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-teal-600">Sign in as</p>
        <h1 className="mt-1 text-[30px] font-bold tracking-tight text-ink-900">{m.display_name}</h1>
        <p className="tabular mt-0.5 text-[13.5px] text-ink-500">
          UAN {m.uan} · {m.employer_name}
        </p>
      </div>

      <DemoLogin slug={m.slug} name={m.display_name} uan={m.uan} password={m.demo_password} />
    </main>
  );
}
