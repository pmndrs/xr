import { Euler, Matrix4, Plane, Quaternion, Ray, Vector3 } from 'three'
import { HandleOptions, HandleTransformOptions } from './store.js'
import { Axis } from './state.js'
import { applyHandleTransformOptions, getRotateOrderFromOptions, isDefaultOptions } from './utils.js'

const eulerHelper1 = new Euler()
const eulerHelper2 = new Euler()
const scaleHelper = new Vector3()
const quaterionHelper1 = new Quaternion()
const quaterionHelper2 = new Quaternion()
const deltaQuaterionHelper = new Quaternion()
const avgDeltaQuaternionHelper = new Quaternion()
const deltaHelper1 = new Vector3()
const deltaHelper2 = new Vector3()
const rayHelper1 = new Ray()
const rayHelper2 = new Ray()
const ZeroVector = new Vector3(0, 0, 0)
const OneVector = new Vector3(1, 1, 1)

const vectorHelper1 = new Vector3()
const vectorHelper2 = new Vector3()

const matrixHelper = new Matrix4()

/**
 * initialWorldMatrix = initialRelativeToParentWorldMatrix * initialRelativeToPosition * initialRealtiveToQuaternion * initialMatrixInRelativeToOriginSpace
 *
 * initialRelativeToOriginWorldMatrix * initialMatrixInRelativeToOriginSpace = initialWorldMatrix <=>
 * initialMatrixInRelativeToOriginSpace = initialRelativeToOriginWorldMatrix-1 * initialWorldMatrix
 */
