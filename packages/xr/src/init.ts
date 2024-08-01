export type XRSessionFeatureRequest = 'required' | true | false

export type XRSessionInitOptions = {
  /**
   * reference space type for the origin
   * @default "local-floor"
   */
  originReferenceSpace?: Extract<XRReferenceSpaceType, 'bounded-floor' | 'local-floor'>
  /**
   * @default true
   */
  anchors?: XRSessionFeatureRequest
  /**
   * @default true
   */
  handTracking?: XRSessionFeatureRequest
  /**
   * @default true
   */
  layers?: XRSessionFeatureRequest
  /**
   * @default true
   */
  meshDetection?: XRSessionFeatureRequest
  /**
   * @default true
   */
  planeDetection?: XRSessionFeatureRequest
  /**
   * @default false
   */
  depthSensing?: XRSessionFeatureRequest
  /**
   * overrides the session init object
   * use with caution
   * @default undefined
   */
  customSessionInit?: XRSessionInit
  /**
   * @default true
   */
  hitTest?: XRSessionFeatureRequest
  /**
   * @default true
   */
  domOverlay?: XRSessionFeatureRequest | Element
  /**
   * @default true
   */
  unbounded?: XRSessionFeatureRequest
}

export function buildXRSessionInit(
  mode: XRSessionMode,
  domOverlayRoot: Element,
  {
    anchors = true,
    handTracking = true,
    layers = true,
    meshDetection = true,
    planeDetection = true,
    originReferenceSpace = 'local-floor',
    customSessionInit,
    depthSensing = false,
    hitTest = true,
    unbounded = true,
    domOverlay = true,
  }: XRSessionInitOptions = {},
) {
  if (customSessionInit != null) {
    return customSessionInit
  }
  const requiredFeatures: Array<string> = [originReferenceSpace]
  const optionalFeatures: Array<string> = []

  if (domOverlay instanceof Element) {
    domOverlay = true
  }

  addXRSessionFeature(anchors, 'anchors', requiredFeatures, optionalFeatures)
  addXRSessionFeature(handTracking, 'hand-tracking', requiredFeatures, optionalFeatures)
  addXRSessionFeature(layers, 'layers', requiredFeatures, optionalFeatures)
  addXRSessionFeature(meshDetection, 'mesh-detection', requiredFeatures, optionalFeatures)
  addXRSessionFeature(planeDetection, 'plane-detection', requiredFeatures, optionalFeatures)
  addXRSessionFeature(depthSensing, 'depth-sensing', requiredFeatures, optionalFeatures)
  addXRSessionFeature(domOverlay, 'dom-overlay', requiredFeatures, optionalFeatures)
  addXRSessionFeature(hitTest, 'hit-test', requiredFeatures, optionalFeatures)
  if (mode != 'immersive-vr') {
    addXRSessionFeature(unbounded, 'unbounded', requiredFeatures, optionalFeatures)
  }

  return {
    requiredFeatures,
    optionalFeatures,
    domOverlay: { root: domOverlayRoot },
  } satisfies XRSessionInit
}

function addXRSessionFeature(
  value: XRSessionFeatureRequest,
  key: string,
  requiredFeatures: Array<string>,
  optionalFeatures: Array<string>,
) {
  if (value === false) {
    return
  }
  if (value === true) {
    optionalFeatures.push(key)
    return
  }
  requiredFeatures.push(key)
}
