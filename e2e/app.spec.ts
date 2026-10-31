import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const stopwatchDisplay = (page: Page) =>
  page.locator('#panel-stopwatch .font-mono.font-bold')

const timerDisplay = (page: Page) =>
  page.locator('#panel-timer .font-mono.font-bold')

async function openTimer(page: Page) {
  await page.getByRole('tab', { name: /^Timer/ }).click()
}

async function setTimer(page: Page, minutes: string, seconds: string) {
  await page.getByLabel('Minutes').fill(minutes)
  await page.getByLabel('Seconds').fill(seconds)
}

// Every test gets a fresh browser context, so storage always starts empty.
test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('loads cleanly: no console errors, CSP violations or failed requests', async ({
  page,
}) => {
  const problems: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      problems.push(`${message.type()}: ${message.text()}`)
    }
  })
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`))
  page.on('requestfailed', (request) =>
    problems.push(`requestfailed: ${request.url()}`),
  )

  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Stopwatch & Timer',
  )
  await page.getByRole('button', { name: 'Start' }).click()
  await openTimer(page)
  await page.waitForTimeout(500)

  expect(problems).toEqual([])
})

test('sends security headers and a valid manifest', async ({
  page,
  request,
}) => {
  const response = await page.goto('/')
  const headers = response?.headers() ?? {}
  expect(headers['content-security-policy']).toContain("default-src 'self'")
  expect(headers['x-content-type-options']).toBe('nosniff')
  expect(headers['x-frame-options']).toBe('DENY')
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')

  const manifestResponse = await request.get('/manifest.webmanifest')
  expect(manifestResponse.ok()).toBe(true)
  const manifest = (await manifestResponse.json()) as {
    name: string
    display: string
    icons: { src: string; sizes: string }[]
  }
  expect(manifest.name).toBe('Stopwatch & Timer')
  expect(manifest.display).toBe('standalone')
  expect(manifest.icons.map((icon) => icon.sizes)).toEqual(
    expect.arrayContaining(['192x192', '512x512']),
  )
  for (const icon of manifest.icons) {
    expect((await request.get(icon.src)).ok()).toBe(true)
  }
})

// axe measures the colours on screen right now. Colour transitions would make
// it see halfway values (a fast CI runner got there before they finished), so
// wait until nothing is animating before every scan.
async function settled(page: Page) {
  await page.waitForFunction(() => document.getAnimations().length === 0)
}

test.describe('accessibility (axe)', () => {
  for (const colorScheme of ['light', 'dark'] as const) {
    test.describe(`${colorScheme} mode`, () => {
      // Load the page in the scheme instead of switching after load.
      test.use({ colorScheme })

      test('stopwatch and timer have no violations', async ({ page }) => {
        await page.getByRole('button', { name: 'Start' }).click()
        await page.getByRole('button', { name: 'Lap' }).click()
        await page.waitForTimeout(300)
        await page.getByRole('button', { name: 'Lap' }).click()
        await page.getByRole('button', { name: 'Lap' }).click()
        await page.getByRole('button', { name: 'Pause' }).click()

        await settled(page)
        const stopwatchResults = await new AxeBuilder({ page }).analyze()
        expect(stopwatchResults.violations).toEqual([])

        await openTimer(page)
        await settled(page)
        const timerResults = await new AxeBuilder({ page }).analyze()
        expect(timerResults.violations).toEqual([])

        await setTimer(page, '0', '0')
        await settled(page)
        const errorResults = await new AxeBuilder({ page }).analyze()
        expect(errorResults.violations).toEqual([])
      })
    })
  }
})

test('stopwatch: start, pause, lap and reset', async ({ page }) => {
  await page.getByRole('button', { name: 'Start' }).click()
  await page.waitForTimeout(1_200)
  await page.getByRole('button', { name: 'Lap' }).click()
  await page.getByRole('button', { name: 'Pause' }).click()

  const paused = await stopwatchDisplay(page).textContent()
  expect(paused).toMatch(/^00:0[1-2]\.\d\d$/)
  await page.waitForTimeout(600)
  await expect(stopwatchDisplay(page)).toHaveText(paused ?? '')
  await expect(page.getByRole('listitem')).toHaveCount(1)

  await page.getByRole('button', { name: 'Reset' }).click()
  await expect(stopwatchDisplay(page)).toHaveText('00:00.00')
  await expect(page.getByRole('listitem')).toHaveCount(0)
})

test('timer: finishes, announces once and unlocks editing', async ({
  page,
}) => {
  await openTimer(page)
  await setTimer(page, '0', '2')
  await page.getByRole('button', { name: 'Start' }).click()
  await expect(page).toHaveTitle(/· Timer$/)

  await expect(timerDisplay(page)).toHaveText("Time's up", { timeout: 5_000 })
  await expect(page.getByText('Timer finished')).toHaveCount(1)
  await expect(page).toHaveTitle("Time's up · Timer")
  await expect(page.getByLabel('Seconds')).toBeEnabled()

  await page.getByRole('button', { name: 'Reset' }).click()
  await expect(page).toHaveTitle('Stopwatch & Timer')
})

test('timer: pasting bad values is sanitised', async ({ page }) => {
  await openTimer(page)
  const hours = page.getByLabel('Hours')
  for (const [pasted, expected] of [
    ['-5', '0'],
    ['999', '99'],
    ['abc', '0'],
    ['1.5', '1'],
  ] as const) {
    await hours.evaluate((element, text) => {
      const data = new DataTransfer()
      data.setData('text', text)
      element.dispatchEvent(
        new ClipboardEvent('paste', {
          clipboardData: data,
          bubbles: true,
          cancelable: true,
        }),
      )
    }, pasted)
    await expect(hours).toHaveValue(expected)
  }
})

test('a running stopwatch survives a page reload', async ({ page }) => {
  await page.getByRole('button', { name: 'Start' }).click()
  await page.waitForTimeout(1_000)
  await page.getByRole('button', { name: 'Lap' }).click()
  await page.reload()

  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()
  await expect(page.getByRole('listitem')).toHaveCount(1)
  await page.waitForTimeout(500)
  const text = (await stopwatchDisplay(page).textContent()) ?? ''
  const seconds = Number(text.slice(3, 5)) + Number(text.slice(6)) / 100
  expect(seconds).toBeGreaterThan(1.4)
})

test('a running timer survives a page reload', async ({ page }) => {
  await openTimer(page)
  await page.getByRole('button', { name: '25 min' }).click()
  await page.getByRole('button', { name: 'Start' }).click()
  await page.waitForTimeout(1_200)
  await page.reload()
  await openTimer(page)

  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()
  await expect(timerDisplay(page)).toHaveText(/^00:24:(5\d|4\d)$/)
})

test('works offline after the first visit', async ({ page, context }) => {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload()
  await context.setOffline(true)
  await page.reload()

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Stopwatch & Timer',
  )
  await page.getByRole('button', { name: 'Start' }).click()
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()
  await context.setOffline(false)
})

test('keyboard only: tabs, shortcuts and focus order', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'keyboard interaction is a desktop concern')

  await page.getByRole('tab', { name: /^Stopwatch/ }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('tab', { name: /^Timer/ })).toBeFocused()
  await expect(page.getByRole('tab', { name: /^Timer/ })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await page.keyboard.press('Home')
  await expect(page.getByRole('tab', { name: /^Stopwatch/ })).toHaveAttribute(
    'aria-selected',
    'true',
  )

  await page.locator('body').click({ position: { x: 5, y: 5 } })
  await page.keyboard.press('Space')
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()
  await page.keyboard.press('l')
  await expect(page.getByRole('listitem')).toHaveCount(1)
  await page.keyboard.press('r')
  await expect(stopwatchDisplay(page)).toHaveText('00:00.00')
})

test('layout holds at 360px: no horizontal scroll, 44px targets', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 740 })
  await openTimer(page)
  await page.getByLabel('Hours').fill('99')
  await page.getByLabel('Minutes').fill('59')
  await page.getByLabel('Seconds').fill('59')

  const scrollWidth = await page.evaluate(
    () => document.documentElement.scrollWidth,
  )
  expect(scrollWidth).toBeLessThanOrEqual(360)

  const small = await page.evaluate(() =>
    [...document.querySelectorAll('button:not(:disabled), input, a')]
      .filter((element) => (element as HTMLElement).offsetParent !== null)
      .map((element) => ({
        label: (element.textContent || element.id).trim().slice(0, 20),
        height: element.getBoundingClientRect().height,
      }))
      .filter((item) => item.height < 43.5),
  )
  expect(small).toEqual([])
})
