import { Group, OrthographicCamera, PerspectiveCamera, TorusGeometry, Vector3 } from 'three'
import { AxisRotateHandle } from './axis.js'
import { FreeRotateHandle } from './free.js'
import { ScreenSpaceRotateHandle } from './screen.js'
import { HandlesContext } from '../context.js'
import { HandlesProperties } from '../index.js'
import { computeHandlesScale } from '../utils.js'

export function createCircleGeometry(radius: number, arc: number) {
  const geometry = new TorusGeometry(radius, 0.0075, 3, 64, arc * Math.PI * 2)
  geometry.rotateY(Math.PI / 2)
  geometry.rotateX(Math.PI / 2)
  return geometry
}

const vectorHelper = new Vector3()

export class RotateHandles extends Group {
  private readonly rotationX: AxisRotateHandle
  private readonly rotationY: AxisRotateHandle
  private readonly rotationZ: AxisRotateHandle
  private readonly free: FreeRotateHandle
  private readonly screen: ScreenSpaceRotateHandle

  constructor(
    private readonly context: HandlesContext,
    public fixed?: boolean,
    public size?: number,
  ) {
    super()
    this.rotationX = new AxisRotateHandle(this.context, 'x')
    this.add(this.rotationX)
    this.rotationY = new AxisRotateHandle(this.context, 'y')
    this.add(this.rotationY)
    this.rotationZ = new AxisRotateHandle(this.context, 'z')
    this.add(this.rotationZ)
    this.free = new FreeRotateHandle(this.context)
    this.add(this.free)
    this.screen = new ScreenSpaceRotateHandle(this.context)
    this.add(this.screen)
  }

  update(camera: PerspectiveCamera | OrthographicCamera) {
    this.updateWorldMatrix(true, false)
    this.rotationX.update(camera)
    this.rotationY.update(camera)
    this.rotationZ.update(camera)
    this.free.update(camera)
    this.screen.update(camera)
    this.scale.setScalar(1)
    const target = this.context.getTarget()
    if (target != null) {
      target.getWorldScale(vectorHelper)
      this.scale.divide(vectorHelper)
    }
    this.scale.multiplyScalar(computeHandlesScale(this, camera, this.fixed ?? true, this.size ?? 1))
  }

  bind(options?: HandlesProperties) {
    const unbindTranslationX = this.rotationX.bind(0xff0000, options)
    const unbindTranslationY = this.rotationY.bind(0x00ff00, options)
    const unbindTranslationZ = this.rotationZ.bind(0x0000ff, options)
    const unbindScreen = this.screen.bind(options)
    const unbindFree = this.free.bind(options)

    return () => {
      unbindTranslationX?.()
      unbindTranslationY?.()
      unbindTranslationZ?.()
      unbindScreen?.()
      unbindFree?.()
    }
  }
}
