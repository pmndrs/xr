import {
  Matrix4,
  Plane,
  Quaternion,
  Ray,
  Raycaster,
  Vector3,
  Intersection as ThreeIntersection,
  Object3D,
  Camera,
  Vector2,
} from 'three'
import { Intersection, IntersectionOptions } from './index.js'
import { Pointer, type PointerCapture } from '../pointer.js'
import { computeIntersectionWorldPlane, getDominantIntersectionIndex } from './utils.js'
import { Intersector } from './intersector.js'

const invertedMatrixHelper = new Matrix4()
const intersectsHelper: Array<ThreeIntersection> = []
const matrixHelper = new Matrix4()
const scaleHelper = new Vector3()
const NegZAxis = new Vector3(0, 0, -1)
const directionHelper = new Vector3()
const planeHelper = new Plane()

export class RayIntersector extends Intersector {
  private readonly raycaster = new Raycaster()
  private readonly raycasterQuaternion = new Quaternion()
  private worldScale: number = 0

  constructor(
    private readonly prepareTransformation: (nativeEvent: unknown, matrixWorld: Matrix4) => boolean,
    private readonly options: IntersectionOptions & { minDistance?: number; direction?: Vector3 },
  ) {
    super()
  }

  public intersectPointerCapture(
    { intersection, object }: PointerCapture,
    nativeEvent: unknown,
  ): Intersection | undefined {
    if (intersection.details.type != 'ray') {
      return undefined
    }
    if (!this.prepareIntersection(nativeEvent)) {
      return undefined
    }
    computeIntersectionWorldPlane(planeHelper, intersection, object)
    const { ray } = this.raycaster
    const pointOnFace = ray.intersectPlane(planeHelper, new Vector3()) ?? intersection.point
    return {
      ...intersection,
      object,
      pointOnFace,
      point: ray.direction.clone().multiplyScalar(intersection.distance).add(ray.origin),
      pointerPosition: ray.origin.clone(),
      pointerQuaternion: this.raycasterQuaternion.clone(),
    }
  }

  protected prepareIntersection(nativeEvent: unknown): boolean {
    if (!this.prepareTransformation(nativeEvent, matrixHelper)) {
      return false
    }
    matrixHelper.decompose(this.raycaster.ray.origin, this.raycasterQuaternion, scaleHelper)
    this.worldScale = scaleHelper.x
    this.raycaster.ray.direction.copy(this.options?.direction ?? NegZAxis).applyQuaternion(this.raycasterQuaternion)
    return true
  }

  public executeIntersection(object: Object3D, objectPointerEventsOrder: number | undefined): void {
    object.raycast(this.raycaster, intersectsHelper)
    const index = getDominantIntersectionIndex(
      this.intersection,
      this.pointerEventsOrder,
      intersectsHelper,
      objectPointerEventsOrder,
      this.options,
    )
    if (index != null) {
      this.intersection = intersectsHelper[index]
      this.pointerEventsOrder = objectPointerEventsOrder
    }
    intersectsHelper.length = 0
  }

  public finalizeIntersection(): Intersection | undefined {
    if (this.intersection == null) {
      return undefined
    }
    if (this.options.minDistance != null && this.intersection.distance * this.worldScale < this.options.minDistance) {
      return undefined
    }
    return Object.assign(this.intersection, {
      details: {
        type: 'ray' as const,
      },
      pointerPosition: this.raycaster.ray.origin.clone(),
      pointerQuaternion: this.raycasterQuaternion.clone(),
      pointOnFace: this.intersection.point,
      localPoint: this.intersection.point
        .clone()
        .applyMatrix4(invertedMatrixHelper.copy(this.intersection.object.matrixWorld).invert()),
    })
  }
}

export class CameraRayIntersector extends Intersector {
  private readonly raycaster = new Raycaster()
  private readonly fromPosition = new Vector3()
  private readonly fromQuaternion = new Quaternion()
  private readonly coords = new Vector2()

  private viewPlane = new Plane()

  constructor(
    private readonly prepareTransformation: (nativeEvent: unknown, coords: Vector2) => Camera | undefined,
    private readonly options: IntersectionOptions,
  ) {
    super()
  }

  public intersectPointerCapture(
    { intersection, object }: PointerCapture,
    nativeEvent: unknown,
  ): Intersection | undefined {
    const details = intersection.details
    if (details.type != 'camera-ray') {
      return undefined
    }
    if (!this.prepareIntersection(nativeEvent)) {
      return undefined
    }
    this.viewPlane.constant -= details.distanceViewPlane

    //find captured intersection point by intersecting the ray to the plane of the camera
    const point = this.raycaster.ray.intersectPlane(this.viewPlane, new Vector3())

    if (point == null) {
      return undefined
    }

    computeIntersectionWorldPlane(this.viewPlane, intersection, object)
    return {
      ...intersection,
      object,
      point,
      pointOnFace: point,
      pointerPosition: this.fromPosition.clone(),
      pointerQuaternion: this.fromQuaternion.clone(),
    }
  }

  protected prepareIntersection(nativeEvent: unknown): boolean {
    const from = this.prepareTransformation(nativeEvent, this.coords)
    if (from == null) {
      return false
    }
    from.matrixWorld.decompose(this.fromPosition, this.fromQuaternion, scaleHelper)
    from.updateWorldMatrix(true, false)
    this.raycaster.setFromCamera(this.coords, from)
    this.viewPlane.setFromNormalAndCoplanarPoint(from.getWorldDirection(directionHelper), this.raycaster.ray.origin)
    return true
  }

  public executeIntersection(object: Object3D, objectPointerEventsOrder: number | undefined): void {
    object.raycast(this.raycaster, intersectsHelper)
    const index = getDominantIntersectionIndex(
      this.intersection,
      this.pointerEventsOrder,
      intersectsHelper,
      objectPointerEventsOrder,
      this.options,
    )
    if (index != null) {
      this.intersection = intersectsHelper[index]
      this.pointerEventsOrder = objectPointerEventsOrder
    }
    intersectsHelper.length = 0
  }

  public finalizeIntersection(): Intersection | undefined {
    if (this.intersection == null) {
      return undefined
    }

    invertedMatrixHelper.copy(this.intersection.object.matrixWorld).invert()

    return Object.assign(this.intersection, {
      details: {
        type: 'camera-ray' as const,
        distanceViewPlane: this.viewPlane.distanceToPoint(this.intersection.point),
      },
      pointOnFace: this.intersection.point,
      pointerPosition: this.fromPosition.clone(),
      pointerQuaternion: this.fromQuaternion.clone(),
      localPoint: this.intersection.point.clone().applyMatrix4(invertedMatrixHelper),
    })
  }
}
