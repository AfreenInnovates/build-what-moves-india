import type { IconName } from '@/components/Icon';

/** The dashboard's sections. One list, used by the sidebar and the overview tiles. */
export interface Section {
  href: string;
  icon: IconName;
  label: string;
  blurb: string;
}

export const SECTIONS: Section[] = [
  { href: '/dashboard', icon: 'preflight', label: 'Pre-Flight', blurb: 'Are you ready to file?' },
  { href: '/dashboard/money', icon: 'money', label: 'My Money', blurb: 'Balance and contributions' },
  { href: '/dashboard/employment', icon: 'employment', label: 'My Employment', blurb: 'Every job, and where it broke' },
  { href: '/dashboard/records', icon: 'records', label: 'Record Health', blurb: 'What disagrees, and why' },
  { href: '/dashboard/actions', icon: 'actions', label: 'Action Center', blurb: 'What to fix, and who fixes it' },
  { href: '/dashboard/pension', icon: 'pension', label: 'Pension / EPS', blurb: 'Service years and thresholds' },
  { href: '/dashboard/employer', icon: 'employer', label: 'Employer Requests', blurb: 'Messages ready for HR' },
  { href: '/dashboard/alerts', icon: 'alerts', label: 'Alerts', blurb: 'Everything that needs attention' },
];
