import { AttendanceSlots } from '@/components/attendance-slots';
import { idThemes } from '@/lib/id-themes';
import type { Member } from '@/lib/types';

export function IDBack({ member }: { member: Member }) {
  const theme = idThemes[member.membershipType];

  return (
    <div className={`relative flex h-full flex-col overflow-hidden text-slate-950 ${theme.surface}`}>
      <div className={`absolute left-0 top-0 h-24 w-full ${theme.accent}`} />
      <div className="absolute right-0 top-16 size-32 translate-x-12 rotate-45 rounded-[28px] border-[20px] border-slate-950/10" />

      <header className="relative z-10 px-7 pb-5 pt-7">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-800">Event Attendance</p>
        <h3 className="mt-1 text-lg font-black leading-tight">Build, learn, and show up.</h3>
        <p className="mt-1 text-[9px] font-semibold text-slate-700">Collect a sticker for every event you attend!</p>
      </header>

      <main className="relative z-10 flex-1 px-7 pt-4">
        <AttendanceSlots slotClass={theme.slot} />

        <section className="mt-8 border-t border-slate-200 pt-5">
          <h4 className={`text-[9px] font-black uppercase tracking-[0.2em] ${theme.accentText}`}>Terms and Conditions</h4>
          <p className="mt-3 text-[9px] leading-relaxed text-slate-600">
            The AWSSBG ID is valid for a period of one year from the date of issuance. In case of loss or theft, the holder must report promptly to the designated authority. Unauthorized sharing or use of the ID is prohibited.
          </p>
        </section>
      </main>

      <footer className="relative z-10 mt-auto bg-slate-950 px-7 py-6 text-white">
        <p className={`text-[10px] font-semibold italic ${theme.accentText}`}>It&apos;s always day one.</p>
        <p className="mt-4 text-[8px] font-black tracking-wide">AWS STUDENT BUILDER GROUP</p>
        <p className="mt-1 text-[7px] font-medium leading-tight text-slate-300">
          TECHNOLOGICAL INSTITUTE OF THE PHILIPPINES<br />MANILA
        </p>
      </footer>
    </div>
  );
}
