import { expect, test } from '@playwright/test'
import projects from '../../content/projects/index.json' with { type: 'json' }
import experience from '../../content/experience/index.json' with { type: 'json' }

test('/simple contains every project and role', async ({ page }) => {
  await page.goto('/simple')
  await expect(page.getByRole('heading', { level: 1, name: 'Mohith D K' })).toBeVisible()
  for (const p of projects) await expect(page.locator(`#project-${p.slug}`)).toBeVisible()
  for (const e of experience) await expect(page.locator(`#experience-${e.slug}`)).toContainText(e.company)
  await expect(page.getByText('Not affiliated with Apple Inc.')).toBeVisible()
  await expect(page.locator('#oss-pydantic-ai')).toContainText('pydantic-ai')
  await expect(page.getByRole('link', { name: 'Live site' }).first()).toHaveAttribute('href', /^https:\/\//)
  await expect(page.getByRole('link', { name: 'Download resume (PDF)' })).toHaveAttribute('href', '/Resume.pdf')
})

test('deep-link pages render real HTML for crawlers', async ({ request }) => {
  const res = await request.get('/projects/provenance')
  expect(res.status()).toBe(200)
  const html = await res.text()
  expect(html).toContain('per-sentence attribution')
  expect(html).toContain('/og/provenance')
  expect((await request.get('/projects/nope')).status()).toBe(404)
  const og = await request.get('/og/provenance')
  expect(og.headers()['content-type']).toContain('image/png')
})
