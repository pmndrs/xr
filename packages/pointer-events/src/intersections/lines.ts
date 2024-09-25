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
import { computeIntersectionWorldPlane, getDominantIntersectionIndex } from './utils.js'
import type { PointerCapture } from '../pointer.js'
import { Intersector } from './intersector.js'
import { Intersection, IntersectionOptions } from '../index.js'
import { updateAndCheckWorldTransformation } from '../utils.js'

const invertedMatrixHelper = new Matrix4()
const intersectsHelper: Array<ThreeIntersection & { details: { distanceOnLine: number; lineIndex: number } }> = []
const lineHelper = new Line3()
const planeHelper = new Plane()
const rayHelper = new Ray()
const defaultLinePoints = [new Vector3(0, 0, 0), new Vector3(0, 0, 1)]

export class LinesIntersector extends Intersector {
  private raycasters: Array<Raycaster> = []
  private fromMatrixWorld = new Matrix4()
  private intersectionLineIndex: number = 0
  private intersectionDistanceOnLine: number = 0

  private ready?: boolean

  constructor(
    private readonly space: { current?: Object3D | null },
    private readonly options: IntersectionOptions & { linePoints?: Array<Vector3>; minDistance?: number },
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
    this.fromMatrixWorld.copy(spaceObject.matrixWorld)
    return true
  }

  public intersectPointerCapture({ intersection, object }: PointerCapture): Intersection | undefined {
    const details = intersection.details
    if (details.type != 'lines') {
      return undefined
    }
    if (!this.prepareTransformation()) {
      return undefined
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

  protected prepareIntersection(): void {
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
    let lineLengthSum = 0
    const length = this.raycasters.length
    //TODO: optimize - we only need to intersect with raycasters before or equal to the raycaster that did the current intersection
    for (let i = 0; i < length; i++) {
      const raycaster = this.raycasters[i]
      object.raycast(raycaster, intersectsHelper)
      for (const intersection of intersectsHelper) {
        intersection.distance += lineLengthSum
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
        this.intersectionLineIndex = i
        this.intersectionDistanceOnLine = this.intersection.distance - raycaster.far
        this.pointerEventsOrder = objectPointerEventsOrder
      }
      intersectsHelper.length = 0
      lineLengthSum += raycaster.far
    }
  }

  public finalizeIntersection(): Intersection | undefined {
    if (this.intersection == null) {
      return undefined
    }
    //TODO: consider maxLength
    return Object.assign(this.intersection, {
      details: {
        lineIndex: this.intersectionLineIndex,
        distanceOnLine: this.intersectionDistanceOnLine,
        type: 'lines' as const,
      },
      pointerPosition: new Vector3().setFromMatrixPosition(this.fromMatrixWorld),
      pointerQuaternion: new Quaternion().setFromRotationMatrix(this.fromMatrixWorld),
      pointOnFace: this.intersection.point,
      localPoint: this.intersection.point
        .clone()
        .applyMatrix4(invertedMatrixHelper.copy(this.intersection.object.matrixWorld).invert()),
    })
  }
}
