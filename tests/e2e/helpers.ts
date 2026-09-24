import { expect, type Page } from '@playwright/test'

/** Loads the desktop and skips the boot animation. */
export async function boot(page: Page, path = '/') {
  await page.goto(path)
  await expect(page.getByTestId('mac-shell')).toBeAttached()
  await page.keyboard.press('Shift')
  await expect(page.getByTestId('boot')).toBeHidden()
  await expect(page.getByTestId('menubar')).toBeVisible()
}

export const windowByTitle = (page: Page, title: string | RegExp) => page.getByRole('dialog', { name: title })
