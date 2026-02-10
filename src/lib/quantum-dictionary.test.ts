import { describe, it, expect } from 'vitest'
import { QUANTUM_TERMS, isQuantumTerm, filterQuantumTerms } from './quantum-dictionary'

describe('QUANTUM_TERMS', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(QUANTUM_TERMS)).toBe(true)
    expect(QUANTUM_TERMS.length).toBeGreaterThan(0)
  })

  it('contains core quantum terms', () => {
    const coreTerms = ['qubit', 'superposition', 'entanglement', 'decoherence', 'quantum']
    for (const term of coreTerms) {
      expect(QUANTUM_TERMS).toContain(term)
    }
  })

  it('contains no duplicates', () => {
    const unique = new Set(QUANTUM_TERMS)
    expect(unique.size).toBe(QUANTUM_TERMS.length)
  })

  it('contains only strings', () => {
    for (const term of QUANTUM_TERMS) {
      expect(typeof term).toBe('string')
    }
  })
})

describe('isQuantumTerm', () => {
  it('matches exact terms', () => {
    expect(isQuantumTerm('qubit')).toBe(true)
    expect(isQuantumTerm('QAOA')).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(isQuantumTerm('QUBIT')).toBe(true)
    expect(isQuantumTerm('Qubit')).toBe(true)
  })

  it('returns false for non-quantum terms', () => {
    expect(isQuantumTerm('hello')).toBe(false)
    expect(isQuantumTerm('javascript')).toBe(false)
  })
})

describe('filterQuantumTerms', () => {
  it('removes quantum terms from list', () => {
    const words = ['qubit', 'hello', 'entanglement', 'world']
    const result = filterQuantumTerms(words)
    expect(result).toEqual(['hello', 'world'])
  })

  it('returns empty array when all terms are quantum', () => {
    const words = ['qubit', 'superposition']
    expect(filterQuantumTerms(words)).toEqual([])
  })

  it('returns all words when none are quantum', () => {
    const words = ['hello', 'world']
    expect(filterQuantumTerms(words)).toEqual(['hello', 'world'])
  })
})
