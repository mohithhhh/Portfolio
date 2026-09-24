import { expect, test } from '@playwright/test'
import { boot } from './helpers'

// Review screenshots (SPEC §14). Run with: SCREENSHOTS=1 pnpm test:e2e screenshots
test.skip(!process.env.SCREENSHOTS, 'set SCREENSHOTS=1 to capture review screenshots')

const OUT = 'docs/screenshots'

for (const theme of ['light', 'dark'] as const) {
  test(`desktop ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme })
    await boot(page)
    await page.screenshot({ path: `${OUT}/desktop-${theme}-1440x900.png` })
    await page.getByTestId('desktop-icon-resume').dblclick()
    await expect(page.getByText(/Page 1 of 2/)).toBeVisible()
    await page.getByTestId('dock-finder').click()
    await page.locator('[data-app="finder"]').getByTestId('finder-sidebar-projects').click()
    await page.getByTestId('dock-terminal').click()
    await page.getByTestId('terminal-input').fill('about')
    await page.getByTestId('terminal-input').press('Enter')
    await page.waitForTimeout(600)
    await page.screenshot({ path: `${OUT}/windows-${theme}-1440x900.png` })
  })
}

test('phone', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  await page.goto('/')
  await expect(page.getByTestId('ios-lock')).toBeVisible()
  await page.waitForTimeout(2000)
  await page.screenshot({ path: `${OUT}/ios-lock-390x844.png` })
  await page.getByTestId('ios-notification').click()
  await expect(page.getByTestId('ios-home')).toBeVisible()
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${OUT}/ios-home-390x844.png` })
  await ctx.close()
})
