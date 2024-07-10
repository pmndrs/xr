import { Matrix4 } from 'three'

export type GetXRSpace = XRSpace | (() => XRSpace | undefined | null)

export function createGetXRSpaceMatrix(
  space: GetXRSpace,
  referenceSpace: GetXRSpace,
): (target: Matrix4, frame: XRFrame | undefined) => void {
  return (target, frame) => {
    const resolvedReferenceSpace = resolveGetXRSpace(referenceSpace)
    const resolvedSpace = resolveGetXRSpace(space)
    if (resolvedSpace === resolvedReferenceSpace) {
      target.identity()
      return true
    }
    if (frame == null || resolvedSpace == null || resolvedReferenceSpace == null) {
      return false
    }
    const pose = frame.getPose(resolvedSpace, resolvedReferenceSpace)
    if (pose == null) {
      return false
    }
    target.fromArray(pose.transform.matrix)
    return true
  }
}

function resolveGetXRSpace(space: GetXRSpace) {
  if (typeof space === 'function') {
    return space()
  }
  return space
}
