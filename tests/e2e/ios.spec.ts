import { expect, test } from '@playwright/test'

test('iOS shell renders on a phone viewport', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('ios-shell')).toBeAttached()
  await expect(page.getByTestId('ios-lock')).toBeVisible()
  await page.getByTestId('ios-notification').click()
  await expect(page.getByTestId('ios-home')).toBeVisible()
  await expect(page.getByRole('button', { name: /Building: ArsenicCure/ })).toBeVisible()
  await page.getByTestId('ios-app-finder').click()
  await expect(page.getByTestId('ios-open-finder')).toBeVisible()
  await page.getByRole('button', { name: /Projects/ }).click()
  await expect(page.getByRole('button', { name: /^ArsenicCure 1 items/ })).toBeVisible()
  await page.getByRole('button', { name: 'Go to home screen' }).click()
  await expect(page.getByTestId('ios-open-finder')).toBeHidden()
  await page.getByTestId('ios-app-terminal').click()
  await page.getByRole('button', { name: 'What are you building now?' }).click()
  await expect(page.getByText('I build ML systems.')).toBeVisible()
})
