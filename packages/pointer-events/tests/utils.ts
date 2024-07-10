import { resolve } from 'path'
import { BrowserContext, Page } from 'playwright'
import { createServer } from 'vite'
import { expect } from 'vitest'

const messageRegex = /\[(dom|canvas)\] (.*)/

export type ElementInfo = {
  rotation: [number, number, number]
  scale: [number, number, number]
  translate: [number, number, number]
  type: 'circle' | 'rectangle'
  capture?: boolean
  pointerEvents?: 'none' | 'auto'
  children?: Array<ElementInfo>
}

export async function testSetup(
  context: BrowserContext,
  elements: Array<ElementInfo>,
  fn: (
    page: Page,
    expectMessages: (...expected: Array<string>) => Promise<void>,
    domMessages: Array<string>,
    canvasMessages: Array<string>,
  ) => Promise<void>,
) {
  const server = await createServer({
    configFile: false,
    plugins: [
      {
        name: 'resolve-elements-plugin',
        resolveId(id) {
          if (id === './elements.json') {
            return 'elements.json'
          }
        },
        load(id) {
          if (id === 'elements.json') {
            return JSON.stringify(elements)
          }
          return null
        },
      },
    ],
    root: resolve(__dirname, 'browser'),
    server: {
      port: 1337,
    },
  })
  await server.listen()
  const page = await context.newPage()
  await page.goto('http://localhost:1337')

  const domMessages: Array<string> = []
  const canvasMessages: Array<string> = []
  page.on('console', (e) => {
    const result = messageRegex.exec(e.text())
    if (result == null) {
      return
    }
    const [, type] = result
    ;(type === 'dom' ? domMessages : canvasMessages).push(e.text())
  })

  await fn(page, expectMessages.bind(null, page, domMessages, canvasMessages), domMessages, canvasMessages).finally(
    async () => {
      await page.close()
      await server.close()
    },
  )
}

async function expectMessages(
  page: Page,
  domMessages: Array<string>,
  canvasMessages: Array<string>,
  ...expected: Array<string>
): Promise<void> {
  const expectedLength = expected.length
  for (let i = 0; i < expectedLength; i++) {
    await Promise.all([
      expectMessage(page, 'dom', domMessages, expected, i),
      expectMessage(page, 'canvas', canvasMessages, expected, i),
    ])
  }
  if (expectedLength === 0) {
    await page.waitForTimeout(100)
  }
  if (expectedLength != domMessages.length) {
    expect(domMessages).to.deep.equal(expected)
  }
  if (expectedLength != canvasMessages.length) {
    expect(canvasMessages).to.deep.equal(expected)
  }
  domMessages.length = 0
  canvasMessages.length = 0
}

async function expectMessage(
  page: Page,
  prefix: 'dom' | 'canvas',
  messages: Array<string>,
  expected: Array<string>,
  index: number,
) {
  const expectedMessage = expected[index]
  if (messages[index] != null) {
    expect(messages[index]).to.equal(`[${prefix}] ${expectedMessage}`)
  } else {
    const event = await page
      .waitForEvent('console', {
        predicate: (e) => e.text().startsWith(`[${prefix}]`),
        timeout: 100,
      })
      .catch(() => ({ text: () => 'timeout' }))
    expect(event.text()).to.equal(`[${prefix}] ${expectedMessage}`)
  }
}
