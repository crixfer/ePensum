export type ExtraFieldType = "fecha" | "orden";
export type ParserStrategy = "flat" | "sequential-numbered";

export interface UniversityProfile {
  id: string;
  name: string;
  shortName: string;
  /** What the source pensum's reference column represents, when there's no completion-date data. */
  extraField: ExtraFieldType;
  /** Which PDF layout heuristic to use — see client/src/lib/pdfParser.ts and pdfParserNumbered.ts. */
  parserStrategy: ParserStrategy;
}

export const UNIVERSITY_PROFILES: UniversityProfile[] = [
  {
    id: "unicaribe",
    name: "Universidad del Caribe (UNICARIBE)",
    shortName: "UNICARIBE",
    extraField: "fecha",
    parserStrategy: "flat",
  },
  {
    id: "isfodosu",
    name: "Instituto Superior de Formación Docente Salomé Ureña (ISFODOSU)",
    shortName: "ISFODOSU",
    extraField: "orden",
    parserStrategy: "sequential-numbered",
  },
  {
    id: "otra",
    name: "Otra universidad",
    shortName: "Otra",
    extraField: "fecha",
    parserStrategy: "flat",
  },
];

export function getUniversityProfile(id: string | null | undefined): UniversityProfile {
  return UNIVERSITY_PROFILES.find((p) => p.id === id) ?? UNIVERSITY_PROFILES[UNIVERSITY_PROFILES.length - 1];
}
