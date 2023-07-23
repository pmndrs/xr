import { Event, Group, Object3D, Texture } from 'three'
import { XRControllerModel } from '../XRControllerModel'
import { MotionController } from 'three-stdlib'

export class XRControllerModelMock extends Group implements XRControllerModel {
  envMap: Texture | null = null
  envMapIntensity = 1
  motionController: MotionController | null = null
  scene: Object3D<Event> | null = null
  setEnvironmentMap(envMap: Texture, envMapIntensity?: number): XRControllerModel {
    throw new Error('Method not implemented.')
  }
  connectModel(scene: Object3D<Event>): void {
    throw new Error('Method not implemented.')
  }
  connectMotionController(motionController: MotionController): void {
    throw new Error('Method not implemented.')
  }
  disconnect(): void {
    throw new Error('Method not implemented.')
  }
  dispose(): void {
    throw new Error('Method not implemented.')
  }
}
