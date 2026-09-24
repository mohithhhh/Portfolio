import { expect, test } from '@playwright/test'
import { boot, windowByTitle } from './helpers'

test('boots and can be skipped with a key', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('boot')).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('boot')).toBeHidden()
  await expect(page.getByTestId('menubar-app-name')).toHaveText('Finder')
  // Returning visitors in the same session skip straight to the desktop.
  await page.reload()
  await expect(page.getByTestId('boot')).toBeHidden({ timeout: 1500 })
})

test('opens Resume.pdf from the desktop in Preview', async ({ page }) => {
  await boot(page)
  await page.getByTestId('desktop-icon-resume').dblclick()
  const win = windowByTitle(page, 'Resume.pdf')
  await expect(win).toBeVisible()
  await expect(page.getByTestId('menubar-app-name')).toHaveText('Preview')
  await expect(win.getByText(/Page 1 of 2/)).toBeVisible()
  await expect(win.getByTestId('preview-download')).toHaveAttribute('href', '/Resume.pdf')
})

test('navigates Finder to a project and opens its README', async ({ page }) => {
  await boot(page)
  await page.getByTestId('dock-finder').click()
  // The window title follows the current folder, so find it by app instead.
  const finder = page.locator('[data-app="finder"]')
  await expect(windowByTitle(page, 'mohith')).toBeVisible()
  await finder.getByTestId('finder-sidebar-projects').click()
  await expect(finder.getByTestId('finder-title')).toHaveText('Projects')
  await finder.getByTestId('finder-item-project-arseniccure').dblclick()
  await expect(finder.getByTestId('finder-title')).toHaveText('ArsenicCure')
  await finder.getByTestId('finder-item-project-arseniccure-readme').dblclick()
  const doc = windowByTitle(page, 'README.md')
  await expect(doc.getByRole('heading', { name: 'ArsenicCure' })).toBeVisible()
  await expect(page.getByTestId('menubar-app-name')).toHaveText('TextEdit')
})

test('drags and resizes a window', async ({ page }) => {
  await boot(page)
  await page.getByTestId('dock-finder').click()
  const frame = page.locator('[data-app="finder"]')
  await expect(frame).toBeVisible()
  const before = (await frame.boundingBox())!
  const title = frame.getByTestId('finder-title')
  const tb = (await title.boundingBox())!
  await page.mouse.move(tb.x + tb.width + 60, tb.y + tb.height / 2)
  await page.mouse.down()
  await page.mouse.move(tb.x + tb.width + 160, tb.y + tb.height / 2 + 80, { steps: 8 })
  await page.mouse.up()
  const moved = (await frame.boundingBox())!
  expect(Math.round(moved.x - before.x)).toBe(100)
  expect(Math.round(moved.y - before.y)).toBe(80)
  // resize from the bottom-right corner
  const corner = frame.locator('.rz-se')
  const cb = (await corner.boundingBox())!
  await page.mouse.move(cb.x + cb.width / 2, cb.y + cb.height / 2)
  await page.mouse.down()
  await page.mouse.move(cb.x + cb.width / 2 + 120, cb.y + cb.height / 2 + 60, { steps: 8 })
  await page.mouse.up()
  const resized = (await frame.boundingBox())!
  expect(Math.round(resized.width - moved.width)).toBe(120)
  expect(Math.round(resized.height - moved.height)).toBe(60)
  // the title bar can never go above the menu bar
  const t2 = (await title.boundingBox())!
  await page.mouse.move(t2.x + t2.width + 60, t2.y + t2.height / 2)
  await page.mouse.down()
  await page.mouse.move(t2.x + t2.width + 60, -200, { steps: 6 })
  await page.mouse.up()
  expect((await frame.boundingBox())!.y).toBeGreaterThanOrEqual(24)
})

test('focus changes the menu bar and dims inactive windows', async ({ page }) => {
  await boot(page)
  await page.getByTestId('dock-finder').click()
  await page.getByTestId('dock-terminal').click()
  await expect(page.getByTestId('menubar-app-name')).toHaveText('Terminal')
  const finder = page.locator('[data-app="finder"] .window')
  await expect(finder).toHaveClass(/is-inactive/)
  // Terminal cascades over Finder; click the strip of Finder that stays uncovered.
  const fb = (await page.locator('[data-app="finder"]').boundingBox())!
  await page.mouse.click(fb.x + 40, fb.y + 200)
  await expect(page.getByTestId('menubar-app-name')).toHaveText('Finder')
  await expect(finder).toHaveClass(/is-focused/)
  // clicking the empty desktop makes Finder the active app
  await page.getByTestId('dock-notes').click()
  await page.mouse.click(40, 500)
  await expect(page.getByTestId('menubar-app-name')).toHaveText('Finder')
})

