import { GLTFLoader } from 'three-stdlib'
import { XRControllerModelFactory } from '../XRControllerModelFactory'
import { vi, afterAll } from 'vitest'
import { XRControllerModel } from '../XRControllerModel'

afterAll(() => {
  XRControllerModelFactoryMock.instance = undefined
})

// @ts-ignore
export class XRControllerModelFactoryMock implements XRControllerModelFactory {
  static instance: XRControllerModelFactoryMock | undefined
  constructor() {
    XRControllerModelFactoryMock.instance = this
  }
  // @ts-ignore
  gltfLoader: GLTFLoader
  // @ts-ignore
  path: string
  initializeControllerModel = vi.fn<[controllerModel: XRControllerModel, xrInputSource: XRInputSource], Promise<void>>(() => Promise.resolve())
}
