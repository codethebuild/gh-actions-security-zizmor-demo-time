import { test, expect } from '@playwright/test'

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should have proper heading hierarchy', async ({ page }) => {
    const h1 = page.locator('h1')
    await expect(h1).toBeVisible()

    // Navigate to content slide with h2
    await page.keyboard.press('ArrowRight')
    const h2 = page.locator('h2')
    await expect(h2).toBeVisible()
  })

  test('should have title attribute on fullscreen button', async ({ page }) => {
    const fullscreenButton = page.locator('.fullscreen-btn')
    await expect(fullscreenButton).toHaveAttribute('title', 'Toggle Fullscreen (F)')
  })
})
