import { cn } from "@/lib/utils";

export function Logo({ className, slogan = false }: { className?: string; slogan?: boolean }) {
  return (
    <span className={cn("inline-flex flex-col items-center", className)}>
      <span className="font-semibold tracking-tight text-foreground">
        <span className="text-primary">e</span>Pensum
      </span>
      {slogan && <span className="text-xs font-normal tracking-wide text-muted-foreground">Simple and Clean</span>}
    </span>
  );
}
