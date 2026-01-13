import { describe, it, expect } from 'vitest'
import { getSafeRedirectPath, isValidRedirectPath } from './redirect-utils'

describe('getSafeRedirectPath', () => {
  describe('Safe relative paths', () => {
    it('should allow simple relative paths', () => {
      expect(getSafeRedirectPath('/dashboard')).toBe('/dashboard')
      expect(getSafeRedirectPath('/admin/settings')).toBe('/admin/settings')
      expect(getSafeRedirectPath('/case-studies')).toBe('/case-studies')
    })

    it('should allow paths with query strings', () => {
      expect(getSafeRedirectPath('/search?q=quantum')).toBe('/search?q=quantum')
    })

    it('should allow paths with hashes', () => {
      expect(getSafeRedirectPath('/docs#section')).toBe('/docs#section')
    })
  })

  describe('Blocked dangerous URLs', () => {
    it('should block absolute URLs', () => {
      expect(getSafeRedirectPath('https://evil.com')).toBe('/')
      expect(getSafeRedirectPath('http://malicious.com/steal')).toBe('/')
    })

    it('should block protocol-relative URLs', () => {
      expect(getSafeRedirectPath('//evil.com')).toBe('/')
      expect(getSafeRedirectPath('//evil.com/phishing')).toBe('/')
    })

    it('should block javascript: protocol', () => {
      expect(getSafeRedirectPath('javascript:alert(1)')).toBe('/')
      expect(getSafeRedirectPath('javascript:void(0)')).toBe('/')
    })

    it('should block data: protocol', () => {
      expect(getSafeRedirectPath('data:text/html,<script>alert(1)</script>')).toBe('/')
    })

    it('should block other dangerous protocols', () => {
      expect(getSafeRedirectPath('vbscript:msgbox(1)')).toBe('/')
      expect(getSafeRedirectPath('file:///etc/passwd')).toBe('/')
    })
  })

  describe('Edge cases', () => {
    it('should return / for null', () => {
      expect(getSafeRedirectPath(null)).toBe('/')
    })

    it('should return / for undefined', () => {
      expect(getSafeRedirectPath(undefined)).toBe('/')
    })

    it('should return / for empty string', () => {
      expect(getSafeRedirectPath('')).toBe('/')
    })

    it('should handle encoded URLs', () => {
      // Should still block encoded protocols
      expect(getSafeRedirectPath('%2F%2Fevil.com')).toBe('/')
    })
  })
})

describe('isValidRedirectPath', () => {
  it('should return true for safe paths', () => {
    expect(isValidRedirectPath('/admin')).toBe(true)
    expect(isValidRedirectPath('/dashboard?tab=settings')).toBe(true)
  })

  it('should return false for dangerous URLs', () => {
    expect(isValidRedirectPath('https://evil.com')).toBe(false)
    expect(isValidRedirectPath('//evil.com')).toBe(false)
    expect(isValidRedirectPath('javascript:alert(1)')).toBe(false)
  })

  it('should return false for null/undefined', () => {
    expect(isValidRedirectPath(null)).toBe(false)
    expect(isValidRedirectPath(undefined)).toBe(false)
  })
})
