import { Intake } from '@/components/Intake';
import { buildOwnCase } from '@/app/actions';

export default function StartPage() {
  return (
    <main className="mx-auto w-full max-w-[720px] px-5 pb-24 pt-10">
      <Intake action={buildOwnCase} />
    </main>
  );
}
