import { expect, test } from '@playwright/test'

import { actionsOf, ask, expectGoodAnswer, openGuide, panel } from './guide-helpers'

test('on a phone the guide fits the screen and keeps the highlight visible above it', async ({ page }) => {
  await openGuide(page)
  const width = await page.evaluate(() => window.innerWidth)
  const height = await page.evaluate(() => window.innerHeight)
  const box = (await panel(page).boundingBox())!
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(width + 1)
  expect(box.y).toBeGreaterThanOrEqual(0)
  expect(box.y + box.height).toBeLessThanOrEqual(height + 1)
  expect(box.height).toBeLessThanOrEqual(height * 0.65)
  expect(box.y).toBeGreaterThan(height * 0.3)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'no sideways scrolling').toBe(true)
  expect(await page.evaluate(() => getComputedStyle(document.body).overflow), 'the page does not scroll behind the guide').toBe('hidden')
  const composer = (await page.locator('.guide-composer').boundingBox())!
  expect(composer.y + composer.height).toBeLessThanOrEqual(height + 1)
  const close = (await page.getByRole('button', { name: 'Close guide' }).boundingBox())!
  expect(close.width).toBeGreaterThanOrEqual(44)
  expect(close.height).toBeGreaterThanOrEqual(44)
  await page.locator('textarea[aria-label="Ask the guide"]').focus()
  await expect.poll(async () => (await panel(page).boundingBox())!.height).toBeLessThanOrEqual(height * 0.65)
  await page.screenshot({ path: test.info().outputPath('m1-open.png') })

  const { events, text } = await ask(page, 'Show me Relay')
  await expectGoodAnswer(test.info(), 'show Relay', text)
  expect(actionsOf(events).some((a) => a.type === 'show' && a.target?.startsWith('project.relay'))).toBe(true)
  await expect(page).toHaveURL(/\/projects\/relay\//)
  // The guide is a bottom sheet on phones, so the highlighted section must start above it.
  await expect
    .poll(async () => {
      const focus = await page.locator('.guide-focus').first().boundingBox()
      const sheet = await panel(page).boundingBox()
      return Boolean(focus && sheet && focus.y >= -2 && focus.y < sheet.y)
    })
    .toBe(true)
  await page.screenshot({ path: test.info().outputPath('m2-relay.png') })
})