export function computeGlobalTransformation(
  inputState: Map<
    number,
    {
      offset: Matrix4
      worldMatrix: Matrix4
      worldDirection: Vector3 | undefined
      initialWorldMatrix: Matrix4
      initialWorldDirection: Vector3 | undefined
    }
  >,
  initialRelativeToParentWorldMatrix: Matrix4 | undefined,
  initialRelativeToPosition: Vector3,
  initialRealtiveToQuaternion: Quaternion,
  initialMatrixInRelativeToOriginSpace: Matrix4,
  relativeToParentWorldMatrix: Matrix4 | undefined,
  options: HandleOptions,
) {
  //4 cases
  //1. one input with translate as rotation / scale => treat as 2 inputs with one input beeing a the object's offset with no offset
  //2. one input => take its current global matrix, apply the offset matrix and return that
  //3. two inputs => same as n-inputs but rotation in the axis between the two inputs will be averaged and applied
  //4. n-inputs  => ....

  const translateOptions = options.translate ?? true

  if (typeof translateOptions === 'string') {
    const [input] = inputState.values()
    //relativeTransformation * delta = input.initialTransformation <=>
    //delta = relativeTransformation-1 * input.initialTransformation
    matrixHelper.compose(initialRelativeToPosition, initialRealtiveToQuaternion, OneVector)
    if (relativeToParentWorldMatrix != null) {
      matrixHelper.premultiply(relativeToParentWorldMatrix)
    }
    matrixHelper.invert()
    rayHelper1.origin.setFromMatrixPosition(input.initialWorldMatrix)
    if (input.initialWorldDirection != null) {
      rayHelper1.direction.copy(input.initialWorldDirection)
    }
    rayHelper1.applyMatrix4(matrixHelper)
    rayHelper2.origin.setFromMatrixPosition(input.worldMatrix)
    if (input.worldDirection != null) {
      rayHelper2.direction.copy(input.worldDirection)
    }
    rayHelper2.applyMatrix4(matrixHelper)

    if (translateOptions === 'as-scale') {
      quaterionHelper1.identity()
    } else {
      vectorHelper1.copy(rayHelper1.origin)
      vectorHelper2.copy(rayHelper2.origin)
      projectIntoSpaceFromOptions(
        options.rotate,
        vectorHelper1,
        input.initialWorldDirection == null ? undefined : rayHelper1.direction,
        'rotate',
      )
      projectIntoSpaceFromOptions(
        options.rotate,
        vectorHelper2,
        input.worldDirection == null ? undefined : rayHelper2.direction,
        'rotate',
      )
      vectorHelper1.normalize()
      vectorHelper2.normalize()
      quaterionHelper1.setFromUnitVectors(vectorHelper1, vectorHelper2)
    }

    if (translateOptions === 'as-rotate') {
      scaleHelper.setScalar(1)
    } else {
      vectorHelper1.copy(rayHelper1.origin)
      vectorHelper2.copy(rayHelper2.origin)
      if (translateOptions === 'as-rotate-and-scale') {
        vectorHelper2.applyQuaternion(quaterionHelper2.copy(quaterionHelper1).invert())
      }
      projectIntoSpaceFromOptions(
        options.scale,
        vectorHelper1,
        input.initialWorldDirection == null ? undefined : rayHelper1.direction,
        'scale',
      )
      projectIntoSpaceFromOptions(
        options.scale,
        vectorHelper2,
        input.worldDirection == null ? undefined : rayHelper2.direction,
        'scale',
      )
      vectorHelper2.x = vectorHelper1.x === 0 ? 1 : Math.abs(vectorHelper2.x / vectorHelper1.x)
      vectorHelper2.y = vectorHelper1.y === 0 ? 1 : Math.abs(vectorHelper2.y / vectorHelper1.y)
      vectorHelper2.z = vectorHelper1.z === 0 ? 1 : Math.abs(vectorHelper2.z / vectorHelper1.z)
      scaleHelper.copy(vectorHelper2)
    }

    const result = new Matrix4()
      .compose(initialRelativeToPosition, quaterionHelper1.premultiply(initialRealtiveToQuaternion), scaleHelper)
      .multiply(initialMatrixInRelativeToOriginSpace)
    if (relativeToParentWorldMatrix != null) {
      result.premultiply(relativeToParentWorldMatrix)
    }
    return result
  }

  if (inputState.size === 1) {
    const [input] = inputState.values()
    const result = input.worldMatrix.clone()
    const rotateOptions = options.rotate ?? true

    if (!isDefaultOptions(rotateOptions)) {
      recomposeRelativeTo(
        result,
        input.initialWorldMatrix,
        relativeToParentWorldMatrix,
        initialRelativeToParentWorldMatrix,
        (_position, quaternion, _scale, _initialPosition, initialQuaterion) => {
          const rotateOptions = options.rotate ?? true
          if (rotateOptions === false) {
            quaternion.copy(initialQuaterion)
            return
          }
          const order = getRotateOrderFromOptions(rotateOptions)
          eulerHelper1.setFromQuaternion(quaternion, order)
          eulerHelper2.setFromQuaternion(initialQuaterion, order)
          applyHandleTransformOptions(eulerHelper1, eulerHelper2, rotateOptions)
          quaternion.setFromEuler(eulerHelper1)
        },
      )
    }
    return result.multiply(input.offset)
  }

  if (inputState.size === 2) {
    const [input1, input2] = inputState.values()
    //TODO: apply rotation arround directionHelper axis

    //prepare
    deltaHelper1
      .setFromMatrixPosition(input1.initialWorldMatrix)
      .sub(vectorHelper1.setFromMatrixPosition(input2.initialWorldMatrix))
    deltaHelper2.setFromMatrixPosition(input1.worldMatrix).sub(vectorHelper1.setFromMatrixPosition(input2.worldMatrix))

    //rotation
    quaterionHelper1.setFromUnitVectors(
      vectorHelper1.copy(deltaHelper1).normalize(),
      vectorHelper2.copy(deltaHelper2).normalize(),
    )

    //scale
    scaleHelper.copy(deltaHelper2).applyQuaternion(quaterionHelper2.copy(quaterionHelper1).invert())
    scaleHelper.divide(deltaHelper1)
    scaleHelper.x = Math.abs(scaleHelper.x)
    scaleHelper.y = Math.abs(scaleHelper.y)
    scaleHelper.z = Math.abs(scaleHelper.z)

    const result = new Matrix4()
      .makeTranslation(
        vectorHelper1
          .copy(deltaHelper2)
          .multiplyScalar(0.5)
          .add(vectorHelper2.setFromMatrixPosition(input2.worldMatrix)),
      )
      .multiply(matrixHelper.compose(ZeroVector, quaterionHelper1, scaleHelper))

    /* TODO:
    recomposeRelativeTo(result, , relativeToParentWorldMatrix, initialRelativeToParentWorldMatrix, () => {

    })*/

    input2.initialWorldMatrix.decompose(vectorHelper1, quaterionHelper2, vectorHelper2)
    return result
      .multiply(matrixHelper.makeTranslation(vectorHelper1.copy(deltaHelper1).multiplyScalar(0.5).negate()))
      .multiply(matrixHelper.makeRotationFromQuaternion(quaterionHelper2))
      .multiply(input2.offset)
  }

  throw new Error(`multipointer with more then 2 pointers is not yet supported`)
}

