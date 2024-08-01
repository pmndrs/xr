import {
  Camera,
  Matrix4,
  Plane,
  Quaternion,
  Ray,
  Raycaster,
  Vector2,
  Vector3,
  Intersection as ThreeIntersection,
  Object3D,
} from 'three'
import { Intersection, IntersectionOptions } from './index.js'
import type { PointerCapture } from '../pointer.js'
import { computeIntersectionWorldPlane, getDominantIntersectionIndex, traversePointerEventTargets } from './utils.js'

const raycaster = new Raycaster()
const directionHelper = new Vector3()
const planeHelper = new Plane()
const invertedMatrixHelper = new Matrix4()
const intersectsHelper: Array<ThreeIntersection> = []

export function intersectRay(
  fromPosition: Vector3,
  fromQuaternion: Quaternion,
  direction: Vector3,
  scene: Object3D,
  pointerId: number,
  pointerType: string,
  pointerState: unknown,
  pointerCapture: PointerCapture | undefined,
  options: IntersectionOptions | undefined,
): Intersection | undefined {
  if (pointerCapture != null) {
    return intersectRayPointerCapture(fromPosition, fromQuaternion, direction, pointerCapture)
  }
  let intersection: (ThreeIntersection & { pointerEventsOrder?: number }) | undefined
  let pointerEventsOrder: number | undefined
  raycaster.ray.origin.copy(fromPosition)
  raycaster.ray.direction.copy(direction).applyQuaternion(fromQuaternion)
  traversePointerEventTargets(scene, pointerId, pointerType, pointerState, (object, objectPointerEventsOrder) => {
    object.raycast(raycaster, intersectsHelper)
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
  })
  if (intersection == null) {
    return undefined
  }
  return Object.assign(intersection, {
    details: {
      type: 'ray' as const,
    },
    pointerPosition: fromPosition.clone(),
    pointerQuaternion: fromQuaternion.clone(),
    pointOnFace: intersection.point,
    localPoint: intersection.point
      .clone()
      .applyMatrix4(invertedMatrixHelper.copy(intersection.object.matrixWorld).invert()),
  })
}

const rayHelper = new Ray()

function intersectRayPointerCapture(
  fromPosition: Vector3,
  fromQuaternion: Quaternion,
  direction: Vector3,
  { intersection, object }: PointerCapture,
): Intersection | undefined {
  if (intersection.details.type != 'ray') {
    return undefined
  }
  directionHelper.copy(direction).applyQuaternion(fromQuaternion)
  rayHelper.set(fromPosition, directionHelper)
  computeIntersectionWorldPlane(planeHelper, intersection, object)
  const pointOnFace = rayHelper.intersectPlane(planeHelper, new Vector3()) ?? intersection.point
  return {
    ...intersection,
    object,
    pointOnFace,
    point: directionHelper.clone().multiplyScalar(intersection.distance).add(fromPosition),
    pointerPosition: fromPosition.clone(),
    pointerQuaternion: fromQuaternion.clone(),
  }
}

export function intersectRayFromCamera(
  from: Camera,
  coords: Vector2,
  fromPosition: Vector3,
  fromQuaternion: Quaternion,
  scene: Object3D,
  pointerId: number,
  pointerType: string,
  pointerState: unknown,
  pointerCapture: PointerCapture | undefined,
  options: IntersectionOptions | undefined,
): Intersection | undefined {
  if (pointerCapture != null) {
    return intersectRayFromCameraPointerCapture(from, coords, fromPosition, fromQuaternion, pointerCapture)
  }
  let intersection: ThreeIntersection | undefined
  let pointerEventsOrder: number | undefined

  raycaster.setFromCamera(coords, from)

  planeHelper.setFromNormalAndCoplanarPoint(from.getWorldDirection(directionHelper), raycaster.ray.origin)

  traversePointerEventTargets(scene, pointerId, pointerType, pointerState, (object, objectPointerEventsOrder) => {
    object.raycast(raycaster, intersectsHelper)
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
  })

  if (intersection == null) {
    return undefined
  }

  invertedMatrixHelper.copy(intersection.object.matrixWorld).invert()

  return Object.assign(intersection, {
    details: {
      type: 'camera-ray' as const,
      distanceViewPlane: planeHelper.distanceToPoint(intersection.point),
    },
    pointOnFace: intersection.point,
    pointerPosition: fromPosition.clone(),
    pointerQuaternion: fromQuaternion.clone(),
    localPoint: intersection.point.clone().applyMatrix4(invertedMatrixHelper),
  })
}

function intersectRayFromCameraPointerCapture(
  from: Camera,
  coords: Vector2,
  fromPosition: Vector3,
  fromQuaternion: Quaternion,
  { intersection, object }: PointerCapture,
): Intersection | undefined {
  const details = intersection.details
  if (details.type != 'camera-ray') {
    return undefined
  }
  raycaster.setFromCamera(coords, from)

  from.getWorldDirection(directionHelper)
  //set the plane to the viewPlane + the distance of the prev intersection in the camera distance
  planeHelper.setFromNormalAndCoplanarPoint(directionHelper, raycaster.ray.origin)
  planeHelper.constant -= details.distanceViewPlane

  //find captured intersection point by intersecting the ray to the plane of the camera
  const point = raycaster.ray.intersectPlane(planeHelper, new Vector3())

  if (point == null) {
    return undefined
  }

  computeIntersectionWorldPlane(planeHelper, intersection, object)
  const pointOnFace = raycaster.ray.intersectPlane(planeHelper, new Vector3()) ?? point
  return {
    ...intersection,
    object,
    point,
    pointOnFace,
    pointerPosition: fromPosition.clone(),
    pointerQuaternion: fromQuaternion.clone(),
  }
}
