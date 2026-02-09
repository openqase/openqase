import { describe, it, expect } from 'vitest'
import { getSafeRedirectPath, isValidRedirectPath } from './redirect-utils'

describe('getSafeRedirectPath', () => {
  it('returns "/" for null', () => {
    expect(getSafeRedirectPath(null)).toBe('/')
  })

  it('returns "/" for undefined', () => {
    expect(getSafeRedirectPath(undefined)).toBe('/')
  })

  it('returns "/" for empty string', () => {
    expect(getSafeRedirectPath('')).toBe('/')
  })

  it('passes through valid relative paths', () => {
    expect(getSafeRedirectPath('/admin')).toBe('/admin')
    expect(getSafeRedirectPath('/case-study/foo')).toBe('/case-study/foo')
    expect(getSafeRedirectPath('/paths/algorithm')).toBe('/paths/algorithm')
    expect(getSafeRedirectPath('/')).toBe('/')
  })

  it('blocks protocol-relative URLs', () => {
    expect(getSafeRedirectPath('//evil.com')).toBe('/')
    expect(getSafeRedirectPath('//evil.com/path')).toBe('/')
  })

  it('blocks absolute URLs', () => {
    expect(getSafeRedirectPath('https://evil.com')).toBe('/')
    expect(getSafeRedirectPath('http://evil.com')).toBe('/')
  })

  it('blocks javascript: URIs', () => {
    expect(getSafeRedirectPath('javascript:alert(1)')).toBe('/')
  })

  it('blocks data: URIs', () => {
    expect(getSafeRedirectPath('data:text/html,<script>alert(1)</script>')).toBe('/')
  })

  it('blocks mixed-case attack variants', () => {
    expect(getSafeRedirectPath('JavaScript:alert(1)')).toBe('/')
    expect(getSafeRedirectPath('DATA:text/html')).toBe('/')
  })

  it('blocks :// embedded in paths', () => {
    expect(getSafeRedirectPath('/redirect?url=https://evil.com')).toBe('/')
  })

  it('blocks paths not starting with /', () => {
    expect(getSafeRedirectPath('admin')).toBe('/')
    expect(getSafeRedirectPath('ftp://files.com')).toBe('/')
  })
})

describe('isValidRedirectPath', () => {
  it('returns false for null/undefined/empty', () => {
    expect(isValidRedirectPath(null)).toBe(false)
    expect(isValidRedirectPath(undefined)).toBe(false)
    expect(isValidRedirectPath('')).toBe(false)
  })

  it('returns true for valid relative paths', () => {
    expect(isValidRedirectPath('/admin')).toBe(true)
    expect(isValidRedirectPath('/case-study/foo')).toBe(true)
    expect(isValidRedirectPath('/')).toBe(true)
  })

  it('returns false for protocol-relative URLs', () => {
    expect(isValidRedirectPath('//evil.com')).toBe(false)
  })

  it('returns false for absolute URLs', () => {
    expect(isValidRedirectPath('https://evil.com')).toBe(false)
  })

  it('returns false for javascript: URIs', () => {
    expect(isValidRedirectPath('javascript:alert(1)')).toBe(false)
  })

  it('returns false for data: URIs', () => {
    expect(isValidRedirectPath('data:text/html')).toBe(false)
  })

  it('returns false for paths with :// embedded', () => {
    expect(isValidRedirectPath('/foo?url=https://evil.com')).toBe(false)
  })
})
