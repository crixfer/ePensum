export type ExtraFieldType = "fecha" | "orden";
export type ParserStrategy = "flat" | "sequential-numbered";

export interface UniversityProfile {
  id: string;
  name: string;
  shortName: string;
  /** What the source pensum's reference column represents, when there's no completion-date data. */
  extraField: ExtraFieldType;
  /** Whether this university's pensum tracks total hours (HT) per subject. */
  hasTotalHours: boolean;
  /** Which PDF layout heuristic to use — see client/src/lib/pdfParser.ts and pdfParserNumbered.ts. */
  parserStrategy: ParserStrategy;
}

export const UNIVERSITY_PROFILES: UniversityProfile[] = [
  {
    id: "unicaribe",
    name: "Universidad del Caribe (UNICARIBE)",
    shortName: "UNICARIBE",
    extraField: "fecha",
    hasTotalHours: false,
    parserStrategy: "flat",
  },
  {
    id: "isfodosu",
    name: "Instituto Superior de Formación Docente Salomé Ureña (ISFODOSU)",
    shortName: "ISFODOSU",
    extraField: "orden",
    hasTotalHours: true,
    parserStrategy: "sequential-numbered",
  },
  {
    id: "otra",
    name: "Otra universidad",
    shortName: "Otra",
    extraField: "fecha",
    hasTotalHours: true,
    parserStrategy: "flat",
  },
];

export function getUniversityProfile(id: string | null | undefined): UniversityProfile {
  return UNIVERSITY_PROFILES.find((p) => p.id === id) ?? UNIVERSITY_PROFILES[UNIVERSITY_PROFILES.length - 1];
}
