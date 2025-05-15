import { Group, PerspectiveCamera, OrthographicCamera, Vector3, Euler, Quaternion } from 'three'
import { HandlesContext } from '../context.js'
import { HandlesProperties } from '../index.js'
import { computeHandlesScale } from '../utils.js'
import { AxisTranslateHandle } from './axis.js'
import { setupTranslateHandleDelta } from './delta.js'
import { FreeTranslateHandle } from './free.js'
import { PlaneTranslateHandle } from './plane.js'

export * from './free.js'
export * from './axis.js'
export * from './delta.js'
export * from './plane.js'

const vectorHelper = new Vector3()
const quaternionHelper = new Quaternion()

const xRotationOffset = new Quaternion()
const yRotationOffset = new Quaternion().setFromEuler(new Euler(0, 0, Math.PI / 2))
const zRotationOffset = new Quaternion().setFromEuler(new Euler(0, -Math.PI / 2, 0))

const xyRotationOffset = new Quaternion()
const yzRotationOffset = new Quaternion().setFromEuler(new Euler(0, -Math.PI / 2, 0))
const xzRotationOffset = new Quaternion().setFromEuler(new Euler(Math.PI / 2, 0, 0))

export class TranslateHandles extends Group {
  private readonly free: FreeTranslateHandle
  private readonly translationX: AxisTranslateHandle
  private readonly translationY: AxisTranslateHandle
  private readonly translationZ: AxisTranslateHandle
  private readonly translationNegX: AxisTranslateHandle
  private readonly translationNegY: AxisTranslateHandle
  private readonly translationNegZ: AxisTranslateHandle
  private readonly translationXY: PlaneTranslateHandle
  private readonly translationYZ: PlaneTranslateHandle
  private readonly translationXZ: PlaneTranslateHandle
  private readonly scaleGroup = new Group()

  private readonly xAxis = new Vector3()
  private readonly yAxis = new Vector3()
  private readonly zAxis = new Vector3()
  private readonly negXAxis = new Vector3()
  private readonly negYAxis = new Vector3()
  private readonly negZAxis = new Vector3()

  constructor(
    private readonly context: HandlesContext,
    public size?: number,
    public fixed?: boolean,
  ) {
    super()
    this.add(this.scaleGroup)
    this.free = new FreeTranslateHandle(this.context)
    this.scaleGroup.add(this.free)
    this.translationX = new AxisTranslateHandle(this.context, 'x', undefined, this.xAxis)
    this.scaleGroup.add(this.translationX)
    this.translationY = new AxisTranslateHandle(this.context, 'y', undefined, this.yAxis)
    this.scaleGroup.add(this.translationY)
    this.translationZ = new AxisTranslateHandle(this.context, 'z', undefined, this.zAxis)
    this.scaleGroup.add(this.translationZ)
    this.translationNegX = new AxisTranslateHandle(this.context, 'x', undefined, this.negXAxis, true, false)
    this.scaleGroup.add(this.translationNegX)
    this.translationNegY = new AxisTranslateHandle(this.context, 'y', undefined, this.negYAxis, true, false)
    this.scaleGroup.add(this.translationNegY)
    this.translationNegZ = new AxisTranslateHandle(this.context, 'z', undefined, this.negZAxis, true, false)
    this.scaleGroup.add(this.translationNegZ)
    this.translationXY = new PlaneTranslateHandle(this.context, 'xy', undefined, [this.xAxis, this.yAxis])
    this.scaleGroup.add(this.translationXY)
    this.translationXZ = new PlaneTranslateHandle(this.context, 'xz', undefined, [this.xAxis, this.zAxis])
    this.scaleGroup.add(this.translationXZ)
    this.translationYZ = new PlaneTranslateHandle(this.context, 'yz', undefined, [this.yAxis, this.zAxis])
    this.scaleGroup.add(this.translationYZ)
  }

