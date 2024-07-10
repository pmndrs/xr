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
  callback: (object: Object3D) => void,
  parentHasListener: boolean = false,
  parentPointerEvents?: AllowedPointerEvents,
  parentPointerEventsType?: AllowedPointerEventsType,
): void {
  const hasListener = parentHasListener || hasObjectListeners(object)
  const allowedPointerEvents = object.pointerEvents ?? parentPointerEvents ?? 'listener'
  const allowedPointerEventsType = object.pointerEventsType ?? parentPointerEventsType ?? 'all'

  const isAllowed = isPointerEventsAllowed(
    hasListener,
    allowedPointerEvents,
    allowedPointerEventsType,
    pointerId,
    pointerType,
    pointerState,
  )

  if (isAllowed) {
    callback(object)
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
      allowedPointerEvents,
      allowedPointerEventsType,
    )
  }
}

export function getDominantIntersection<T extends ThreeIntersection>(
  target: T | undefined,
  current: Array<T>,
  { customFilter, customSort: compare = defaultSort }: IntersectionOptions = {},
): T | undefined {
  const length = current.length
  for (let i = 0; i < length; i++) {
    const intersection = current[i]
    if (!(customFilter?.(intersection) ?? true)) {
      continue
    }
    if (target == null || compare(target, intersection) > 0) {
      target = intersection
    }
  }
  return target
}

/**
 * @returns a negative number if i1 should be sorted before i2
 */
function defaultSort(i1: ThreeIntersection, i2: ThreeIntersection): number {
  const { pointerEventsOrder: o1 = 0 } = i1.object
  const { pointerEventsOrder: o2 = 0 } = i2.object
  if (o1 != o2) {
    //inverted order because order is sorted highest first
    return o2 - o1
  }
  //i1 - i2 because negative values mean the sorting i1 before i2 is correct
  return i1.distance - i2.distance
}
