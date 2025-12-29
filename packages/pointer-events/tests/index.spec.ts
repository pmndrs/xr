import { afterAll, describe, it } from 'vitest'
import { chromium, devices } from 'playwright'
import { testSetup } from './utils.js'

const browser = await chromium.launch({ headless: true })

describe('compare dom vs own canvas pointer events', () => {
  afterAll(async () => {
    await browser.close()
  })

  it(
    'should emit pointer over, enter, move, down, up, click, out, leave events for interacting with one element',
    { timeout: 100000000 },
    async () => {
      const context = await browser.newContext(devices['Desktop Chrome'])
      const {
        viewport: { width, height },
      } = devices['Desktop Chrome']

      await testSetup(
        context,
        [
          {
            rotation: [0, 0, 0],
            translate: [0, 0, 0],
            scale: [0.5, 0.5, 1],
            type: 'rectangle',
          },
        ],
        async (page, expectMessages) => {
          await page.mouse.move(width * 0.5, height * 0.5)
          await expectMessages('0 pointerover', '0 pointerenter', '0 pointermove')

          await page.mouse.down({
            button: 'left',
          })
          await expectMessages('0 pointerdown')

          await page.mouse.up({
            button: 'left',
          })
          await expectMessages('0 pointerup', '0 click')

          await page.mouse.move(0, 0)
          await expectMessages('0 pointerout', '0 pointerleave')
        },
      )

      await context.close()
    },
  )

  it('should emit events based on z-axis over non-nested elements', async () => {
    const context = await browser.newContext(devices['Desktop Chrome'])
    const {
      viewport: { width, height },
    } = devices['Desktop Chrome']

    await testSetup(
      context,
      [
        {
          rotation: [0, 0, 0],
          translate: [0, 0, 1],
          scale: [0.5, 0.5, 1],
          type: 'rectangle',
        },
        {
          rotation: [0, 0, 0],
          translate: [0, 0, 0],
          scale: [0.75, 0.75, 1],
          type: 'rectangle',
        },
        {
          rotation: [0, 0, 0],
          translate: [0, 0, 2],
          scale: [0.25, 0.25, 1],
          type: 'rectangle',
        },
      ],
      async (page, expectMessages) => {
        await page.mouse.move(width * 0.5, height * 0.5)
        await expectMessages('2 pointerover', '2 pointerenter', '2 pointermove')

        await page.mouse.move(width * (0.5 - 0.125 - 0.125 * 0.5), height * 0.5)
        await expectMessages('2 pointerout', '2 pointerleave', '0 pointerover', '0 pointerenter', '0 pointermove')

        await page.mouse.move(width * (0.5 - 0.25 - 0.125 * 0.5), height * 0.5)
        await expectMessages('0 pointerout', '0 pointerleave', '1 pointerover', '1 pointerenter', '1 pointermove')

        await page.mouse.move(0, height * 0.5)
        await expectMessages('1 pointerout', '1 pointerleave')
      },
    )

    await context.close()
  })

  it('should emit events based on z-axis over nested elements', async () => {
    const context = await browser.newContext(devices['Desktop Chrome'])
    const {
      viewport: { width, height },
    } = devices['Desktop Chrome']

    await testSetup(
      context,
      [
        {
          rotation: [0, 0, 0],
          translate: [0, 0, 0],
          scale: [0.75, 0.75, 1],
          type: 'rectangle',
          children: [
            {
              rotation: [0, 0, 0],
              translate: [0, 0, 1],
              scale: [0.5, 0.5, 1],
              type: 'rectangle',
              children: [
                {
                  rotation: [0, 0, 0],
                  translate: [0, 0, 2],
                  scale: [0.25, 0.25, 1],
                  type: 'rectangle',
                },
              ],
            },
          ],
        },
      ],
      async (page, expectMessages) => {
        await page.mouse.move(width * 0.5, height * 0.5)
        await expectMessages(
          '0:0:0 pointerover',
          '0 pointerenter',
          '0:0 pointerenter',
          '0:0:0 pointerenter',
          '0:0:0 pointermove',
        )

        await page.mouse.move(width * (0.5 - 0.125 - 0.125 * 0.5), height * 0.5)
        await expectMessages('0:0:0 pointerout', '0:0:0 pointerleave', '0:0 pointerover', '0:0 pointermove')

        await page.mouse.move(0, height * 0.5)
        await expectMessages('0:0 pointerout', '0:0 pointerleave', '0 pointerleave')
      },
    )

    await context.close()
  })

  it('should not emit for non-nested element with pointer events none', async () => {
    const context = await browser.newContext(devices['Desktop Chrome'])
    const {
      viewport: { width, height },
    } = devices['Desktop Chrome']

    await testSetup(
      context,
      [
        {
          rotation: [0, 0, 0],
          translate: [0, 0, 1],
          scale: [0.5, 0.5, 1],
          type: 'rectangle',
        },
        {
          rotation: [0, 0, 0],
          translate: [0, 0, 2],
          scale: [0.25, 0.25, 1],
          type: 'rectangle',
          pointerEvents: 'none',
        },
      ],
      async (page, expectMessages) => {
        await page.mouse.move(width * 0.5, height * 0.5)
        await expectMessages('0 pointerover', '0 pointerenter', '0 pointermove')
      },
    )

    await context.close()
  })

  it('should not emit for nested element with pointer events none', async () => {
    const context = await browser.newContext(devices['Desktop Chrome'])
    const {
      viewport: { width, height },
    } = devices['Desktop Chrome']

    await testSetup(
      context,
      [
        {
          rotation: [0, 0, 0],
          translate: [0, 0, 0],
          scale: [0.75, 0.75, 1],
          type: 'rectangle',
          children: [
            {
              rotation: [0, 0, 0],
              translate: [0, 0, 1],
              scale: [0.5, 0.5, 1],
              type: 'rectangle',
              pointerEvents: 'none',
              children: [
                {
                  rotation: [0, 0, 0],
                  translate: [0, 0, 2],
                  scale: [0.25, 0.25, 1],
                  type: 'rectangle',
                  pointerEvents: 'auto',
                },
              ],
            },
          ],
        },
      ],
      async (page, expectMessages) => {
        await page.mouse.move(width * 0.5, height * 0.5)
        await expectMessages(
          '0:0:0 pointerover',
          '0 pointerenter',
          '0:0 pointerenter',
          '0:0:0 pointerenter',
          '0:0:0 pointermove',
        )
      },
    )

    await context.close()
  })

  /*it(
    "should emit the same events when fuzzy testing",
    async () => {
      const context = await browser.newContext({
        ...devices["Desktop Chrome"],
        //recordVideo: { dir: resolve(__dirname, "./videos") },
      });
      const {
        viewport: { width, height },
      } = devices["Desktop Chrome"];

      await testSetup(
        context,
        new Array(100).fill(undefined).map(() => ({
          rotation: [
            Math.random() * 140 - 70,
            Math.random() * 140 - 70,
            Math.random() * 140 - 70,
          ],
          scale: [Math.random() * 0.95 + 0.05, Math.random() * 0.95 + 0.05, 1],
          translate: [
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5,
          ],
          type: Math.random() > 0.5 ? "circle" : "rectangle",
        })),
        async (page, _, domMessages, canvasMessages) => {
          let mouseDown = false;
          //execute 5000 actions
          for (let i = 0; i < 1000; i++) {
            if (Math.random() > 0.8) {
              //20% chance of toggle mouse
              mouseDown = !mouseDown;
              if (mouseDown) {
                await page.mouse.down();
              } else {
                await page.mouse.up();
              }
            } else {
              //80% chance of move mouse
              await page.mouse.move(
                width * Math.random(),
                height * Math.random()
              );
            }
          }

          expect(domMessages).to.deep.equal(canvasMessages)
        }
      );

      await context.close();
    },
    {
      timeout: 100000, //100seconds
    }
  );*/

  it('should emit wheel event', async () => {
    const context = await browser.newContext(devices['Desktop Chrome'])
    const {
      viewport: { width, height },
    } = devices['Desktop Chrome']

    await testSetup(
      context,
      [
        {
          rotation: [0, 0, 0],
          translate: [0, 0, 0],
          scale: [0.5, 0.5, 1],
          type: 'rectangle',
        },
      ],
      async (page, expectMessages) => {
        await page.mouse.move(width * 0.5, height * 0.5)
        await page.mouse.wheel(10, 10)
        await expectMessages('0 pointerover', '0 pointerenter', '0 pointermove', '0 wheel')
      },
    )

    await context.close()
  })

  it('should emit double click event', async () => {
    const context = await browser.newContext(devices['Desktop Chrome'])
    const {
      viewport: { width, height },
    } = devices['Desktop Chrome']

    await testSetup(
      context,
      [
        {
          rotation: [0, 0, 0],
          translate: [0, 0, 0],
          scale: [0.5, 0.5, 1],
          type: 'rectangle',
        },
      ],
      async (page, expectMessages) => {
        await page.mouse.dblclick(width * 0.5, height * 0.5)
        await page.mouse.dblclick(width * 0.5, height * 0.5)
        await page.mouse.click(width * 0.5, height * 0.5)
        await expectMessages(
          '0 pointerover',
          '0 pointerenter',
          '0 pointermove',
          '0 pointerdown',
          '0 pointerup',
          '0 click',
          '0 pointerdown',
          '0 pointerup',
          '0 click',
          '0 dblclick',
          '0 pointermove',
          '0 pointerdown',
          '0 pointerup',
          '0 click',
          '0 pointerdown',
          '0 pointerup',
          '0 click',
          '0 dblclick',
          '0 pointermove',
          '0 pointerdown',
          '0 pointerup',
          '0 click',
        )
      },
    )

    await context.close()
  })

  /*
  turns out browser and operating systems do this really different
  it('should emit context menu event', async () => {
    const context = await browser.newContext(devices['Desktop Chrome'])
    const {
      viewport: { width, height },
    } = devices['Desktop Chrome']

    await testSetup(
      context,
      [
        {
          rotation: [0, 0, 0],
          translate: [0, 0, 0],
          scale: [0.5, 0.5, 1],
          type: 'rectangle',
        },
      ],
      async (page, expectMessages) => {
        await page.mouse.click(width * 0.5, height * 0.5, { button: 'right' })
        await expectMessages(
          '0 pointerover',
          '0 pointerenter',
          '0 pointermove',
          '0 pointerdown',
          '0 contextmenu',
          '0 pointerup',
        )
      },
    )

    await context.close()
  })*/

  it('should emit pointer move events on captured element even when outside', async () => {
    const context = await browser.newContext(devices['Desktop Chrome'])
    const {
      viewport: { width, height },
    } = devices['Desktop Chrome']

    await testSetup(
      context,
      [
        {
          rotation: [0, 0, 0],
          translate: [0, 0, 0],
          scale: [0.5, 0.5, 1],
          type: 'rectangle',
          capture: true,
        },
      ],
      async (page, expectMessages) => {
        await page.mouse.move(width * 0.5, height * 0.5)
        await page.mouse.down()
        await expectMessages('0 pointerover', '0 pointerenter', '0 pointermove', '0 pointerdown')

        await page.mouse.move(0, 0)
        await expectMessages('0 pointermove')

        await page.mouse.move(width, 0)
        await expectMessages('0 pointermove')

        await page.mouse.move(width, height)
        await expectMessages('0 pointermove')

        //await page.waitForTimeout(400)

        await page.mouse.move(0, height)
        await page.mouse.up()
        await expectMessages('0 pointermove', '0 pointerup', '0 click', '0 pointerout', '0 pointerleave')

        await page.mouse.move(0, 0)
        await expectMessages()
      },
    )

    await context.close()
  })

  it('should handle pointer leaving with button held and returning without button', async () => {
    const context = await browser.newContext(devices['Desktop Chrome'])
    const {
      viewport: { width, height },
    } = devices['Desktop Chrome']

    await testSetup(
      context,
      [
        {
          rotation: [0, 0, 0],
          translate: [0, 0, 0],
          scale: [0.5, 0.5, 1],
          type: 'rectangle',
          capture: true,
        },
      ],
      async (page, expectMessages) => {
        await page.mouse.move(width * 0.5, height * 0.5)
        await page.mouse.down()
        await expectMessages('0 pointerover', '0 pointerenter', '0 pointermove', '0 pointerdown')

        // Simulate leaving window with button held
        await page.evaluate(() => {
          const canvas = document.querySelector('canvas')!
          canvas.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true, pointerId: 1, buttons: 1 }))
        })

        // Simulate returning without button (released outside)
        await page.mouse.up() // Release
        await page.mouse.move(width * 0.5, height * 0.5)
        await expectMessages('0 pointerup', '0 click', '0 pointermove')
      },
    )

    await context.close()
  })

  it('should preserve capture when pointer leaves and re-enters window', async () => {
    const context = await browser.newContext(devices['Desktop Chrome'])
    const {
      viewport: { width, height },
    } = devices['Desktop Chrome']

    await testSetup(
      context,
      [
        {
          rotation: [0, 0, 0],
          translate: [0, 0, 0],
          scale: [0.5, 0.5, 1],
          type: 'rectangle',
          capture: true,
        },
      ],
      async (page, expectMessages) => {
        await page.mouse.move(width * 0.5, height * 0.5)
        await page.mouse.down()
        await expectMessages('0 pointerover', '0 pointerenter', '0 pointermove', '0 pointerdown')

        // Simulate leaving the window by dispatching pointerleave with button held
        await page.evaluate(() => {
          const canvas = document.querySelector('canvas')!
          canvas.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true, pointerId: 1, buttons: 1 }))
        })

        // Move back in - should still be captured
        await page.mouse.move(width * 0.5, height * 0.5)
        await expectMessages('0 pointermove')

        await page.mouse.up()
        await expectMessages('0 pointerup', '0 click')
      },
    )

    await context.close()
  })

  //TODO: nesting (pointer enter vs pointer over and pointer leave vs pointer out)
  //TODO: test browser blur
  //TODO: test event propagation
})
