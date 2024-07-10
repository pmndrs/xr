import { Camera, Group } from 'three'

export class XROrigin extends Group {
  constructor(camera: Camera) {
    super()
    this.add(camera)
  }
}
