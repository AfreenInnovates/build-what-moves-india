import type { DocumentValues } from '@/lib/case';

/**
 * The four records, drawn as the documents they actually are.
 *
 * A table of differing values tells you there is a mismatch. Seeing LAKSHMI
 * NARAYANAN printed on the Aadhaar card and LAKSHMI SUBRAMANIAN on the PAN tells
 * you what happened to her - she married and one record was never updated. That
 * recognition is the point: people know these documents by sight, and comparing
 * them side by side is exactly what nobody is ever able to do.
 *
 * Every one of these is generated from the case, watermarked, and carries
 * deliberately invalid identifiers. None of them is a copy of a real document
 * and none could be mistaken for one.
 */
const LOOK = {
  aadhaar: {
    title: 'Aadhaar',
    issuer: 'Unique Identification Authority of India',
    band: 'from-[#c94f27] to-[#e08a3c]',
    idLabel: 'Aadhaar number',
  },
  pan: {
    title: 'PAN',
    issuer: 'Income Tax Department',
    band: 'from-[#1a4a7a] to-[#3f7fb5]',
    idLabel: 'Permanent Account Number',
  },
  bank: {
    title: 'Bank passbook',
    issuer: 'Account holder details page',
    band: 'from-[#0f6b4f] to-[#3ba07a]',
    idLabel: 'Account number',
  },
  epfo: {
    title: 'EPFO member profile',
    issuer: "Employees' Provident Fund Organisation",
    band: 'from-teal-800 to-teal-600',
    idLabel: 'UAN',
  },
} as const;

type Kind = keyof typeof LOOK;

function Row({ label, value, differs }: { label: string; value?: string | null; differs: boolean }) {
  return (
    <div className="flex gap-3 border-t border-ink-100 px-4 py-2 first:border-t-0">
      <span className="w-[104px] shrink-0 text-[11.5px] uppercase tracking-[0.06em] text-ink-500">
        {label}
      </span>
      <span
        className={`min-w-0 flex-1 text-[13.5px] ${
          value
            ? differs
              ? 'font-bold text-stop'
              : 'font-semibold text-ink-900'
            : 'italic text-ink-400'
        }`}
      >
        {value || 'not on this record'}
      </span>
    </div>
  );
}

export function SpecimenDocs({
  documents,
  disagrees,
  labels,
}: {
  documents: Record<string, DocumentValues>;
  /** which fields differ across the four, so they can be marked on each card */
  disagrees: Set<string>;
  labels: Record<string, string>;
}) {
  const t = (k: string) => labels[k] ?? k;
  const kinds = (Object.keys(LOOK) as Kind[]).filter((k) => documents[k]);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {kinds.map((kind) => {
        const d = documents[kind];
        const look = LOOK[kind];
        return (
          <figure
            key={kind}
            className="relative overflow-hidden rounded-lg border border-ink-200 bg-white shadow-[0_2px_10px_rgba(16,20,24,0.07)]"
          >
            {/* the watermark sits under the content, at an angle, unmissable */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
            >
              <span className="rotate-[-18deg] text-[26px] font-black uppercase tracking-[0.18em] text-stop/[0.13]">
                {t('Specimen')}
              </span>
            </span>

            <div className={`bg-gradient-to-r ${look.band} px-4 py-2.5`}>
              <p className="text-[14px] font-bold text-white">{t(look.title)}</p>
              <p className="text-[11px] text-white/80">{t(look.issuer)}</p>
            </div>

            <div className="relative z-20">
              <Row label={t('Name')} value={d.name} differs={disagrees.has('name')} />
              <Row label={t('Date of birth')} value={d.dob} differs={disagrees.has('dob')} />
              <Row
                label={t('Parent name')}
                value={d.father_name}
                differs={disagrees.has('father_name')}
              />
              <Row
                label={t(look.idLabel)}
                value={typeof d.id_number === 'string' ? d.id_number : null}
                differs={false}
              />
            </div>

            <figcaption className="border-t border-ink-100 bg-ink-50 px-4 py-2 text-[11.5px] leading-relaxed text-ink-500">
              {t(
                'Generated for this demonstration. The number above is deliberately invalid and this is not a copy of any real document.',
              )}
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}
