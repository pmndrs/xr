import {
  BufferGeometry,
  Camera,
  ColorRepresentation,
  Euler,
  Intersection,
  Mesh,
  Object3D,
  QuadraticBezierCurve3,
  Quaternion,
  Vector3,
  Vector3Tuple,
} from 'three'
import { MeshLineGeometry, MeshLineMaterial } from 'meshline'
import { Pointer } from '@pmndrs/pointer-events'
import { clamp } from 'three/src/math/MathUtils.js'
import { AllowedPointerEvents, AllowedPointerEventsType, PointerOptions } from '@pmndrs/pointer-events/dist/pointer'

/**
 * marks its children as teleportable
 */
export function makeTeleportTarget(
  root: Object3D,
  camera: Camera | (() => Camera),
  onTeleport: (pointer: Vector3, event: PointerEvent) => void,
) {
  root.traverse((object) => (object.userData.teleportTarget = true))
  const listener = (e: {}) => {
    if ('point' in e && e.point instanceof Vector3) {
      const c = typeof camera === 'function' ? camera() : camera
      const point = new Vector3().setFromMatrixPosition(c.matrix).negate().setComponent(1, 0).add(e.point)
      onTeleport(point, e as any)
    }
  }
  root.addEventListener('pointerup', listener)
  return () => {
    root.traverse((object) => (object.userData.teleportTarget = false))
    root.removeEventListener('pointerup', listener)
  }
}

const eulerHelper = new Euler(0, 0, 0, 'YXZ')
const quaternionHelper = new Quaternion()

/**
 * @param space
 * @param rayGroup must be placed directly into the scene
 */
export function syncTeleportPointerRayGroup(space: Object3D, rayGroup: Object3D, deltaTimeMs: number) {
  space.matrixWorld.decompose(rayGroup.position, quaternionHelper, rayGroup.scale)
  eulerHelper.setFromQuaternion(quaternionHelper)
  eulerHelper.z = 0
  eulerHelper.x = clamp(eulerHelper.x - (10 * Math.PI) / 180, -Math.PI / 2, (1.1 * Math.PI) / 4)
  quaternionHelper.setFromEuler(eulerHelper)
  rayGroup.quaternion.slerp(quaternionHelper, deltaTimeMs / 100)
}

/**
 * check if the object is marked as teleportable
 */
export function isTeleportTarget(object: Object3D): boolean {
  return object.userData.teleportTarget === true
}

export function buildTeleportTargetFilter(options: PointerOptions = {}) {
  return (
    object: Object3D,
    pointerEvents: AllowedPointerEvents,
    pointerEventsType: AllowedPointerEventsType,
    pointerEventsOrder: number,
  ) => {
    if (!isTeleportTarget(object)) {
      return false
    }
    if (options.filter != null && !options.filter(object, pointerEvents, pointerEventsType, pointerEventsOrder)) {
      return false
    }
    return true
  }
}

export function createTeleportRayLine() {
  const curve = new QuadraticBezierCurve3(new Vector3(0, 0, 0), new Vector3(0, 0, -8), new Vector3(0, -20, -15))
  return curve.getPoints(20)
}

export type TeleportPointerRayModelOptions = {
  /**
   * @default white
   */
  color?: ColorRepresentation | Vector3Tuple | ((pointer: Pointer) => ColorRepresentation | Vector3Tuple)
  /**
   * @default 0.4
   */
  opacity?: number | ((pointer: Pointer) => number)
  /**
   * @default 0.01
   */
  size?: number
}

export class TeleportPointerRayModel extends Mesh<BufferGeometry, MeshLineMaterial> {
  private readonly multiplier: number
  private lineLengths: Array<number>

  public options: TeleportPointerRayModelOptions = {}

  constructor(points: Array<Vector3>) {
    const geometry = new MeshLineGeometry()
    const float32Array = new Float32Array(points.length * 3)
    for (let i = 0; i < points.length; i++) {
      points[i].toArray(float32Array, i * 3)
    }
    geometry.setPoints(float32Array)
    const multiplier = (points.length * 3 - 3) / (points.length * 3 - 1)
    const material = new MeshLineMaterial({
      lineWidth: 0.1,
      resolution: undefined as any,
      visibility: multiplier,
    })
    super(geometry, material)
    this.material.transparent = true
    this.multiplier = multiplier
    this.material = material
    this.lineLengths = points.slice(0, -1).map((p, i) => p.distanceTo(points[i + 1]))
  }

  update(pointer: Pointer): void {
    const enabled = pointer.getEnabled()
    const intersection = pointer.getIntersection()
    if (!enabled || pointer.getButtonsDown().size === 0 || intersection == null) {
      this.visible = false
      return
    }
    this.visible = true
    if (intersection.details.type != 'lines') {
      this.material.visibility = this.multiplier
      return
    }
    const { distanceOnLine, lineIndex } = intersection.details
    const lineLength = this.lineLengths[lineIndex]
    this.material.visibility = (this.multiplier * (lineIndex + distanceOnLine / lineLength)) / this.lineLengths.length
    const { color = 'white', opacity = 0.4, size = 0.01 } = this.options
    this.material.lineWidth = size
    this.material.opacity = typeof opacity === 'function' ? opacity(pointer) : opacity
    const resolvedColor = typeof color === 'function' ? color(pointer) : color
    if (Array.isArray(resolvedColor)) {
      this.material.color.set(...resolvedColor)
    } else {
      this.material.color.set(resolvedColor)
    }
  }
}
