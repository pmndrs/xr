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
  Mesh,
} from 'three'
import { Intersection, IntersectionOptions } from './index.js'
import { type PointerCapture } from '../pointer.js'
import {
  computeIntersectionWorldPlane,
  getDominantIntersectionIndex,
  pushTimes,
  voidObjectIntersectionFromRay,
} from './utils.js'
import { Intersector } from './intersector.js'
import { getClosestUV, updateAndCheckWorldTransformation } from '../utils.js'

const invertedMatrixHelper = new Matrix4()
const scaleHelper = new Vector3()
const NegZAxis = new Vector3(0, 0, -1)
const planeHelper = new Plane()
const point2Helper = new Vector2()

export class RayIntersector implements Intersector {
  private readonly raycaster = new Raycaster()
  private readonly raycasterQuaternion = new Quaternion()
  private worldScale: number = 0

  private ready?: boolean

  private readonly intersects: Array<ThreeIntersection> = []
  private readonly pointerEventsOrders: Array<number | undefined> = []

  constructor(
    private readonly space: { current?: Object3D | null },
    private readonly options: IntersectionOptions & { minDistance?: number; direction?: Vector3 },
  ) {}

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
    intersection.object.updateWorldMatrix(true, false)
    computeIntersectionWorldPlane(planeHelper, intersection, intersection.object.matrixWorld)
    const { ray } = this.raycaster
    const pointOnFace = ray.intersectPlane(planeHelper, new Vector3()) ?? intersection.point
    const point = ray.direction.clone().multiplyScalar(intersection.distance).add(ray.origin)
    let uv = intersection.uv
    if (intersection.object instanceof Mesh && getClosestUV(point2Helper, point, intersection.object)) {
      uv = point2Helper.clone()
    }
    return {
      ...intersection,
      uv,
      object,
      pointOnFace,
      point,
      pointerPosition: ray.origin.clone(),
      pointerQuaternion: this.raycasterQuaternion.clone(),
    }
  }

  startIntersection(): void {
    this.prepareTransformation()
  }

  public executeIntersection(object: Object3D, objectPointerEventsOrder: number | undefined): void {
    if (!this.isReady()) {
      return
    }
    const start = this.intersects.length
    object.raycast(this.raycaster, this.intersects)
    pushTimes(this.pointerEventsOrders, objectPointerEventsOrder, this.intersects.length - start)
  }

  public finalizeIntersection(scene: Object3D): Intersection {
    const pointerPosition = this.raycaster.ray.origin.clone()
    const pointerQuaternion = this.raycasterQuaternion.clone()

    let filter: ((intersection: ThreeIntersection) => boolean) | undefined
    if (this.options.minDistance != null) {
      const localMinDistance = this.options.minDistance / this.worldScale
      filter = (intersection) => intersection.distance >= localMinDistance
    }

    const index = getDominantIntersectionIndex(this.intersects, this.pointerEventsOrders, this.options, filter)
    const intersection = index == null ? undefined : this.intersects[index]
    this.intersects.length = 0
    this.pointerEventsOrders.length = 0

    if (intersection == null) {
      return voidObjectIntersectionFromRay(
        scene,
        this.raycaster.ray,
        () => ({ type: 'ray' }),
        pointerPosition,
        pointerQuaternion,
      )
    }
    intersection.object.updateWorldMatrix(true, false)
    return Object.assign(intersection, {
      details: {
        type: 'ray' as const,
      },
      pointerPosition,
      pointerQuaternion,
      pointOnFace: intersection.point,
      normal: intersection.face?.normal,
      localPoint: intersection.point
        .clone()
        .applyMatrix4(invertedMatrixHelper.copy(intersection.object.matrixWorld).invert()),
    })
  }
}

const directionHelper = new Vector3()

export class ScreenRayIntersector implements Intersector {
  private readonly raycaster = new Raycaster()
  private readonly cameraQuaternion = new Quaternion()
  private readonly fromPosition = new Vector3()
  private readonly fromQuaternion = new Quaternion()
  private readonly coords = new Vector2()
  private readonly viewPlane = new Plane()

