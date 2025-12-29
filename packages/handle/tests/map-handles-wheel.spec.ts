import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Browser, BrowserContext, Page, chromium, devices } from 'playwright'
import { createServer, ViteDevServer } from 'vite'
import { resolve } from 'path'

let browser: Browser
let server: ViteDevServer

beforeAll(async () => {
  browser = await chromium.launch({ headless: true })
  server = await createServer({
    configFile: false,
    root: resolve(__dirname, 'browser'),
    server: { port: 3456 },
  })
  await server.listen()
})

afterAll(async () => {
  await browser.close()
  await server.close()
})

describe('MapHandles wheel behavior', () => {
  let context: BrowserContext
  let page: Page
  let width: number
  let height: number

  beforeAll(async () => {
    context = await browser.newContext(devices['Desktop Chrome'])
    const viewport = devices['Desktop Chrome'].viewport!
    width = viewport.width
    height = viewport.height
    page = await context.newPage()
    await page.goto('http://localhost:3456')
    // Wait for scene to initialize
    await page.waitForFunction(() => typeof window.getState === 'function')
  })

  afterAll(async () => {
    await context.close()
  })

  async function getState() {
    return page.evaluate(() => window.getState())
  }

  async function dispatchWheel(options: { deltaX?: number; deltaY?: number; ctrlKey?: boolean; shiftKey?: boolean }) {
    await page.mouse.move(width / 2, height / 2)
    await page.evaluate((opts) => {
      const event = new WheelEvent('wheel', {
        deltaX: opts.deltaX ?? 0,
        deltaY: opts.deltaY ?? 0,
        ctrlKey: opts.ctrlKey ?? false,
        shiftKey: opts.shiftKey ?? false,
        bubbles: true,
        cancelable: true,
      })
      document.getElementById('canvas')!.dispatchEvent(event)
    }, options)
    // Wait for state update
    await page.waitForTimeout(50)
  }

  it('vertical scroll should zoom (change distance)', async () => {
    const before = await getState()
    await dispatchWheel({ deltaY: 100 })
    const after = await getState()

    expect(after.distance).not.toBe(before.distance)
    expect(after.yaw).toBe(before.yaw)
    expect(after.pitch).toBe(before.pitch)
  })

  it('horizontal scroll should rotate yaw', async () => {
    const before = await getState()
    await dispatchWheel({ deltaX: 100 })
    const after = await getState()

    expect(after.yaw).not.toBe(before.yaw)
    expect(after.distance).toBe(before.distance)
    expect(after.pitch).toBe(before.pitch)
  })

  it('ctrl + scroll should change pitch', async () => {
    const before = await getState()
    await dispatchWheel({ deltaY: 100, ctrlKey: true })
    const after = await getState()

    expect(after.pitch).not.toBe(before.pitch)
    expect(after.distance).toBe(before.distance)
    expect(after.yaw).toBe(before.yaw)
  })

  it('shift + scroll should pan (change origin)', async () => {
    const before = await getState()
    await dispatchWheel({ deltaY: 100, shiftKey: true })
    const after = await getState()

    const originChanged =
      after.origin[0] !== before.origin[0] ||
      after.origin[1] !== before.origin[1] ||
      after.origin[2] !== before.origin[2]

    expect(originChanged).toBe(true)
    expect(after.distance).toBe(before.distance)
    expect(after.yaw).toBe(before.yaw)
    expect(after.pitch).toBe(before.pitch)
  })

  it('shift + horizontal scroll should also pan', async () => {
    const before = await getState()
    await dispatchWheel({ deltaX: 100, shiftKey: true })
    const after = await getState()

    const originChanged =
      after.origin[0] !== before.origin[0] ||
      after.origin[1] !== before.origin[1] ||
      after.origin[2] !== before.origin[2]

    expect(originChanged).toBe(true)
  })

  it('scroll down should zoom out (increase distance)', async () => {
    const before = await getState()
    await dispatchWheel({ deltaY: 100 }) // scroll down = positive deltaY
    const after = await getState()

    expect(after.distance).toBeGreaterThan(before.distance)
  })

  it('scroll up should zoom in (decrease distance)', async () => {
    const before = await getState()
    await dispatchWheel({ deltaY: -100 }) // scroll up = negative deltaY
    const after = await getState()

    expect(after.distance).toBeLessThan(before.distance)
  })
})

describe('MapHandles wheel options', () => {
  async function testWithOptions(
    options: string,
    test: (getState: () => Promise<any>, dispatchWheel: (opts: any) => Promise<void>) => Promise<void>,
  ) {
    const context = await browser.newContext(devices['Desktop Chrome'])
    const viewport = devices['Desktop Chrome'].viewport!
    const page = await context.newPage()
    await page.goto(`http://localhost:3456?${options}`)
    await page.waitForFunction(() => typeof window.getState === 'function')

    const getState = () => page.evaluate(() => window.getState())
    const dispatchWheel = async (opts: any) => {
      await page.mouse.move(viewport.width / 2, viewport.height / 2)
      await page.evaluate((o) => {
        const event = new WheelEvent('wheel', {
          deltaX: o.deltaX ?? 0,
          deltaY: o.deltaY ?? 0,
          ctrlKey: o.ctrlKey ?? false,
          shiftKey: o.shiftKey ?? false,
          bubbles: true,
          cancelable: true,
        })
        document.getElementById('canvas')!.dispatchEvent(event)
      }, opts)
      await page.waitForTimeout(50)
    }

    try {
      await test(getState, dispatchWheel)
    } finally {
      await context.close()
    }
  }

  it('pitch=false should disable ctrl+scroll', async () => {
    await testWithOptions('pitch=false', async (getState, dispatchWheel) => {
      const before = await getState()
      await dispatchWheel({ deltaY: 100, ctrlKey: true })
      const after = await getState()

      expect(after.pitch).toBe(before.pitch)
    })
  })

  it('pan=false should disable shift+scroll', async () => {
    await testWithOptions('pan=false', async (getState, dispatchWheel) => {
      const before = await getState()
      await dispatchWheel({ deltaY: 100, shiftKey: true })
      const after = await getState()

      const originChanged =
        after.origin[0] !== before.origin[0] ||
        after.origin[1] !== before.origin[1] ||
        after.origin[2] !== before.origin[2]

      expect(originChanged).toBe(false)
    })
  })

  it('zoom=false should disable vertical scroll zoom', async () => {
    await testWithOptions('zoom=false', async (getState, dispatchWheel) => {
      const before = await getState()
      await dispatchWheel({ deltaY: 100 })
      const after = await getState()

      expect(after.distance).toBe(before.distance)
    })
  })

  it('yaw=false should disable horizontal scroll yaw', async () => {
    await testWithOptions('yaw=false', async (getState, dispatchWheel) => {
      const before = await getState()
      await dispatchWheel({ deltaX: 100 })
      const after = await getState()

      expect(after.yaw).toBe(before.yaw)
    })
  })
})
