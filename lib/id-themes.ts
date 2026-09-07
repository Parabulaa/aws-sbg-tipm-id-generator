import type { MembershipType } from '@/lib/types';

export const idThemes: Record<MembershipType, {
  label: string;
  surface: string;
  accent: string;
  accentText: string;
  photo: string;
  slot: string;
}> = {
  member: {
    label: 'Member',
    surface: 'bg-[#fffaf0]',
    accent: 'bg-amber-400',
    accentText: 'text-amber-700',
    photo: 'from-amber-100 to-amber-300 text-amber-800',
    slot: 'border-amber-500/60 text-amber-700',
  },
  officer: {
    label: 'Officer',
    surface: 'bg-emerald-50',
    accent: 'bg-emerald-500',
    accentText: 'text-emerald-700',
    photo: 'from-emerald-100 to-emerald-300 text-emerald-800',
    slot: 'border-emerald-500/60 text-emerald-700',
  },
  associate: {
    label: 'Associate Member',
    surface: 'bg-violet-50',
    accent: 'bg-violet-500',
    accentText: 'text-violet-700',
    photo: 'from-violet-100 to-violet-300 text-violet-800',
    slot: 'border-violet-500/60 text-violet-700',
  },
};
