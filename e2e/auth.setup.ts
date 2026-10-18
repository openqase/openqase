import { test as setup, expect } from '@playwright/test'
import { adminCredentials } from './support'

const STORAGE_STATE = 'e2e/.auth/admin.json'

const isPath = (path: string) => (url: URL) => url.pathname === path

// Signs in through the real /auth page (Supabase Auth UI) and saves the
// session cookies for the admin tests.
setup('sign in as admin', async ({ page }) => {
  const { email, password } = adminCredentials()

  // Signed out, the proxy sends /admin to the sign-in page.
  await page.goto('/admin')
  await page.waitForURL(isPath('/auth'))
  expect(new URL(page.url()).searchParams.get('redirectTo')).toBe('/admin')

  await page.getByLabel('Email address').fill(email)
  await page.getByLabel('Your Password').fill(password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()

  await page.waitForURL(isPath('/admin'))
  await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible()

  // A full server round trip: the proxy keeps only admins on /admin.
  await page.reload()
  expect(new URL(page.url()).pathname).toBe('/admin')
  await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible()

  await page.context().storageState({ path: STORAGE_STATE })
})
