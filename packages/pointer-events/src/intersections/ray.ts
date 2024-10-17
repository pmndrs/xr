import {
  Matrix4,
  Plane,
  Quaternion,
  Raycaster,
  Vector3,
  Intersection as ThreeIntersection,
  Object3D,
  Camera,
  Vector2,
} from 'three'
import { Intersection, IntersectionOptions } from './index.js'
import { type PointerCapture } from '../pointer.js'
import { computeIntersectionWorldPlane, getDominantIntersectionIndex, voidObjectIntersectionFromRay } from './utils.js'
import { Intersector } from './intersector.js'
import { updateAndCheckWorldTransformation } from '../utils.js'

const invertedMatrixHelper = new Matrix4()
const intersectsHelper: Array<ThreeIntersection> = []
const scaleHelper = new Vector3()
const NegZAxis = new Vector3(0, 0, -1)
const directionHelper = new Vector3()
const planeHelper = new Plane()

export class RayIntersector extends Intersector {
  private readonly raycaster = new Raycaster()
  private readonly raycasterQuaternion = new Quaternion()
  private worldScale: number = 0

  private ready?: boolean

  constructor(
    private readonly space: { current?: Object3D | null },
    private readonly options: IntersectionOptions & { minDistance?: number; direction?: Vector3 },
  ) {
    super()
  }

  public isReady(): boolean {
    return this.ready ?? this.prepareTransformation()
  }

  private prepareTransformation(): boolean {
    const spaceObject = this.space.current
    if (spaceObject == null) {
      return (this.ready = false)
    }
    this.ready = updateAndCheckWorldTransformation(spaceObject)
    if (!this.ready) {
      return false
    }
    spaceObject.matrixWorld.decompose(this.raycaster.ray.origin, this.raycasterQuaternion, scaleHelper)
    this.worldScale = scaleHelper.x
    this.raycaster.ray.direction.copy(this.options?.direction ?? NegZAxis).applyQuaternion(this.raycasterQuaternion)
    return true
  }

  public intersectPointerCapture({ intersection, object }: PointerCapture): Intersection {
    if (intersection.details.type != 'ray') {
      throw new Error(
        `unable to process a pointer capture of type "${intersection.details.type}" with a ray intersector`,
      )
    }
    if (!this.prepareTransformation()) {
      return intersection
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

  protected prepareIntersection(): void {
    this.prepareTransformation()
  }

  public executeIntersection(object: Object3D, objectPointerEventsOrder: number | undefined): void {
    if (!this.isReady()) {
      return
    }
    object.raycast(this.raycaster, intersectsHelper)

    //filtering out all intersections that are to near
    if (this.options.minDistance != null) {
      const length = intersectsHelper.length
      const localMinDistance = this.options.minDistance / this.worldScale
      for (let i = length - 1; i >= 0; i--) {
        if (intersectsHelper[i].distance < localMinDistance) {
          intersectsHelper.splice(i, 1)
        }
      }
    }
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

  public finalizeIntersection(scene: Object3D): Intersection {
    const pointerPosition = this.raycaster.ray.origin.clone()
    const pointerQuaternion = this.raycasterQuaternion.clone()
    if (this.intersection == null) {
      return voidObjectIntersectionFromRay(
        scene,
        this.raycaster.ray,
        () => ({ type: 'ray' }),
        pointerPosition,
        pointerQuaternion,
      )
    }
    return Object.assign(this.intersection, {
      details: {
        type: 'ray' as const,
      },
      pointerPosition,
      pointerQuaternion,
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

  public isReady(): boolean {
    return true
  }

  public intersectPointerCapture({ intersection, object }: PointerCapture, nativeEvent: unknown): Intersection {
    const details = intersection.details
    if (details.type != 'camera-ray') {
      throw new Error(
        `unable to process a pointer capture of type "${intersection.details.type}" with a camera ray intersector`,
      )
    }
    if (!this.prepareIntersection(nativeEvent)) {
      return intersection
    }
    this.viewPlane.constant -= details.distanceViewPlane

    //find captured intersection point by intersecting the ray to the plane of the camera
    const point = this.raycaster.ray.intersectPlane(this.viewPlane, new Vector3())

    if (point == null) {
      return intersection
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

  public finalizeIntersection(scene: Object3D): Intersection {
    const pointerPosition = this.fromPosition.clone()
    const pointerQuaternion = this.fromQuaternion.clone()
    if (this.intersection == null) {
      return voidObjectIntersectionFromRay(
        scene,
        this.raycaster.ray,
        (distance) => ({ type: 'camera-ray', distanceViewPlane: distance }),
        pointerPosition,
        pointerQuaternion,
      )
    }

    invertedMatrixHelper.copy(this.intersection.object.matrixWorld).invert()

    return Object.assign(this.intersection, {
      details: {
        type: 'camera-ray' as const,
        distanceViewPlane: this.viewPlane.distanceToPoint(this.intersection.point),
      },
      pointOnFace: this.intersection.point,
      pointerPosition,
      pointerQuaternion,
      localPoint: this.intersection.point.clone().applyMatrix4(invertedMatrixHelper),
    })
  }
}
