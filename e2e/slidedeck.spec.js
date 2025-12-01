import { test, expect } from '@playwright/test'

test.describe('Slide Deck Application', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should load the application', async ({ page }) => {
    await expect(page.locator('.slide-deck')).toBeVisible()
  })

  test('should display the first slide', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Building Modern Web Applications')
    await expect(page.locator('.slide-counter')).toContainText('1 / 10')
  })

  test('should navigate to next slide with arrow button', async ({ page }) => {
    // Find the next button (second button, after prev)
    const nextButton = page.locator('.control-btn').nth(1)
    await nextButton.click()

    await expect(page.locator('.slide-counter')).toContainText('2 / 10')
    await expect(page.getByRole('heading', { level: 2 })).toContainText('About This Talk')
  })

  test('should navigate to previous slide with arrow button', async ({ page }) => {
    // Go to second slide first
    const nextButton = page.locator('.control-btn').nth(1)
    await nextButton.click()

    // Then go back
    const prevButton = page.locator('.control-btn').nth(0)
    await prevButton.click()

    await expect(page.locator('.slide-counter')).toContainText('1 / 10')
  })

  test('should navigate with keyboard arrow keys', async ({ page }) => {
    await page.click('body')
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('.slide-counter')).toContainText('2 / 10')

    await page.keyboard.press('ArrowLeft')
    await expect(page.locator('.slide-counter')).toContainText('1 / 10')
  })

  test('should navigate with space key', async ({ page }) => {
    await page.click('body')
    await page.keyboard.press('Space')
    await expect(page.locator('.slide-counter')).toContainText('2 / 10')
  })

  test('should jump to first slide with Home key', async ({ page }) => {
    await page.click('body')
    // Navigate to third slide
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('.slide-counter')).toContainText('3 / 10')

    // Press Home
    await page.keyboard.press('Home')
    await expect(page.locator('.slide-counter')).toContainText('1 / 10')
  })

  test('should jump to last slide with End key', async ({ page }) => {
    await page.click('body')
    await page.keyboard.press('End')
    await expect(page.locator('.slide-counter')).toContainText('10 / 10')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Thank You')
  })

  test('should wrap around from last to first slide', async ({ page }) => {
    await page.click('body')
    // Go to last slide
    await page.keyboard.press('End')
    await expect(page.locator('.slide-counter')).toContainText('10 / 10')

    // Press next
    const nextButton = page.locator('.control-btn').nth(1)
    await nextButton.click()

    await expect(page.locator('.slide-counter')).toContainText('1 / 10')
  })

  test('should wrap around from first to last slide', async ({ page }) => {
    const prevButton = page.locator('.control-btn').nth(0)
    await prevButton.click()

    await expect(page.locator('.slide-counter')).toContainText('10 / 10')
  })

  test('should display progress bar', async ({ page }) => {
    const progressBar = page.locator('.progress-bar')
    await expect(progressBar).toBeVisible()

    const progressFill = page.locator('.progress-fill')
    await expect(progressFill).toBeVisible()
  })

  test('should update progress bar on navigation', async ({ page }) => {
    const progressFill = page.locator('.progress-fill')

    // Get initial width
    const initialWidth = await progressFill.evaluate((el) => el.style.width)

    // Navigate to next slide
    await page.keyboard.press('ArrowRight')

    // Width should have increased
    const newWidth = await progressFill.evaluate((el) => el.style.width)
    expect(parseFloat(newWidth)).toBeGreaterThan(parseFloat(initialWidth))
  })

  test('should hide controls after inactivity', async ({ page }) => {
    const controls = page.locator('.controls')

    // Initially visible
    await expect(controls).toHaveClass(/visible/)

    // Wait for controls to hide (3 seconds + buffer)
    await page.waitForTimeout(3500)

    await expect(controls).toHaveClass(/hidden/)
  })

  test('should show controls on mouse movement', async ({ page }) => {
    // Wait for controls to hide
    await page.waitForTimeout(3500)
    const controls = page.locator('.controls')
    await expect(controls).toHaveClass(/hidden/)

    // Move mouse
    await page.mouse.move(100, 100)

    // Controls should be visible again
    await expect(controls).toHaveClass(/visible/)
  })

  test('should display slide content correctly', async ({ page }) => {
    // Navigate to a content slide
    await page.click('body')
    await page.keyboard.press('ArrowRight')

    // Check for bullet points
    const listItems = page.locator('.slide-list li')
    await expect(listItems).toHaveCount(5)
  })

  test('should have fullscreen button', async ({ page }) => {
    const fullscreenButton = page.locator('.fullscreen-btn')
    await expect(fullscreenButton).toBeVisible()
  })

  test('should display help text', async ({ page }) => {
    const helpText = page.locator('.help-text')
    await expect(helpText).toBeVisible()
    await expect(helpText).toContainText('arrow keys')
  })

  test('should take screenshot of first slide', async ({ page }) => {
    await expect(page).toHaveScreenshot('first-slide.png', {
      fullPage: true,
    })
  })

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('.slide-deck')).toBeVisible()

    // Navigation should still work
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('.slide-counter')).toContainText('2 / 10')
  })
})
