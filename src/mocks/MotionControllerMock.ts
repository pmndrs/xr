import { MotionController } from "three-stdlib"
import { vi } from "vitest"
import { XRInputSourceMock } from "./XRInputSourceMock"

export class MotionControllerMock implements MotionController {
  constructor() {
    this.xrInputSource = new XRInputSourceMock()
  }
  xrInputSource: XRInputSource
  // @ts-ignore
  assetUrl: string
  // @ts-ignore
  layoutDescription: MotionController['layoutDescription']
  // @ts-ignore
  id: string
  components: MotionController['components'] = {}
  get gripSpace(): XRInputSource {
    throw new Error('Method not implemented.')
  }
  get targetRaySpace(): XRInputSource {
    throw new Error('Method not implemented.')
  }
  get data(): ({ id: string } & { state: string; button: number | undefined; xAxis: number | undefined; yAxis: number | undefined })[] {
    throw new Error('Method not implemented.')
  }
  updateFromGamepad = vi.fn()
}
