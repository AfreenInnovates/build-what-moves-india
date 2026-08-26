import type { IconName } from '@/components/Icon';

/** The dashboard's sections. One list, used by the sidebar and the overview tiles. */
export interface Section {
  href: string;
  icon: IconName;
  label: string;
  blurb: string;
}

export const SECTIONS: Section[] = [
  {
    href: '/dashboard',
    icon: 'preflight',
    label: 'Pre-Flight',
    blurb: 'Can you send your claim today, or will it get rejected? A yes or no, and why.',
  },
  {
    href: '/dashboard/money',
    icon: 'money',
    label: 'My Money',
    blurb: 'How much money you have saved up, and which job each part of it came from.',
  },
  {
    href: '/dashboard/employment',
    icon: 'employment',
    label: 'My Employment',
    blurb: 'Every job EPFO has on your record, and which one the problem started at.',
  },
  {
    href: '/dashboard/records',
    icon: 'records',
    label: 'Record Health',
    blurb: 'Your name and date of birth as written on Aadhaar, PAN, your bank and EPFO, side by side, so you can see what does not match.',
  },
  {
    href: '/dashboard/actions',
    icon: 'actions',
    label: 'Action Center',
    blurb: 'Your money is stuck. This is every step needed to free it, in the order you should do them.',
  },
  {
    href: '/dashboard/pension',
    icon: 'pension',
    label: 'Pension / EPS',
    blurb: 'How many years you have worked, and whether you get your pension as one payment or monthly after 58.',
  },
  {
    href: '/dashboard/employer',
    icon: 'employer',
    label: 'Employer Requests',
    blurb: 'Some fixes only your company can make. These are ready-written messages you can send them.',
  },
  {
    href: '/dashboard/alerts',
    icon: 'alerts',
    label: 'Alerts',
    blurb: 'Everything that needs you to decide something, with the ones costing you the most time first.',
  },
];
