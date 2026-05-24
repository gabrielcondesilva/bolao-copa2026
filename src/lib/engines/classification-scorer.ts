export type ClassificationPhase =
  | 'round_of_32'    // 16-avos: 32 teams qualify, 2 pts each
  | 'round_of_16'    // Oitavas: 16 teams qualify, 4 pts each
  | 'quarter_finals' // Quartas: 8 teams qualify, 6 pts each
  | 'semi_finals'    // Semifinais: 4 teams qualify, 8 pts each
  | 'third_place'    // Disputa de 3º: 2 teams, 10 pts each
  | 'final'          // Finalistas: 2 teams, 12 pts each

const POINTS_PER_TEAM: Record<ClassificationPhase, number> = {
  round_of_32: 2,
  round_of_16: 4,
  quarter_finals: 6,
  semi_finals: 8,
  third_place: 10,
  final: 12,
}

export function scoreClassifications(
  simulatedQualifiers: string[],
  actualQualifiers: string[],
  phase: ClassificationPhase,
): number {
  const actualSet = new Set(actualQualifiers)
  const hits = simulatedQualifiers.filter(id => actualSet.has(id)).length
  return hits * POINTS_PER_TEAM[phase]
}
