import { describe, it, expect } from 'vitest'
import { scoreMatch } from './scoring'

describe('scoreMatch', () => {
  it('returns 10 for Placar Cravado', () => {
    expect(scoreMatch({ home: 2, away: 1 }, { home: 2, away: 1 }, false)).toBe(10)
  })

  it('returns 10 for correct 0-0 draw', () => {
    expect(scoreMatch({ home: 0, away: 0 }, { home: 0, away: 0 }, false)).toBe(10)
  })

  it('returns 5 for Resultado Correto — home win right, wrong score', () => {
    expect(scoreMatch({ home: 3, away: 1 }, { home: 1, away: 0 }, false)).toBe(5)
  })

  it('returns 5 for Resultado Correto — draw right, wrong score', () => {
    expect(scoreMatch({ home: 0, away: 0 }, { home: 1, away: 1 }, false)).toBe(5)
  })

  it('returns 5 for Resultado Correto — away win right, wrong score', () => {
    expect(scoreMatch({ home: 0, away: 1 }, { home: 1, away: 3 }, false)).toBe(5)
  })

  it('returns 0 for wrong result', () => {
    expect(scoreMatch({ home: 1, away: 0 }, { home: 0, away: 1 }, false)).toBe(0)
  })

  it('returns 0 for predicted draw, actual winner', () => {
    expect(scoreMatch({ home: 1, away: 1 }, { home: 2, away: 0 }, false)).toBe(0)
  })

  it('scores extra-time match using 120-min result — Placar Cravado', () => {
    // 120-min result 1-1; predicted 1-1 → Placar Cravado (penalties irrelevant)
    expect(scoreMatch({ home: 1, away: 1 }, { home: 1, away: 1 }, true)).toBe(10)
  })

  it('scores extra-time match using 120-min result — Resultado Correto draw', () => {
    // 120-min result 1-1 (draw); predicted 0-0 (also draw, wrong score) → Resultado Correto
    expect(scoreMatch({ home: 0, away: 0 }, { home: 1, away: 1 }, true)).toBe(5)
  })

  it('scores extra-time match using 120-min result — wrong result', () => {
    // 120-min result 1-1 (draw); predicted 2-1 (home win) → 0
    expect(scoreMatch({ home: 2, away: 1 }, { home: 1, away: 1 }, true)).toBe(0)
  })
})
