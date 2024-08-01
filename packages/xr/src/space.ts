import { Matrix4, Object3D } from 'three'

export function createGetXRSpaceMatrix(
  space: XRSpace,
  referenceSpace: XRSpace | (() => XRSpace | undefined),
): (target: Matrix4, frame: XRFrame | undefined) => void {
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

export function computeOriginReferenceSpaceOffset(
  object: Object3D,
  origin: Object3D | undefined,
  target: Matrix4,
): void {
  if (origin == null) {
    target.copy(object.matrixWorld)
    return
  }
  target.copy(origin.matrixWorld).invert().multiply(object.matrixWorld)
}

export function getSpaceFromAncestors(
  object: Object3D,
  origin?: Object3D,
  originReferenceSpace?: XRReferenceSpace,
  targetOffsetMatrix?: Matrix4,
) {
  targetOffsetMatrix?.copy(object.matrix)
  const result = getXRSpaceFromAncestorsRec(object, targetOffsetMatrix)
  if (result != null || origin == null || originReferenceSpace == null) {
    return result
  }
  if (targetOffsetMatrix != null) {
    computeOriginReferenceSpaceOffset(object, origin, targetOffsetMatrix)
  }
  return originReferenceSpace
}

function getXRSpaceFromAncestorsRec(
  { parent }: Object3D,
  targetOffsetMatrix: Matrix4 | undefined,
): XRSpace | undefined {
  if (parent == null) {
    return undefined
  }
  if (targetOffsetMatrix != null) {
    targetOffsetMatrix.premultiply(parent.matrix)
  }
  return parent.xrSpace ?? getXRSpaceFromAncestorsRec(parent, targetOffsetMatrix)
}
