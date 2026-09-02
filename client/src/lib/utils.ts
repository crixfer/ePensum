import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { stripAccents } from "@/lib/pensumParser";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Matches Roman numerals built only from I/V/X (covers I..XXXIX) — the range actually
 * used to number things like "Pasantía I/II/III" in source pensum files. */
const ROMAN_NUMERAL_PATTERN = /^x{0,3}(ix|iv|v?i{0,3})$/i;

function isRomanNumeral(word: string): boolean {
  return word.length > 0 && ROMAN_NUMERAL_PATTERN.test(word);
}

/** Normalizes an ALL-CAPS subject name (common in source pensum files) into Title Case for display. */
export function toTitleCase(text: string): string {
  return text
    .toLowerCase()
    .split(" ")
    .map((word) => {
      if (isRomanNumeral(word)) return word.toUpperCase();
      return word ? word.charAt(0).toUpperCase() + word.slice(1) : word;
    })
    .join(" ");
}

/** Best-effort academic title abbreviation inferred from the career name, for the graduation message. */
export function getAcademicTitle(careerName: string): string {
  const normalized = stripAccents(careerName).toLowerCase();
  if (normalized.includes("doctorado") || normalized.includes("doctor")) return "Dr.";
  if (normalized.includes("maestria") || normalized.includes("master")) return "Msc.";
  if (normalized.includes("ingenieria")) return "Ing.";
  if (normalized.includes("licenciatura")) return "Lic.";
  if (normalized.includes("tecnologo") || normalized.includes("tecnico")) return "Téc.";
  if (normalized.includes("bachiller")) return "Bach.";
  return "";
}
