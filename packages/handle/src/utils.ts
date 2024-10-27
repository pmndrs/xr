import { Plane, Vector3 } from 'three'
import { PointerEvent } from '@pmndrs/pointer-events'
import { Axis } from './state.js'
import { HandleOptions, HandleTransformOptions } from './store.js'

export function getWorldDirection(event: PointerEvent, target: Vector3): boolean {
  if (event.details.type === 'sphere') {
    return false
  }
  if (event.details.type === 'lines') {
    const { line } = event.details
    target.copy(line.end).sub(line.start).normalize()
    return true
  }
  if (event.details.type === 'camera-ray') {
    target.copy(event.details.direction)
    return true
  }
  target.set(0, 0, -1).applyQuaternion(event.pointerQuaternion)
  return true
}

export function projectOntoSpace(
  space: Set<Axis>,
  initialWorldPoint: Vector3,
  worldPoint: Vector3,
  worldDirection: Vector3 | undefined,
): void {
  switch (space.size) {
    case 0:
    case 3:
      return
    case 1:
      projectOntoAxis(initialWorldPoint, worldPoint, worldDirection, ...(space as unknown as [Axis]))
  }
  if (!space.has('x')) {
    projectOntoPlane(initialWorldPoint, worldPoint, worldDirection, 'x')
    return
  }
  if (!space.has('y')) {
    projectOntoPlane(initialWorldPoint, worldPoint, worldDirection, 'y')
    return
  }
  projectOntoPlane(initialWorldPoint, worldPoint, worldDirection, 'z')
}

export function getSpaceFromOptions(target: Set<Axis>, options: HandleOptions<unknown>, pointerAmount: number) {
  if (
    options.translate === 'as-rotate' ||
    options.translate === 'as-scale' ||
    options.translate === 'as-rotate-and-scale'
  ) {
    if (options.translate != 'as-rotate') {
      getSpaceFromTransformOptions(target, options.scale ?? true, false)
    }
    if (options.translate != 'as-scale') {
      getSpaceFromTransformOptions(target, options.rotate ?? true, true)
    }
  } else if (pointerAmount === 1) {
    getSpaceFromTransformOptions(target, options.translate ?? true, false)
  } else {
    getSpaceFromTransformOptions(target, options.translate ?? true, false)
    getSpaceFromTransformOptions(target, options.rotate ?? true, true)
    getSpaceFromTransformOptions(target, options.scale ?? true, false)
  }
}

const otherAxes = {
  x: ['y', 'z'],
  y: ['x', 'z'],
  z: ['x', 'y'],
} as const

function getSpaceFromTransformOptions(target: Set<Axis>, options: HandleTransformOptions, rotate: boolean): void {
  if (options === false) {
    return
  }
  if (options === true) {
    target.add('x')
    target.add('y')
    target.add('z')
    return
  }
  if (typeof options === 'string') {
    getSpaceFromAxis(target, options, rotate)
    return
  }
  if ((options.x ?? true) === true) {
    getSpaceFromAxis(target, 'x', rotate)
  }
  if ((options.y ?? true) === true) {
    getSpaceFromAxis(target, 'y', rotate)
  }
  if ((options.z ?? true) === true) {
    getSpaceFromAxis(target, 'z', rotate)
  }
}

function getSpaceFromAxis(target: Set<Axis>, axis: Axis, rotate: boolean): void {
  if (rotate) {
    const [axis1, axis2] = otherAxes[axis]
    target.add(axis1)
    target.add(axis2)
  } else {
    target.add(axis)
  }
}

const planes = {
  x: new Plane(new Vector3(1, 0, 0), 0),
  y: new Plane(new Vector3(0, 1, 0), 0),
  z: new Plane(new Vector3(0, 0, 1), 0),
}

function projectOntoPlane(
  initialWorldPoint: Vector3,
  worldPoint: Vector3,
  worldDirection: Vector3 | undefined,
  notAxis: Axis,
): void {
  const plane = planes[notAxis]
  if (worldDirection == null || Math.abs(plane.normal.dot(worldDirection)) < 0.001) {
    worldPoint[notAxis] = 0
    return
  }
  plane.constant = -initialWorldPoint[notAxis]
  const distanceToPlane = plane.distanceToPoint(worldPoint)
  let distanceAlongDirection = distanceToPlane / worldDirection.dot(plane.normal)
  worldPoint.addScaledVector(worldDirection, -distanceAlongDirection)
  worldPoint[notAxis] = initialWorldPoint[notAxis]
}

const normals = {
  x: new Vector3(1, 0, 0),
  y: new Vector3(0, 1, 0),
  z: new Vector3(0, 0, 1),
}

const anotherAxisMap = {
  x: 'y',
  y: 'z',
  z: 'x',
} as const

const projectHelper = new Vector3()
const crossVectorHelper = new Vector3()
const vectorHelper = new Vector3()
/**
 * finds the intersection between the given axis (infinite line) and another infinite line provided with point and direction
 */
function projectOntoAxis(
  initialWorldPoint: Vector3,
  worldPoint: Vector3,
  worldDirection: Vector3 | undefined,
  axis: Axis,
): void {
  const n1 = normals[axis]
  if (worldDirection == null || Math.abs(n1.dot(worldDirection)) > 0.999) {
    const tmp = worldPoint[axis]
    worldPoint.copy(initialWorldPoint)
    worldPoint[axis] = tmp
    return
  }
  vectorHelper.copy(initialWorldPoint)
  vectorHelper[axis] = 0
  projectPointOntoNormal(
    projectHelper.copy(worldPoint).sub(vectorHelper),
    crossVectorHelper.crossVectors(n1, worldDirection).normalize(),
  )
  worldPoint.sub(projectHelper)
  //projectHelper with the normal n2 now represents a line that crosses the axis at the desired point

  const anotherAxis = anotherAxisMap[axis]
  const distance = (initialWorldPoint[anotherAxis] - worldPoint[anotherAxis]) / worldDirection[anotherAxis]
  worldPoint.addScaledVector(worldDirection, distance)
  const tmp = worldPoint[axis]
  worldPoint.copy(initialWorldPoint)
  worldPoint[axis] = tmp
}

function projectPointOntoNormal(point: Vector3, normal: Vector3) {
  const dot = point.dot(normal)
  point.copy(normal).multiplyScalar(dot)
}
