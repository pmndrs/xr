export type XRSessionFeatureRequest = 'required' | true | false

export type XRSessionInitOptions = {
  /**
   * @default "local-floor"
   */
  referenceSpaceType?: XRReferenceSpaceType
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
   * @default undefined
   */
  customSessionInit?: XRSessionInit
}

export function buildXRSessionInit({
  anchors = true,
  handTracking = true,
  layers = true,
  meshDetection = true,
  planeDetection = true,
  referenceSpaceType = 'local-floor',
  customSessionInit,
  depthSensing = false,
}: XRSessionInitOptions = {}): XRSessionInit {
  if (customSessionInit != null) {
    return customSessionInit
  }
  const requiredFeatures: Array<string> = [referenceSpaceType]
  const optionalFeatures: Array<string> = []

  addXRSessionFeature(anchors, 'anchors', requiredFeatures, optionalFeatures)
  addXRSessionFeature(handTracking, 'hand-tracking', requiredFeatures, optionalFeatures)
  addXRSessionFeature(layers, 'layers', requiredFeatures, optionalFeatures)
  addXRSessionFeature(meshDetection, 'mesh-detection', requiredFeatures, optionalFeatures)
  addXRSessionFeature(planeDetection, 'plane-detection', requiredFeatures, optionalFeatures)
  addXRSessionFeature(depthSensing, 'depth-sensing', requiredFeatures, optionalFeatures)

  return {
    requiredFeatures,
    optionalFeatures,
  }
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
