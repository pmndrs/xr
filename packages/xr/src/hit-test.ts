import { Matrix4, Object3D, Quaternion, Vector3 } from 'three'
import { getSpaceFromAncestors, XRStore } from './internals.js'
import { toDOMPointInit } from './utils.js'

const matrixHelper = new Matrix4()
const vectorHelper = new Vector3()
const scaleHelper = new Vector3()
const quaternionHelper = new Quaternion()

export type GetWorldMatrixFromXRHitTest = (target: Matrix4, result: XRHitTestResult) => boolean

export async function createXRHitTestSource(
  store: XRStore<any>,
  relativeTo: Object3D | XRSpace | XRReferenceSpaceType,
  trackableType: XRHitTestTrackableType | Array<XRHitTestTrackableType> = ['point', 'plane', 'mesh'],
) {
  const state = store.getState()
  if (typeof relativeTo === 'string') {
    if (state.session == null) {
      return undefined
    }
    relativeTo = await state.session.requestReferenceSpace(relativeTo)
  }

  const entityTypes = Array.isArray(trackableType) ? trackableType : [trackableType]

  //necassary data for request and compute hit test results
  let options: XRHitTestOptionsInit
  let baseSpace: XRSpace | undefined
  let object: Object3D | undefined

  if (relativeTo instanceof XRSpace) {
    //configure for request and compute hit test results
    options = { space: relativeTo, entityTypes }
    object = state.origin
  } else {
    //compute space
    const space = getSpaceFromAncestors(relativeTo, state.origin, state.originReferenceSpace, matrixHelper)
    if (space == null) {
      return undefined
    }

    //compute offset ray
    matrixHelper.decompose(vectorHelper, quaternionHelper, scaleHelper)
    const point = toDOMPointInit(vectorHelper)
    vectorHelper.set(0, 0, -1).applyQuaternion(quaternionHelper)
    const offsetRay = new XRRay(point, toDOMPointInit(vectorHelper, 0))

    //configure for request and compute hit test results
    object = relativeTo
    options = { space, offsetRay, entityTypes }
    baseSpace = space
  }

  const source = await store.getState().session?.requestHitTestSource?.(options)
  if (source == null) {
    return undefined
  }

  return {
    source,
    getWorldMatrix: computeWorldMatrixFromXRHitTestResult.bind(null, store, baseSpace, object),
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
  store: XRStore<any>,
  baseSpace: XRSpace | undefined,
  object: Object3D | undefined,
  target: Matrix4,
  result: XRHitTestResult,
): boolean {
  baseSpace ??= store.getState().originReferenceSpace
  if (baseSpace == null) {
    return false
  }
  const pose = result.getPose(baseSpace)
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
