import { describe, it, expect } from 'vitest'
import { parsePagination, MAX_PAGE_SIZE } from './pagination'

const parse = (qs: string, defaults?: { page?: number; pageSize?: number }) =>
  parsePagination(new URLSearchParams(qs), defaults)

describe('parsePagination', () => {
  it('uses defaults when params are missing', () => {
    expect(parse('')).toEqual({ ok: true, page: 1, pageSize: 10 })
    expect(parse('', { pageSize: 50 })).toEqual({ ok: true, page: 1, pageSize: 50 })
  })

  it('treats empty values as missing', () => {
    expect(parse('page=&pageSize=')).toEqual({ ok: true, page: 1, pageSize: 10 })
  })

  it('accepts valid positive integers', () => {
    expect(parse('page=3&pageSize=25')).toEqual({ ok: true, page: 3, pageSize: 25 })
  })

  it(`clamps pageSize to ${MAX_PAGE_SIZE}`, () => {
    expect(parse('pageSize=100')).toMatchObject({ ok: true, pageSize: 100 })
    expect(parse('pageSize=101')).toMatchObject({ ok: true, pageSize: MAX_PAGE_SIZE })
    expect(parse('pageSize=99999999')).toMatchObject({ ok: true, pageSize: MAX_PAGE_SIZE })
  })

  it.each(['abc', '0', '-1', '1.5', '10abc', '1e3', 'NaN', 'Infinity', '99999999999999999999'])(
    'rejects page=%s',
    (value) => {
      const result = parse(`page=${encodeURIComponent(value)}`)
      expect(result.ok).toBe(false)
    }
  )

  it.each(['abc', '0', '-10', '2.5', '5x'])('rejects pageSize=%s', (value) => {
    const result = parse(`pageSize=${encodeURIComponent(value)}`)
    expect(result).toEqual({ ok: false, error: 'pageSize must be a positive integer' })
  })
})