  update(camera: PerspectiveCamera | OrthographicCamera) {
    this.updateWorldMatrix(true, false)

    this.xAxis.set(1, 0, 0)
    this.yAxis.set(0, 1, 0)
    this.zAxis.set(0, 0, 1)

    this.free.quaternion.identity()
    this.translationX.quaternion.copy(xRotationOffset)
    this.translationY.quaternion.copy(yRotationOffset)
    this.translationZ.quaternion.copy(zRotationOffset)
    this.translationNegX.quaternion.copy(xRotationOffset)
    this.translationNegY.quaternion.copy(yRotationOffset)
    this.translationNegZ.quaternion.copy(zRotationOffset)
    this.translationXY.quaternion.copy(xyRotationOffset)
    this.translationYZ.quaternion.copy(yzRotationOffset)
    this.translationXZ.quaternion.copy(xzRotationOffset)

    const space = this.context.getSpace()
    const target = this.context.getTarget()

    if (space == 'world' && target != null) {
      target.getWorldQuaternion(quaternionHelper).invert()
      this.free.quaternion.premultiply(quaternionHelper)
      this.translationX.quaternion.premultiply(quaternionHelper)
      this.translationY.quaternion.premultiply(quaternionHelper)
      this.translationZ.quaternion.premultiply(quaternionHelper)
      this.translationNegX.quaternion.premultiply(quaternionHelper)
      this.translationNegY.quaternion.premultiply(quaternionHelper)
      this.translationNegZ.quaternion.premultiply(quaternionHelper)
      this.translationXY.quaternion.premultiply(quaternionHelper)
      this.translationYZ.quaternion.premultiply(quaternionHelper)
      this.translationXZ.quaternion.premultiply(quaternionHelper)

      if (target.parent != null) {
        target.parent.getWorldQuaternion(quaternionHelper).invert()
        this.xAxis.applyQuaternion(quaternionHelper)
        this.yAxis.applyQuaternion(quaternionHelper)
        this.zAxis.applyQuaternion(quaternionHelper)
      }
    } else if (target != null) {
      this.xAxis.applyQuaternion(target.quaternion)
      this.yAxis.applyQuaternion(target.quaternion)
      this.zAxis.applyQuaternion(target.quaternion)
    }
    this.negXAxis.copy(this.xAxis).negate()
    this.negYAxis.copy(this.yAxis).negate()
    this.negZAxis.copy(this.zAxis).negate()

    this.scaleGroup.scale.setScalar(1)
    if (target != null) {
      target.getWorldScale(vectorHelper)
      this.scaleGroup.scale.divide(vectorHelper)
    }
    this.scaleGroup.scale.multiplyScalar(computeHandlesScale(this, camera, this.fixed ?? true, this.size ?? 1))
  }

  bind(options?: HandlesProperties) {
    const cleanupDelta = setupTranslateHandleDelta(this, this.context)
    const unbindTranslationX = this.translationX.bind(0xff0000, 0xffff00, options)
    const unbindTranslationY = this.translationY.bind(0x00ff00, 0xffff00, options)
    const unbindTranslationZ = this.translationZ.bind(0x0000ff, 0xffff00, options)
    const unbindTranslationNegX = this.translationNegX.bind(0xff0000, 0xffff00, options)
    const unbindTranslationNegY = this.translationNegY.bind(0x00ff00, 0xffff00, options)
    const unbindTranslationNegZ = this.translationNegZ.bind(0x0000ff, 0xffff00, options)
    const unbindTranslationXY = this.translationXY.bind(0x0000ff, 0xffff00, options)
    const unbindTranslationYZ = this.translationYZ.bind(0xff0000, 0xffff00, options)
    const unbindTranslationXZ = this.translationXZ.bind(0x00ff00, 0xffff00, options)
    const unbindFree = this.free.bind(options)

    return () => {
      cleanupDelta()
      unbindTranslationX?.()
      unbindTranslationY?.()
      unbindTranslationZ?.()
      unbindTranslationNegX?.()
      unbindTranslationNegY?.()
      unbindTranslationNegZ?.()
      unbindTranslationXY?.()
      unbindTranslationYZ?.()
      unbindTranslationXZ?.()
      unbindFree?.()
    }
  }
}
