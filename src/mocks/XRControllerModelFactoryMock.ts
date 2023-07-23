import { GLTFLoader } from 'three-stdlib'
import { XRControllerModelFactory } from '../XRControllerModelFactory'
import { vi, afterEach } from 'vitest'
import { XRControllerModel } from '../XRControllerModel'

afterEach(() => {

    console.log(3)
  XRControllerModelFactoryMock.instance = undefined
})

// @ts-ignore
export class XRControllerModelFactoryMock implements XRControllerModelFactory {
  static instance: XRControllerModelFactoryMock | undefined
  constructor() {
    console.log(1)
    XRControllerModelFactoryMock.instance = this
    console.log(1.5)
  }
  // @ts-ignore
  gltfLoader: GLTFLoader
  // @ts-ignore
  path: string
  initializeControllerModel = vi.fn<[controllerModel: XRControllerModel, xrInputSource: XRInputSource], void>()
}
