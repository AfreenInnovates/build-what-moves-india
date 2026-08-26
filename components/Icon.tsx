import type { SVGProps } from 'react';
import {
  LuTarget,
  LuWallet,
  LuBriefcase,
  LuShieldCheck,
  LuTriangleAlert,
  LuTrendingUp,
  LuHandshake,
  LuBell,
  LuSparkles,
  LuList,
  LuClock,
  LuUsers,
  LuLink,
  LuShield,
  LuSearch,
  LuRoute,
  LuCircleCheck,
  LuZap,
  LuChevronLeft,
  LuHouse,
  LuKeyRound,
  LuSmartphone,
  LuEye,
  LuChevronDown,
  LuChevronUp,
  LuArrowRight,
} from 'react-icons/lu';
import type { IconType } from 'react-icons';

export type IconName =
  | 'preflight'
  | 'money'
  | 'employment'
  | 'records'
  | 'actions'
  | 'pension'
  | 'employer'
  | 'alerts'
  | 'explain'
  | 'gates'
  | 'clock'
  | 'people'
  | 'link'
  | 'shield'
  | 'search'
  | 'route'
  | 'check'
  | 'bolt'
  | 'back'
  | 'home'
  | 'key'
  | 'phone'
  | 'eye'
  | 'down'
  | 'up'
  | 'arrow';

const MAP: Record<IconName, IconType> = {
  preflight: LuTarget,
  money: LuWallet,
  employment: LuBriefcase,
  records: LuShieldCheck,
  actions: LuTriangleAlert,
  pension: LuTrendingUp,
  employer: LuHandshake,
  alerts: LuBell,
  explain: LuSparkles,
  gates: LuList,
  clock: LuClock,
  people: LuUsers,
  link: LuLink,
  shield: LuShield,
  search: LuSearch,
  route: LuRoute,
  check: LuCircleCheck,
  bolt: LuZap,
  back: LuChevronLeft,
  home: LuHouse,
  key: LuKeyRound,
  phone: LuSmartphone,
  eye: LuEye,
  down: LuChevronDown,
  up: LuChevronUp,
  arrow: LuArrowRight,
};

/** One icon set for the whole app, from Lucide via react-icons. */
export function Icon({
  name,
  size = 20,
  ...rest
}: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  const C = MAP[name];
  return <C size={size} strokeWidth={2} {...rest} />;
}
