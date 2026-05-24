import { describe, it, expect } from 'vitest'
import { getMatchups, type ThirdPlaceMatchup } from './combinations-495'

const ALL_GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
const VALID_MATCHES = [74, 77, 79, 80, 81, 82, 85, 87]
const VALID_SLOTS = ['1A', '1B', '1D', '1E', '1G', '1I', '1K', '1L']

// Generate all C(12,8) = 495 combinations
function allCombinations(): string[][] {
  const result: string[][] = []
  function pick(start: number, chosen: string[]) {
    if (chosen.length === 8) { result.push([...chosen]); return }
    for (let i = start; i < ALL_GROUPS.length; i++) pick(i + 1, [...chosen, ALL_GROUPS[i]])
  }
  pick(0, [])
  return result
}

describe('combinations-495 data integrity', () => {
  it('covers exactly 495 combinations', () => {
    const combos = allCombinations()
    expect(combos.length).toBe(495)
    for (const groups of combos) {
      expect(() => getMatchups(groups)).not.toThrow()
    }
  })

  it('each combination returns exactly 8 matchups', () => {
    for (const groups of allCombinations()) {
      expect(getMatchups(groups)).toHaveLength(8)
    }
  })

  it('each matchup references a valid match number', () => {
    for (const groups of allCombinations()) {
      for (const m of getMatchups(groups)) {
        expect(VALID_MATCHES).toContain(m.match)
      }
    }
  })

  it('each combination covers all 8 match slots without repetition', () => {
    for (const groups of allCombinations()) {
      const matches = getMatchups(groups).map(m => m.match)
      expect(new Set(matches).size).toBe(8)
    }
  })

  it('each combination uses all 8 group-winner slots', () => {
    for (const groups of allCombinations()) {
      const slots = getMatchups(groups).map(m => m.groupWinner)
      expect(slots.sort()).toEqual(VALID_SLOTS.slice().sort())
    }
  })

  it('third-place teams in each combination are 8 unique teams from the qualifying groups', () => {
    for (const groups of allCombinations()) {
      const thirds = getMatchups(groups).map(m => m.thirdPlace)
      const derivedGroups = thirds.map(t => t[1]).sort()
      expect(new Set(thirds).size).toBe(8)
      expect(derivedGroups).toEqual([...groups].sort())
    }
  })

  it('all 12 groups appear across the full combination set', () => {
    const seen = new Set<string>()
    for (const groups of allCombinations()) for (const g of groups) seen.add(g)
    expect([...seen].sort()).toEqual(ALL_GROUPS)
  })
})

describe('getMatchups', () => {
  it('is order-independent (same result regardless of input order)', () => {
    const groups = ['E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
    const shuffled = ['L', 'G', 'I', 'E', 'K', 'H', 'J', 'F']
    expect(getMatchups(groups)).toEqual(getMatchups(shuffled))
  })

  it('returns correct matchup for option 1 from Annex C (groups E-L)', () => {
    // PDF Annex C row 1: 1A=3E, 1B=3J, 1D=3I, 1E=3F, 1G=3H, 1I=3G, 1K=3L, 1L=3K
    const result = getMatchups(['E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'])
    const bySlot: Record<string, string> = {}
    for (const m of result) bySlot[m.groupWinner] = m.thirdPlace
    expect(bySlot['1A']).toBe('3E')
    expect(bySlot['1B']).toBe('3J')
    expect(bySlot['1D']).toBe('3I')
    expect(bySlot['1E']).toBe('3F')
    expect(bySlot['1G']).toBe('3H')
    expect(bySlot['1I']).toBe('3G')
    expect(bySlot['1K']).toBe('3L')
    expect(bySlot['1L']).toBe('3K')
  })

  it('returns correct matchup for option 495 from Annex C (groups A-H)', () => {
    // PDF Annex C row 495: 1A=3H, 1B=3G, 1D=3B, 1E=3C, 1G=3A, 1I=3F, 1K=3D, 1L=3E
    const result = getMatchups(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'])
    const bySlot: Record<string, string> = {}
    for (const m of result) bySlot[m.groupWinner] = m.thirdPlace
    expect(bySlot['1A']).toBe('3H')
    expect(bySlot['1B']).toBe('3G')
    expect(bySlot['1D']).toBe('3B')
    expect(bySlot['1E']).toBe('3C')
    expect(bySlot['1G']).toBe('3A')
    expect(bySlot['1I']).toBe('3F')
    expect(bySlot['1K']).toBe('3D')
    expect(bySlot['1L']).toBe('3E')
  })

  it('throws for an invalid set of qualifying groups', () => {
    expect(() => getMatchups(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'Z'])).toThrow()
  })
})
