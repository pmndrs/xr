import { Plane, Intersection as ThreeIntersection, Object3D, Vector3, Ray, Quaternion } from 'three'
import { Intersection, IntersectionOptions } from './index.js'
import { AllowedPointerEventsType, Pointer, type AllowedPointerEvents } from '../pointer.js'
import { hasObjectListeners } from '../utils.js'
import { getVoidObject, VoidObjectCollider } from './intersector.js'

export function computeIntersectionWorldPlane(target: Plane, intersection: Intersection, object: Object3D): boolean {
  const normal = intersection.normal ?? intersection.face?.normal
  if (normal == null) {
    return false
  }
  target.setFromNormalAndCoplanarPoint(normal, intersection.localPoint)
  target.applyMatrix4(object.matrixWorld)
  return true
}

function isPointerEventsAllowed(
  hasListener: boolean,
  pointerEvents: AllowedPointerEvents,
  pointerEventsType: AllowedPointerEventsType,
): boolean | ((pointer: Pointer) => boolean) {
  if (pointerEvents === 'none') {
    return false
  }
  if (pointerEvents === 'listener' && !hasListener) {
    return false
  }
  if (pointerEventsType === 'all') {
    return true
  }
  if (typeof pointerEventsType === 'function') {
    return ({ id, type, state }) => pointerEventsType(id, type, state)
  }
  let value: Array<string> | string
  let invert: boolean
  if ('deny' in pointerEventsType) {
    invert = true
    value = pointerEventsType.deny
  } else {
    invert = false
    value = pointerEventsType.allow
  }
  if (Array.isArray(value)) {
    return (pointer) => invertIf(value.includes(pointer.type), invert)
  }
  return (pointer) => invertIf(value === pointer.type, invert)
}

function invertIf(toInvert: boolean, ifIsTrue: boolean): boolean {
  return ifIsTrue ? !toInvert : toInvert
}

export function intersectPointerEventTargets(
  object: Object3D,
  pointers: Array<Pointer>,
  parentHasListener: boolean = false,
  parentPointerEvents?: AllowedPointerEvents,
  parentPointerEventsType?: AllowedPointerEventsType,
  parentPointerEventsOrder?: number,
): void {
  const hasListener = parentHasListener || hasObjectListeners(object)
  const pointerEvents = object.pointerEvents ?? parentPointerEvents ?? 'listener'
  const pointerEventsType = object.pointerEventsType ?? parentPointerEventsType ?? 'all'
  const pointerEventsOrder = object.pointerEventsOrder ?? parentPointerEventsOrder ?? 0

  const isAllowed = isPointerEventsAllowed(hasListener, pointerEvents, pointerEventsType)
  const length = pointers.length
  if (isAllowed === true) {
    for (let i = 0; i < length; i++) {
      filterAndInteresct(pointers[i], object, pointerEvents, pointerEventsType, pointerEventsOrder)
    }
  } else if (typeof isAllowed === 'function') {
    for (let i = 0; i < length; i++) {
      const pointer = pointers[i]
      if (!isAllowed(pointer)) {
        continue
      }
      filterAndInteresct(pointer, object, pointerEvents, pointerEventsType, pointerEventsOrder)
    }
  }

  const childrenLength = object.children.length
  for (let i = 0; i < childrenLength; i++) {
    intersectPointerEventTargets(
      object.children[i],
      pointers,
      hasListener,
      pointerEvents,
      pointerEventsType,
      pointerEventsOrder,
    )
  }
}

function filterAndInteresct(
  { intersector, options }: Pointer,
  object: Object3D,
  pointerEvents: AllowedPointerEvents,
  pointerEventsType: AllowedPointerEventsType,
  pointerEventsOrder: number,
) {
  if (options.filter != null && !options.filter(object, pointerEvents, pointerEventsType, pointerEventsOrder)) {
    return
  }
  intersector.executeIntersection(object, pointerEventsOrder)
}

/**
 * @returns undefined if `i1` is the dominant intersection
 * @param i2DistanceOffset modifies i2 and adds the i2DistanceOffset to the current distance
 */
export function getDominantIntersectionIndex<T extends ThreeIntersection>(
  i1: T | undefined,
  pointerEventsOrder1: number | undefined,
  i2: Array<T>,
  pointerEventsOrder2: number | undefined,
  { customSort: compare = defaultSort }: IntersectionOptions = {},
): number | undefined {
  let index = undefined
  const length = i2.length
  for (let i = 0; i < length; i++) {
    const intersection = i2[i]
    if (i1 == null || compare(i1, pointerEventsOrder1, intersection, pointerEventsOrder2) > 0) {
      i1 = intersection
      index = i
    }
  }
  return index
}

/**
 * @returns a negative number if i1 should be sorted before i2
 */
function defaultSort(
  i1: ThreeIntersection,
  pointerEventsOrder1: number = 0,
  i2: ThreeIntersection,
  pointerEventsOrder2: number = 0,
): number {
  if (pointerEventsOrder1 != pointerEventsOrder2) {
    //inverted order because order is sorted highest first
    return pointerEventsOrder2 - pointerEventsOrder1
  }
  //i1 - i2 because negative values mean the sorting i1 before i2 is correct
  return i1.distance - i2.distance
}

export function voidObjectIntersectionFromRay(
  scene: Object3D,
  ray: Ray,
  getDetails: (pointer: Vector3, distanceOnRay: number) => Intersection['details'],
  pointerPosition: Vector3,
  pointerQuaternion: Quaternion,
  addToDistance: number = 0,
): Intersection {
  const point = ray.intersectSphere(VoidObjectCollider, new Vector3())!
  const distanceOnRay = point.distanceTo(ray.origin)
  return {
    distance: distanceOnRay + addToDistance,
    object: getVoidObject(scene),
    point,
    normal: ray.origin.clone().sub(point).normalize(),
    details: getDetails(point, distanceOnRay),
    pointerPosition,
    pointerQuaternion,
    pointOnFace: point,
    localPoint: point,
  }
}
