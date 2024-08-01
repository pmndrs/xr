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
import { Intersection, IntersectionOptions } from './index.js'
import { computeIntersectionWorldPlane, getDominantIntersectionIndex, traversePointerEventTargets } from './utils.js'
import type { PointerCapture } from '../pointer.js'

const raycaster = new Raycaster()
const invertedMatrixHelper = new Matrix4()
const intersectsHelper: Array<ThreeIntersection & { details: { distanceOnLine: number; lineIndex: number } }> = []

export function intersectLines(
  fromMatrixWorld: Matrix4,
  linePoints: Array<Vector3>,
  scene: Object3D,
  pointerId: number,
  pointerType: string,
  pointerState: unknown,
  pointerCapture: PointerCapture | undefined,
  options: IntersectionOptions | undefined,
): Intersection | undefined {
  if (pointerCapture != null) {
    return intersectLinesPointerCapture(fromMatrixWorld, linePoints, pointerCapture)
  }
  let intersection: (ThreeIntersection & { details: { distanceOnLine: number; lineIndex: number } }) | undefined
  let pointerEventsOrder: number | undefined

  traversePointerEventTargets(scene, pointerId, pointerType, pointerState, (object, objectPointerEventsOrder) => {
    let prevAccLineLength = 0
    const length = (intersection?.details.lineIndex ?? linePoints.length - 2) + 2
    for (let i = 1; i < length; i++) {
      const start = linePoints[i - 1]
      const end = linePoints[i]

      //transform from local object to world
      raycaster.ray.origin.copy(start).applyMatrix4(fromMatrixWorld)
      raycaster.ray.direction.copy(end).applyMatrix4(fromMatrixWorld)

      //compute length & normalized direction
      raycaster.ray.direction.sub(raycaster.ray.origin)
      const lineLength = raycaster.ray.direction.length()
      raycaster.ray.direction.divideScalar(lineLength)

      raycaster.far = lineLength
      object.raycast(raycaster, intersectsHelper)

      //we're adding the details and the prev acc line length so that the intersections are correctly sorted
      const length = intersectsHelper.length
      for (let intersectionIndex = 0; intersectionIndex < length; intersectionIndex++) {
        const int = intersectsHelper[intersectionIndex]
        const distanceOnLine = int.distance
        int.distance += prevAccLineLength
        Object.assign(int, {
          details: {
            lineIndex: i - 1,
            distanceOnLine,
          },
        })
      }
      const index = getDominantIntersectionIndex(
        intersection,
        pointerEventsOrder,
        intersectsHelper,
        objectPointerEventsOrder,
        options,
      )
      if (index != null) {
        intersection = intersectsHelper[index]
        pointerEventsOrder = objectPointerEventsOrder
      }
      intersectsHelper.length = 0
      prevAccLineLength += lineLength
    }
  })

  if (intersection == null) {
    return undefined
  }

  return Object.assign(intersection, {
    details: {
      ...intersection.details,
      type: 'lines' as const,
    },
    pointerPosition: new Vector3().setFromMatrixPosition(fromMatrixWorld),
    pointerQuaternion: new Quaternion().setFromRotationMatrix(fromMatrixWorld),
    pointOnFace: intersection.point,
    localPoint: intersection.point
      .clone()
      .applyMatrix4(invertedMatrixHelper.copy(intersection.object.matrixWorld).invert()),
  })
}

const lineHelper = new Line3()
const planeHelper = new Plane()

function intersectLinesPointerCapture(
  fromMatrixWorld: Matrix4,
  linePoints: Array<Vector3>,
  { intersection, object }: PointerCapture,
): Intersection | undefined {
  const details = intersection.details
  if (details.type != 'lines') {
    return undefined
  }
  lineHelper.set(linePoints[details.lineIndex], linePoints[details.lineIndex + 1]).applyMatrix4(fromMatrixWorld)

  const point = lineHelper.at(details.distanceOnLine / lineHelper.distance(), new Vector3())
  computeIntersectionWorldPlane(planeHelper, intersection, object)
  const pointOnFace = backwardsIntersectionLinesWithPlane(fromMatrixWorld, linePoints, planeHelper) ?? point

  return {
    ...intersection,
    pointOnFace,
    point,
    pointerPosition: new Vector3().setFromMatrixPosition(fromMatrixWorld),
    pointerQuaternion: new Quaternion().setFromRotationMatrix(fromMatrixWorld),
  }
}

const vectorHelper = new Vector3()
const rayHelper = new Ray()

function backwardsIntersectionLinesWithPlane(
  fromMatrixWorld: Matrix4,
  linePoints: Array<Vector3>,
  plane: Plane,
): Vector3 | undefined {
  for (let i = linePoints.length - 1; i > 0; i--) {
    const start = linePoints[i - 1]
    const end = linePoints[i]
    rayHelper.origin.copy(start).applyMatrix4(fromMatrixWorld)
    rayHelper.direction.copy(end).applyMatrix4(fromMatrixWorld).sub(raycaster.ray.origin).normalize()
    const point = rayHelper.intersectPlane(plane, vectorHelper)
    if (point != null) {
      return vectorHelper.clone()
    }
  }
  return undefined
}
