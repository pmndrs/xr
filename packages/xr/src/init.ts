import { isAppleVisionPro } from './misc.js'

export type XRSessionFeatureRequest = 'required' | true | false

export type XRSessionInitOptions = {
  /**
   * whether the session has bounds
   * false means unbounded (only available in AR)
   * true means bounded (allows to reference the bounding space)
   * undefined means bounded but no access to bounding space
   * @default undefined
   */
  bounded?: boolean | undefined
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
  bodyTracking?: XRSessionFeatureRequest
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
}

export function buildXRSessionInit(
  mode: XRSessionMode,
  domOverlayRoot: Element | undefined,
  {
    anchors = true,
    handTracking = isAppleVisionPro() ? false : true,
    layers = true,
    meshDetection = true,
    planeDetection = true,
    customSessionInit,
    depthSensing = false,
    hitTest = true,
    domOverlay = true,
    bodyTracking = false, //until 6.7 since breaking change
    bounded,
  }: XRSessionInitOptions = {},
) {
  if (customSessionInit != null) {
    return customSessionInit
  }

  const requiredFeatures: Array<XRReferenceSpaceType> =
    bounded == null ? ['local-floor'] : bounded ? ['bounded-floor'] : ['unbounded', 'local-floor']

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
  addXRSessionFeature(bodyTracking, 'body-tracking', requiredFeatures, optionalFeatures)

  const init: XRSessionInit = {
    requiredFeatures,
    optionalFeatures,
  }

  if (domOverlayRoot != null) {
    init.domOverlay = { root: domOverlayRoot }
  }

  //TODO: replace with call to isSupportedFeature (unbounded, ...)
  if (depthSensing) {
    Object.assign(init, { depthSensing: { usagePreference: ['gpu-optimized'], dataFormatPreference: [] } })
  }

  return init
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
