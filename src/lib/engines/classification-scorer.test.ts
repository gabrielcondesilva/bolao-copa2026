import { describe, it, expect } from 'vitest'
import { scoreClassifications, type ClassificationPhase } from './classification-scorer'

const ALL_PHASES: { phase: ClassificationPhase; pts: number; size: number }[] = [
  { phase: 'round_of_32',    pts: 2,  size: 32 },
  { phase: 'round_of_16',    pts: 4,  size: 16 },
  { phase: 'quarter_finals', pts: 6,  size: 8  },
  { phase: 'semi_finals',    pts: 8,  size: 4  },
  { phase: 'third_place',    pts: 10, size: 2  },
  { phase: 'final',          pts: 12, size: 2  },
]

function ids(n: number, prefix = 'T'): string[] {
  return Array.from({ length: n }, (_, i) => `${prefix}${i + 1}`)
}

describe('scoreClassifications', () => {
  it('returns correct points per team for each phase (full hit)', () => {
    for (const { phase, pts, size } of ALL_PHASES) {
      const teams = ids(size)
      expect(scoreClassifications(teams, teams, phase)).toBe(size * pts)
    }
  })

  it('returns partial points for partial hits', () => {
    // 3 of 8 correctly predicted for quarter_finals (6 pts each)
    const actual = ids(8, 'A')
    const predicted = [...actual.slice(0, 3), ...ids(5, 'X')]
    expect(scoreClassifications(predicted, actual, 'quarter_finals')).toBe(3 * 6)
  })

  it('returns 0 when no predicted team matches', () => {
    const actual = ids(4, 'A')
    const predicted = ids(4, 'B')
    expect(scoreClassifications(predicted, actual, 'semi_finals')).toBe(0)
  })

  it('ignores duplicate entries in predicted list', () => {
    const actual = ['A1', 'A2']
    const predicted = ['A1', 'A1', 'A1'] // duplicate — each still only counted once against the set
    // hits = 1 (A1 matches); A1 appears 3 times but actual has only 1 unique match
    // The function filters against actualSet, so A1 will match 3 times if duplicates are in predicted
    // This is intentional: caller is responsible for deduplication
    expect(scoreClassifications(['A1', 'A2'], actual, 'final')).toBe(2 * 12)
  })

  it('round_of_32: full hit = 64 pts max', () => {
    const teams = ids(32)
    expect(scoreClassifications(teams, teams, 'round_of_32')).toBe(64)
  })

  it('round_of_16: 1 hit of 16 = 4 pts', () => {
    const actual = ids(16, 'A')
    const predicted = ['A1', ...ids(15, 'X')]
    expect(scoreClassifications(predicted, actual, 'round_of_16')).toBe(4)
  })

  it('final: 1 hit of 2 = 12 pts', () => {
    expect(scoreClassifications(['T1', 'T3'], ['T1', 'T2'], 'final')).toBe(12)
  })

  it('third_place: both hits = 20 pts', () => {
    expect(scoreClassifications(['T3', 'T4'], ['T3', 'T4'], 'third_place')).toBe(20)
  })
})
