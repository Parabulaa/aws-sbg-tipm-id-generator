import type { LucideIcon } from 'lucide-react';

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
}: EmptyStateProps) {
  return (
    <div className="grid min-h-56 place-items-center px-6 py-10 text-center">
      <div>
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-500">
          <Icon className="size-5" />
        </span>
        <h2 className="mt-4 text-base font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}
