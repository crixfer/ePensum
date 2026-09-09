import type { HonorClassification } from "@epensum/shared";

const honorBadgeSources: Record<Exclude<HonorClassification, null>, string> = {
  "Summa Cum Laude": "/honors/scl.png",
  "Magna Cum Laude": "/honors/mcl.png",
  "Cum Laude": "/honors/cl.png",
};

export function HonorBadge({ honor }: { honor: HonorClassification }) {
  if (!honor) return null;

  return (
    <div className="flex size-24 shrink-0 items-center justify-center sm:size-28">
      <img
        src={honorBadgeSources[honor]}
        alt={honor}
        className="size-full object-contain drop-shadow-[0_4px_6px_rgb(0_0_0_/_0.3)]"
      />
    </div>
  );
}
