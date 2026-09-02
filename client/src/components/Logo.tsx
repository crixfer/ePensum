import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("font-semibold tracking-tight text-foreground", className)}>
      <span className="text-primary">e</span>Pensum
    </span>
  );
}