  private readonly intersects: Array<ThreeIntersection> = []
  private readonly pointerEventsOrders: Array<number | undefined> = []

  constructor(
    private readonly prepareTransformation: (nativeEvent: unknown, coords: Vector2) => Camera | undefined,
    private readonly options: IntersectionOptions,
  ) {}

  public isReady(): boolean {
    return true
  }

  public intersectPointerCapture({ intersection, object }: PointerCapture, nativeEvent: unknown): Intersection {
    const details = intersection.details
    if (details.type != 'screen-ray') {
      throw new Error(
        `unable to process a pointer capture of type "${intersection.details.type}" with a camera ray intersector`,
      )
    }
    if (!this.startIntersection(nativeEvent)) {
      return intersection
    }

    this.viewPlane.constant -= details.distanceViewPlane

    //find captured intersection point by intersecting the ray to the plane of the camera
    const point = this.raycaster.ray.intersectPlane(this.viewPlane, new Vector3())

    if (point == null) {
      return intersection
    }

    intersection.object.updateWorldMatrix(true, false)
    computeIntersectionWorldPlane(this.viewPlane, intersection, intersection.object.matrixWorld)
    let uv = intersection.uv
    if (intersection.object instanceof Mesh && getClosestUV(point2Helper, point, intersection.object)) {
      uv = point2Helper.clone()
    }
    return {
      ...intersection,
      details: {
        ...details,
        direction: this.raycaster.ray.direction.clone(),
        screenPoint: this.coords.clone(),
      },
      uv,
      object,
      point,
      pointOnFace: point,
      pointerPosition: this.raycaster.ray.origin.clone(),
      pointerQuaternion: this.cameraQuaternion.clone(),
    }
  }

  startIntersection(nativeEvent: unknown): boolean {
    const from = this.prepareTransformation(nativeEvent, this.coords)
    if (from == null) {
      return false
    }
    from.updateWorldMatrix(true, false)
    from.matrixWorld.decompose(this.fromPosition, this.fromQuaternion, scaleHelper)
    this.raycaster.setFromCamera(this.coords, from)
    this.viewPlane.setFromNormalAndCoplanarPoint(from.getWorldDirection(directionHelper), this.raycaster.ray.origin)
    return true
  }

  public executeIntersection(object: Object3D, objectPointerEventsOrder: number | undefined): void {
    const start = this.intersects.length
    object.raycast(this.raycaster, this.intersects)
    pushTimes(this.pointerEventsOrders, objectPointerEventsOrder, this.intersects.length - start)
  }

  public finalizeIntersection(scene: Object3D): Intersection {
    const pointerPosition = this.fromPosition.clone()
    const pointerQuaternion = this.cameraQuaternion.clone()
    const pointerDirection = this.raycaster.ray.direction.clone()

    const index = getDominantIntersectionIndex(this.intersects, this.pointerEventsOrders, this.options)
    const intersection = index == null ? undefined : this.intersects[index]
    this.intersects.length = 0
    this.pointerEventsOrders.length = 0

    if (intersection == null) {
      return voidObjectIntersectionFromRay(
        scene,
        this.raycaster.ray,
        (_point, distance) => ({
          type: 'screen-ray',
          distanceViewPlane: distance,
          screenPoint: this.coords.clone(),
          direction: pointerDirection,
        }),
        pointerPosition,
        pointerQuaternion,
      )
    }

    intersection.object.updateWorldMatrix(true, false)
    invertedMatrixHelper.copy(intersection.object.matrixWorld).invert()

    return Object.assign(intersection, {
      details: {
        type: 'screen-ray' as const,
        distanceViewPlane: this.viewPlane.distanceToPoint(intersection.point),
        screenPoint: this.coords.clone(),
        direction: pointerDirection,
      },
      pointOnFace: intersection.point,
      pointerPosition,
      pointerQuaternion,
      localPoint: intersection.point.clone().applyMatrix4(invertedMatrixHelper),
    })
  }
}
