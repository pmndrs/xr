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

export function getSpaceFromAncestors(
  object: Object3D,
  origin: Object3D | undefined,
  originReferenceSpace: XRReferenceSpace,
  targetOffsetMatrix?: Matrix4,
): XRSpace

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
  targetOffsetMatrix?.copy(object.matrix)
  const result = getXRSpaceFromAncestorsRec(object.parent, targetOffsetMatrix)
  if (result != null) {
    return result
  }
  if (targetOffsetMatrix != null) {
    computeOriginReferenceSpaceOffset(object, origin, targetOffsetMatrix)
  }
  return originReferenceSpace
}

function computeOriginReferenceSpaceOffset(object: Object3D, origin: Object3D | undefined, target: Matrix4): void {
  if (origin == null) {
    target.copy(object.matrixWorld)
    return
  }
  target.copy(origin.matrixWorld).invert().multiply(object.matrixWorld)
}

function getXRSpaceFromAncestorsRec(
  object: Object3D | null,
  targetOffsetMatrix: Matrix4 | undefined,
): XRSpace | undefined {
  if (object == null) {
    return undefined
  }
  if (object.xrSpace != null) {
    return object.xrSpace
  }
  targetOffsetMatrix?.premultiply(object.matrix)
  return getXRSpaceFromAncestorsRec(object.parent, targetOffsetMatrix)
}
