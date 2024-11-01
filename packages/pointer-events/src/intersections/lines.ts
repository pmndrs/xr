import {
  Line3,
  Matrix4,
  Plane,
  Quaternion,
  Ray,
  Raycaster,
  Vector3,
  Intersection as ThreeIntersection,
  Object3D,
} from 'three'
import {
  computeIntersectionWorldPlane,
  getDominantIntersectionIndex,
  pushTimes,
  voidObjectIntersectionFromRay,
} from './utils.js'
import type { PointerCapture } from '../pointer.js'
import { Intersector } from './intersector.js'
import { Intersection, IntersectionOptions } from '../index.js'
import { updateAndCheckWorldTransformation } from '../utils.js'

const invertedMatrixHelper = new Matrix4()
const lineHelper = new Line3()
const planeHelper = new Plane()
const rayHelper = new Ray()
const defaultLinePoints = [new Vector3(0, 0, 0), new Vector3(0, 0, 1)]

export class LinesIntersector implements Intersector {
  private raycasters: Array<Raycaster> = []
  private fromMatrixWorld = new Matrix4()

  private ready?: boolean

  private intersects: Array<ThreeIntersection> = []
  private readonly pointerEventsOrders: Array<number | undefined> = []
  private readonly raycasterIndices: Array<number> = []

  constructor(
    private readonly space: { current?: Object3D | null },
    private readonly options: IntersectionOptions & { linePoints?: Array<Vector3>; minDistance?: number },
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
    this.fromMatrixWorld.copy(spaceObject.matrixWorld)
    return true
  }

  public intersectPointerCapture({ intersection, object }: PointerCapture): Intersection {
    const details = intersection.details
    if (details.type != 'lines') {
      throw new Error(
        `unable to process a pointer capture of type "${intersection.details.type}" with a lines intersector`,
      )
    }
    if (!this.prepareTransformation()) {
      return intersection
    }
    const linePoints = this.options.linePoints ?? defaultLinePoints
    lineHelper.set(linePoints[details.lineIndex], linePoints[details.lineIndex + 1]).applyMatrix4(this.fromMatrixWorld)

    const point = lineHelper.at(details.distanceOnLine / lineHelper.distance(), new Vector3())
    computeIntersectionWorldPlane(planeHelper, intersection, object)
    const pointOnFace = rayHelper.intersectPlane(planeHelper, new Vector3()) ?? point
    return {
      ...intersection,
      pointOnFace,
      point,
      pointerPosition: new Vector3().setFromMatrixPosition(this.fromMatrixWorld),
      pointerQuaternion: new Quaternion().setFromRotationMatrix(this.fromMatrixWorld),
    }
  }

  startIntersection(): void {
    if (!this.prepareTransformation()) {
      return
    }
    const linePoints = this.options.linePoints ?? defaultLinePoints
    const length = linePoints.length - 1
    for (let i = 0; i < length; i++) {
      const start = linePoints[i]
      const end = linePoints[i + 1]
      const raycaster = this.raycasters[i] ?? (this.raycasters[i] = new Raycaster())

      //transform from local object to world
      raycaster.ray.origin.copy(start).applyMatrix4(this.fromMatrixWorld)
      raycaster.ray.direction.copy(end).applyMatrix4(this.fromMatrixWorld)

      //compute length & normalized direction
      raycaster.ray.direction.sub(raycaster.ray.origin)
      const lineLength = raycaster.ray.direction.length()
      raycaster.ray.direction.divideScalar(lineLength)
      raycaster.far = lineLength
    }
    this.raycasters.length = length
    return
  }

  public executeIntersection(object: Object3D, objectPointerEventsOrder: number | undefined): void {
    if (!this.isReady()) {
      return
    }
    const startOuter = this.intersects.length
    const length = this.raycasters.length
    for (let i = 0; i < length; i++) {
      const raycaster = this.raycasters[i]
      const startInner = this.intersects.length
      object.raycast(raycaster, this.intersects)
      pushTimes(this.raycasterIndices, i, this.intersects.length - startInner)
    }
    pushTimes(this.pointerEventsOrders, objectPointerEventsOrder, this.intersects.length - startOuter)
  }

  public finalizeIntersection(scene: Object3D): Intersection {
    const pointerPosition = new Vector3().setFromMatrixPosition(this.fromMatrixWorld)
    const pointerQuaternion = new Quaternion().setFromRotationMatrix(this.fromMatrixWorld)

    const index = getDominantIntersectionIndex(this.intersects, this.pointerEventsOrders, this.options)
    const intersection = index == null ? undefined : this.intersects[index]
    const raycasterIndex = index == null ? undefined : this.raycasterIndices[index]
    this.intersects.length = 0
    this.raycasterIndices.length = 0
    this.pointerEventsOrders.length = 0

    if (intersection == null || raycasterIndex == null) {
      const lastRaycasterIndex = this.raycasters.length - 1
      const prevDistance = this.raycasters.reduce(
        (prev, caster, i) => (i === lastRaycasterIndex ? prev : prev + caster.far),
        0,
      )
      const lastRaycaster = this.raycasters[lastRaycasterIndex]
      return voidObjectIntersectionFromRay(
        scene,
        lastRaycaster.ray,
        (distanceOnLine) => ({
          lineIndex: this.raycasters.length - 1,
          distanceOnLine,
          type: 'lines' as const,
        }),
        pointerPosition,
        pointerQuaternion,
        prevDistance,
      )
    }

    let distance = intersection.distance
    for (let i = 0; i < raycasterIndex; i++) {
      distance += this.raycasters[i].far
    }

    //TODO: consider maxLength
    return Object.assign(intersection, {
      details: {
        lineIndex: raycasterIndex,
        distanceOnLine: intersection.distance,
        type: 'lines' as const,
      },
      distance,
      pointerPosition,
      pointerQuaternion,
      pointOnFace: intersection.point,
      localPoint: intersection.point
        .clone()
        .applyMatrix4(invertedMatrixHelper.copy(intersection.object.matrixWorld).invert()),
    })
  }
}
