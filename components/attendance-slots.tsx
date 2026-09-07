const slots = ['01', '02', '03', '04', '05', '06', '07'];

export function AttendanceSlots() {
  return (
    <div className="space-y-3" aria-label="Seven event attendance sticker slots">
      <div className="grid grid-cols-4 gap-2">
        {slots.slice(0, 4).map((slot) => <StickerSlot key={slot} label={slot} />)}
      </div>
      <div className="grid grid-cols-3 gap-2 px-8">
        {slots.slice(4).map((slot) => <StickerSlot key={slot} label={slot} />)}
      </div>
    </div>
  );
}

function StickerSlot({ label }: { label: string }) {
  return (
    <div className="grid aspect-square place-items-center rounded-full border-2 border-dashed border-amber-500/60 bg-white/65 text-[9px] font-black text-amber-700">
      {label}
    </div>
  );
}