const recomposeMatrixHelper1 = new Matrix4()
const decomposePositionHelper1 = new Vector3()
const decomposeQuaternionHelper1 = new Quaternion()
const decomposeScaleHelper1 = new Vector3()
const recomposeMatrixHelper2 = new Matrix4()
const decomposePositionHelper2 = new Vector3()
const decomposeQuaternionHelper2 = new Quaternion()
const decomposeScaleHelper2 = new Vector3()
function recomposeRelativeTo(
  matrix: Matrix4,
  initialMatrix: Matrix4,
  relativeTo: Matrix4 | undefined,
  initialRelativeTo: Matrix4 | undefined,
  fn: (
    position: Vector3,
    quaterion: Quaternion,
    scale: Vector3,
    initialPosition: Vector3,
    initialQuaterion: Quaternion,
    initialScale: Vector3,
  ) => void,
): void {
  if (relativeTo != null) {
    //relativeTo * result = matrix <=>
    //result = relativeTo-1 * matrix
    recomposeMatrixHelper1.copy(relativeTo).invert().multiply(matrix)
  }
  if (initialRelativeTo != null) {
    recomposeMatrixHelper2.copy(initialRelativeTo).invert().multiply(initialMatrix)
  }
  recomposeMatrixHelper1.decompose(decomposePositionHelper1, decomposeQuaternionHelper1, decomposeScaleHelper1)
  recomposeMatrixHelper2.decompose(decomposePositionHelper2, decomposeQuaternionHelper2, decomposeScaleHelper2)
  fn(
    decomposePositionHelper1,
    decomposeQuaternionHelper1,
    decomposeScaleHelper1,
    decomposePositionHelper2,
    decomposeQuaternionHelper2,
    decomposeScaleHelper2,
  )
  matrix.compose(decomposePositionHelper1, decomposeQuaternionHelper1, decomposeScaleHelper1)
  if (relativeTo != null) {
    matrix.premultiply(relativeTo)
  }
}

function projectIntoSpaceFromOptions(
  options: HandleTransformOptions = true,
  point: Vector3,
  direction: Vector3 | undefined,
  forTransformation: 'scale' | 'rotate',
): void {
  if (typeof options === 'boolean') {
    if (!options) {
      point.set(0, 0, 0)
    }
    return
  }
  if (typeof options === 'string') {
    if (forTransformation === 'scale') {
      projectOntoAxis(point, direction, options)
    } else {
      projectOntoPlane(point, direction, options)
    }
    return
  }
  const enablesAxes: Array<Axis> = []
  const disabledAxes: Array<Axis> = []
  ;(options.x === false ? disabledAxes : enablesAxes).push('x')
  ;(options.y === false ? disabledAxes : enablesAxes).push('y')
  ;(options.z === false ? disabledAxes : enablesAxes).push('z')
  if (enablesAxes.length === 3) {
    return
  }
  if (enablesAxes.length === 0) {
    point.set(0, 0, 0)
  }
  const activeAxes = forTransformation === 'scale' ? enablesAxes : disabledAxes
  const notActiveAxes = forTransformation === 'scale' ? disabledAxes : enablesAxes
  if (activeAxes.length === 1) {
    projectOntoAxis(point, direction, activeAxes[0])
    return
  }
  projectOntoPlane(point, direction, notActiveAxes[0])
}

const planes = {
  x: new Plane(new Vector3(1, 0, 0), 0),
  y: new Plane(new Vector3(0, 1, 0), 0),
  z: new Plane(new Vector3(0, 0, 1), 0),
}

function projectOntoPlane(point: Vector3, direction: Vector3 | undefined, notAxis: Axis): void {
  const plane = planes[notAxis]
  if (direction == null || Math.abs(plane.normal.dot(direction)) < 0.001) {
    point[notAxis] = 0
    return
  }
  const distanceToPlane = plane.distanceToPoint(point)
  let distanceAlongDirection = distanceToPlane / direction.dot(plane.normal)
  point.addScaledVector(direction, -distanceAlongDirection)
}

const normals = {
  x: new Vector3(1, 0, 0),
  y: new Vector3(0, 1, 0),
  z: new Vector3(0, 0, 1),
}

const anotherAxis = {
  x: 'y',
  y: 'z',
  z: 'x',
} as const

const projectHelper = new Vector3()
const crossVectorHelper = new Vector3()
/**
 * finds the intersection between the given axis (infinite line) and another infinite line provided with point and direction
 */
function projectOntoAxis(p2: Vector3, n2: Vector3 | undefined, axis: Axis): void {
  const n1 = normals[axis]
  if (n2 == null || Math.abs(n1.dot(n2)) > 0.999) {
    const tmp = p2[axis]
    p2.set(0, 0, 0)
    p2[axis] = tmp
    return
  }
  projectPointOntoNormal(projectHelper.copy(p2), crossVectorHelper.crossVectors(n1, n2).normalize())
  p2.sub(projectHelper)
  //projectHelper with the normal n2 now represents a line that crosses the axis at the desired point

  const a = anotherAxis[axis]
  const distance = -p2[a] / n2[a]
  p2.addScaledVector(n2, distance)
}

function projectPointOntoNormal(point: Vector3, normal: Vector3) {
  const dot = point.dot(normal)
  point.copy(normal).multiplyScalar(dot)
}
