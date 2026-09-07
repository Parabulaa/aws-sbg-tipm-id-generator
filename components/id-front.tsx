import type { Member } from '@/lib/types';
import { idThemes } from '@/lib/id-themes';

type IdFrontProps = {
  member: Member;
};

export function IDFront({ member }: IdFrontProps) {
  const theme = idThemes[member.membershipType];

  return (
    <div className={`relative flex h-full flex-col overflow-hidden text-slate-950 ${theme.surface}`}>
      <div className={`absolute right-0 top-0 h-48 w-28 ${theme.accent}`} />
      <div className="absolute right-7 top-24 grid grid-cols-3 gap-1 opacity-70">
        {Array.from({ length: 15 }, (_, index) => <span key={index} className="size-2 bg-slate-950" />)}
      </div>
      <div className={`absolute -left-20 bottom-20 size-48 rotate-45 rounded-[32px] border-[26px] opacity-40 ${theme.accent}`} />

      <header className="relative z-10 p-7 pb-4">
        <div className="flex items-start gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-slate-950 text-sm font-black text-amber-400">AWS</span>
          <div className="pt-1">
            <p className="text-[11px] font-black leading-tight tracking-wide">AWS STUDENT BUILDER GROUP</p>
            <p className="mt-1 max-w-[190px] text-[7px] font-semibold leading-tight text-slate-600">
              TECHNOLOGICAL INSTITUTE OF THE PHILIPPINES<br />MANILA
            </p>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center px-7 pt-6 text-center">
        <div className={`grid aspect-[4/5] w-[68%] place-items-center overflow-hidden rounded-[22px] border-4 border-white bg-gradient-to-br text-5xl font-black shadow-lg shadow-slate-900/10 ${theme.photo}`}>
          {member.fullName.split(' ').slice(0, 2).map((name) => name[0]).join('')}
        </div>
        <p className={`mt-6 text-[10px] font-bold uppercase tracking-[0.2em] ${theme.accentText}`}>{theme.label} profile</p>
        <h3 className="mt-2 text-xl font-black leading-tight tracking-tight">{member.fullName}</h3>
        <p className={`mt-2 text-sm font-bold ${theme.accentText}`}>{member.role}</p>

        <div className="mt-6 grid w-full grid-cols-2 gap-3 text-left">
          <div>
            <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">ID No.</p>
            <p className="mt-1 text-[10px] font-bold">{member.id}</p>
          </div>
          <div>
            <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Email</p>
            <p className="mt-1 truncate text-[9px] font-bold">{member.email}</p>
          </div>
        </div>
      </main>

      <footer className="relative z-10 mt-auto flex items-center justify-between bg-slate-950 px-7 py-5 text-white">
        <p className="text-[9px] font-semibold italic">It&apos;s always day one.</p>
        <div className="flex gap-1">
          <span className={`size-2 ${theme.accent}`} />
          <span className={`size-2 ${theme.accent}`} />
          <span className={`size-2 ${theme.accent}`} />
        </div>
      </footer>
    </div>
  );
}
