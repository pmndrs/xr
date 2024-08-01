import { Plane, Intersection as ThreeIntersection, Object3D } from 'three'
import { Intersection, IntersectionOptions } from './index.js'
import { AllowedPointerEventsType, type AllowedPointerEvents } from '../pointer.js'
import { hasObjectListeners } from '../utils.js'

export function computeIntersectionWorldPlane(target: Plane, intersection: Intersection, object: Object3D): boolean {
  if (intersection.face == null) {
    return false
  }
  target.setFromNormalAndCoplanarPoint(intersection.face.normal, intersection.localPoint)
  target.applyMatrix4(object.matrixWorld)
  return true
}

function isPointerEventsAllowed(
  hasListener: boolean,
  pointerEvents: AllowedPointerEvents,
  pointerEventsType: AllowedPointerEventsType,
  pointerId: number,
  pointerType: string,
  pointerState: unknown,
): boolean {
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
    return pointerEventsType(pointerId, pointerType, pointerState)
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
  let result: boolean
  if (Array.isArray(value)) {
    result = value.includes(pointerType)
  } else {
    result = value === pointerType
  }

  return invert ? !result : result
}

export function traversePointerEventTargets(
  object: Object3D,
  pointerId: number,
  pointerType: string,
  pointerState: unknown,
  callback: (object: Object3D, pointerEventsOrder: number | undefined) => void,
  parentHasListener: boolean = false,
  parentPointerEvents?: AllowedPointerEvents,
  parentPointerEventsType?: AllowedPointerEventsType,
  parentPointerEventsOrder?: number,
): void {
  const hasListener = parentHasListener || hasObjectListeners(object)
  const pointerEvents = object.pointerEvents ?? parentPointerEvents
  const pointerEventsType = object.pointerEventsType ?? parentPointerEventsType
  const pointerEventsOrder = object.pointerEventsOrder ?? parentPointerEventsOrder

  const isAllowed = isPointerEventsAllowed(
    hasListener,
    pointerEvents ?? 'listener',
    pointerEventsType ?? 'all',
    pointerId,
    pointerType,
    pointerState,
  )

  if (isAllowed) {
    callback(object, pointerEventsOrder)
  }

  const length = object.children.length
  for (let i = 0; i < length; i++) {
    traversePointerEventTargets(
      object.children[i],
      pointerId,
      pointerType,
      pointerState,
      callback,
      hasListener,
      pointerEvents,
      pointerEventsType,
      pointerEventsOrder,
    )
  }
}

/**
 * @returns undefined if `i1` is the dominant intersection
 */
export function getDominantIntersectionIndex<T extends ThreeIntersection>(
  i1: T | undefined,
  pointerEventsOrder1: number | undefined,
  i2: Array<T>,
  pointerEventsOrder2: number | undefined,
  { customFilter, customSort: compare = defaultSort }: IntersectionOptions = {},
): number | undefined {
  let index = undefined
  const length = i2.length
  for (let i = 0; i < length; i++) {
    const intersection = i2[i]
    if (!(customFilter?.(intersection) ?? true)) {
      continue
    }
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
