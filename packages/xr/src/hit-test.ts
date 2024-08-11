import { Matrix4, Object3D, Quaternion, Vector3 } from 'three'
import { computeOriginReferenceSpaceOffset, getSpaceFromAncestors, XRStore } from './internals.js'

const matrixHelper = new Matrix4()
const vectorHelper = new Vector3()
const quaternionHelper = new Quaternion()

export type GetWorldMatrixFromXRHitTest = (target: Matrix4, result: XRHitTestResult) => boolean

export async function createXRHitTestSource(
  store: XRStore<any>,
  relativeTo: Object3D | XRSpace | XRReferenceSpaceType,
  trackableType: XRHitTestTrackableType | Array<XRHitTestTrackableType> = ['point', 'plane', 'mesh'],
) {
  let offsetRay: XRRay | undefined
  let space: XRSpace
  let object: Object3D | undefined
  const state = store.getState()
  if (typeof relativeTo === 'string') {
    const { session } = store.getState()
    if (session == null) {
      return undefined
    }
    relativeTo = await session.requestReferenceSpace(relativeTo)
  }

  if (relativeTo instanceof XRSpace) {
    space = relativeTo
    object = state.origin
  } else {
    if (state.originReferenceSpace == null) {
      return undefined
    }
    object = relativeTo
    space =
      getSpaceFromAncestors(relativeTo, state.origin, state.originReferenceSpace, matrixHelper) ??
      state.originReferenceSpace

    if (space === state.originReferenceSpace) {
      computeOriginReferenceSpaceOffset(relativeTo, state.origin, matrixHelper)
    }
    vectorHelper.setFromMatrixPosition(matrixHelper)
    const point: DOMPointInit = { ...vectorHelper }
    quaternionHelper.setFromRotationMatrix(matrixHelper)
    vectorHelper.set(0, 0, -1).applyQuaternion(quaternionHelper)
    const direction: DOMPointInit = { ...vectorHelper }
    offsetRay = new XRRay(point, direction)
  }
  const source = await store.getState().session?.requestHitTestSource?.({
    space,
    entityTypes: Array.isArray(trackableType) ? trackableType : [trackableType],
    offsetRay,
  })
  if (source == null) {
    return undefined
  }
  return {
    source,
    getWorldMatrix: computeWorldMatrixFromXRHitTestResult.bind(null, space, object),
  }
}

export async function requestXRHitTest(
  store: XRStore<any>,
  relativeTo: Object3D | XRSpace | XRReferenceSpaceType,
  trackableType?: XRHitTestTrackableType | Array<XRHitTestTrackableType>,
) {
  const sourceData = await createXRHitTestSource(store, relativeTo, trackableType)
  if (sourceData == null) {
    return undefined
  }
  const { source, getWorldMatrix } = sourceData
  const frame = await store.requestFrame()
  const results = frame.getHitTestResults?.(source) ?? []
  source.cancel()
  if (results == null) {
    return undefined
  }
  return { results, getWorldMatrix }
}

function computeWorldMatrixFromXRHitTestResult(
  space: XRSpace,
  object: Object3D | undefined,
  target: Matrix4,
  result: XRHitTestResult,
): boolean {
  const pose = result.getPose(space)
  if (pose == null) {
    return false
  }
  //target = ObjectMatrixWorld? * HitTestMatrix
  target.fromArray(pose.transform.matrix)
  if (object != null) {
    target.premultiply(object.matrixWorld)
  }
  return true
}
