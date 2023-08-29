import { Event, Group, Object3D, Texture } from 'three'
import { XRControllerModel } from '../XRControllerModel'
import { MotionController } from 'three-stdlib'
import { vi } from 'vitest'

export class XRControllerModelMock extends Group implements XRControllerModel {
  envMap: Texture | null = null
  envMapIntensity = 1
  motionController: MotionController | null = null
  scene: Object3D<Event> | null = null
  setEnvironmentMap(_envMap: Texture): XRControllerModel {
    throw new Error('Method not implemented.')
  }
  setEnvironmentMapIntensity( _envMapIntensity?: number): XRControllerModel {
    throw new Error('Method not implemented.')
  }
  connectModel = vi.fn<[scene: Object3D<Event>], void>()
  connectMotionController = vi.fn<[motionController: MotionController], void>()
  disconnect(): void {
    throw new Error('Method not implemented.')
  }
  dispose(): void {
    throw new Error('Method not implemented.')
  }
}
