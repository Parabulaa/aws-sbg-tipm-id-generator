const slots = ['01', '02', '03', '04', '05', '06', '07'];

export function AttendanceSlots({ slotClass }: { slotClass: string }) {
  return (
    <div className="space-y-3" aria-label="Seven event attendance sticker slots">
      <div className="grid grid-cols-4 gap-2">
        {slots.slice(0, 4).map((slot) => <StickerSlot key={slot} label={slot} slotClass={slotClass} />)}
      </div>
      <div className="grid grid-cols-3 gap-2 px-8">
        {slots.slice(4).map((slot) => <StickerSlot key={slot} label={slot} slotClass={slotClass} />)}
      </div>
    </div>
  );
}

function StickerSlot({ label, slotClass }: { label: string; slotClass: string }) {
  return (
    <div className={`grid aspect-square place-items-center rounded-full border-2 border-dashed bg-white/65 text-[9px] font-black ${slotClass}`}>
      {label}
    </div>
  );
}
