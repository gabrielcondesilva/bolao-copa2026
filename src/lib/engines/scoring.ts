export type Score = { home: number; away: number }
export type MatchPoints = 0 | 5 | 10

export function scoreMatch(
  predicted: Score,
  official: Score,
  wentToExtraTime: boolean
): MatchPoints {
  // For extra-time matches, official score is already the 120-min result (not penalties)
  // The wentToExtraTime flag is informational — scoring logic is identical.
  void wentToExtraTime

  if (predicted.home === official.home && predicted.away === official.away) {
    return 10 // Placar Cravado
  }

  const predictedResult = Math.sign(predicted.home - predicted.away)
  const officialResult = Math.sign(official.home - official.away)

  if (predictedResult === officialResult) {
    return 5 // Resultado Correto
  }

  return 0
}
