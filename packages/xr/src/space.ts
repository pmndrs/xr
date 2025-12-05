import { Matrix4, Object3D } from 'three'

export function createGetXRSpaceMatrix(
  space: XRSpace,
  referenceSpace: XRSpace | (() => XRSpace | undefined),
): (target: Matrix4, frame: XRFrame | undefined) => boolean {
  return (target, frame) => {
    if (space === referenceSpace) {
      target.identity()
      return true
    }
    const resolvedReferenceSpace = typeof referenceSpace === 'function' ? referenceSpace() : referenceSpace
    if (resolvedReferenceSpace == null) {
      return false
    }
    const pose = frame?.getPose(space, resolvedReferenceSpace)
    if (pose == null) {
      return false
    }
    target.fromArray(pose.transform.matrix)
    return true
  }
}

/**
 * @param targetOffsetMatrix might contain NaN values as a result of this operation
 */
export function getSpaceFromAncestors(
  object: Object3D,
  origin: Object3D | undefined,
  originReferenceSpace: XRReferenceSpace,
  targetOffsetMatrix?: Matrix4,
): XRSpace

/**
 * @param targetOffsetMatrix might contain NaN values as a result of this operation
 */
export function getSpaceFromAncestors(
  object: Object3D,
  origin?: Object3D,
  originReferenceSpace?: XRReferenceSpace,
  targetOffsetMatrix?: Matrix4,
): XRSpace | undefined

export function getSpaceFromAncestors(
  object: Object3D,
  origin?: Object3D,
  originReferenceSpace?: XRReferenceSpace,
  targetOffsetMatrix?: Matrix4,
) {
  // Ensure world matrices are up to date for targetObject and all ancestors
  object.updateWorldMatrix(true, false)
  targetOffsetMatrix?.copy(object.matrix)
  const result = getXRSpaceFromAncestorsRec(object.parent, object, targetOffsetMatrix)
  if (result != null) {
    return result
  }
  if (targetOffsetMatrix != null) {
    computeOriginReferenceSpaceOffset(object, origin, targetOffsetMatrix)
  }
  return originReferenceSpace
}

function computeOriginReferenceSpaceOffset(object: Object3D, origin: Object3D | undefined, target: Matrix4): void {
  object.updateWorldMatrix(true, false)
  if (origin == null) {
    target.copy(object.matrixWorld)
    return
  }
  origin.updateWorldMatrix(true, false)
  //origin * offset = space <=>
  //target = origin.matrixWorld-1 * object.matrixWorld
  target.copy(origin.matrixWorld).invert().multiply(object.matrixWorld)
}

/**
 * Recursively searches ancestors for an xrSpace.
 * @requires The world matrices of targetObject and all its ancestors must be up to date.
 */
function getXRSpaceFromAncestorsRec(
  object: Object3D | null,
  targetObject: Object3D,
  targetOffsetMatrix: Matrix4 | undefined,
): XRSpace | undefined {
  if (object == null) {
    return undefined
  }
  if (object.xrSpace != null) {
    // Calculate offset using world matrices instead of accumulating local matrices.
    // This correctly handles components that override updateWorldMatrix (e.g., UIKit Content).
    if (targetOffsetMatrix != null) {
      targetOffsetMatrix.copy(object.matrixWorld).invert().multiply(targetObject.matrixWorld)
    }
    return object.xrSpace
  }
  return getXRSpaceFromAncestorsRec(object.parent, targetObject, targetOffsetMatrix)
}