test('Spotlight opens a project', async ({ page }) => {
  await boot(page)
  await page.keyboard.press('Control+k')
  await page.getByTestId('spotlight-input').fill('temporal')
  await expect(page.getByRole('option').first()).toContainText('Temporal Belief Dynamics in BERT')
  await page.keyboard.press('Enter')
  await expect(windowByTitle(page, 'README.md').getByRole('heading', { name: 'Temporal Belief Dynamics in BERT' })).toBeVisible()
})

test('keyboard-only path to the resume', async ({ page }) => {
  await boot(page)
  // Tab to the desktop, select the first icon with the arrow keys, open it with Enter.
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab')
    if (await page.getByTestId('desktop').evaluate((el) => el === document.activeElement)) break
  }
  await expect(page.getByTestId('desktop')).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(page.getByTestId('desktop-icon-resume')).toHaveAttribute('aria-selected', 'true')
  await page.keyboard.press('Space')
  await expect(page.getByTestId('quicklook')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('quicklook')).toBeHidden()
  await page.getByTestId('desktop').focus()
  await page.keyboard.press('Enter')
  await expect(windowByTitle(page, 'Resume.pdf')).toBeVisible()
  // ⌥W closes the focused window
  await page.keyboard.press('Alt+KeyW')
  await expect(windowByTitle(page, 'Resume.pdf')).toBeHidden()
})

test('menus open on click, follow hover and run actions', async ({ page }) => {
  await boot(page)
  await page.getByTestId('menubar-app-name').click()
  await expect(page.getByRole('menu', { name: 'Finder' })).toBeVisible()
  await page.getByRole('menuitem', { name: 'Go', exact: true }).hover()
  const go = page.getByRole('menu', { name: 'Go' })
  await expect(go).toBeVisible()
  await go.getByRole('menuitem', { name: /^Projects/ }).click()
  await expect(windowByTitle(page, 'Projects')).toBeVisible()
  await page.keyboard.press('Escape')
})

test('Terminal runs commands and asks the agent', async ({ page }) => {
  await boot(page)
  await page.getByTestId('dock-terminal').click()
  const input = page.getByTestId('terminal-input')
  await expect(input).toBeFocused()
  await input.fill('cd Projects')
  await input.press('Enter')
  await input.fill('ls')
  await input.press('Enter')
  await expect(page.getByTestId('terminal')).toContainText('ArsenicCure/')
  await input.fill('frobnicate the widgets')
  await input.press('Enter')
  await expect(page.getByTestId('terminal')).toContainText('I build ML systems.')
})

test('Mail explains failures and offers a mailto link', async ({ page }) => {
  await boot(page)
  await page.getByTestId('dock-mail').click()
  const mail = windowByTitle(page, 'Mail')
  await mail.getByLabel('Your name').fill('Test Visitor')
  await mail.getByLabel('Your email').fill('visitor@example.com')
  await mail.getByRole('textbox', { name: 'Message', exact: true }).fill('Hello, this is a test message.')
  await page.getByTestId('mail-send').click()
  const alert = mail.getByRole('alert')
  await expect(alert).toContainText(/isn’t set up|isn't set up|could not be sent|Too many/)
  await expect(alert.getByRole('link')).toHaveAttribute('href', /^mailto:mohithog7@gmail\.com/)
})

test('deep link opens the project in Finder and TextEdit', async ({ page }) => {
  await boot(page, '/projects/arseniccure')
  await expect(windowByTitle(page, 'ArsenicCure')).toBeVisible()
  await expect(windowByTitle(page, 'README.md').getByRole('heading', { name: 'ArsenicCure' })).toBeVisible()
})

test('Activity Monitor shows an empty state without stats storage', async ({ page }) => {
  await boot(page)
  await page.keyboard.press('Control+k')
  await page.getByTestId('spotlight-input').fill('activity')
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('activity')).toContainText('No activity yet.')
})
