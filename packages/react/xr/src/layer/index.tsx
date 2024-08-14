import { useSessionFeatureEnabled } from '../hooks.js'
import { useXRLayerGeometry } from './geometry.js'
import { NonXRImageLayer, XRImageLayer, XRImageLayerProperties } from './image.js'
import { NonXRVideoLayer, XRVideoLayer, XRVideoLayerProperties } from './video.js'

export function XRLayer(props: Omit<XRImageLayerProperties | XRVideoLayerProperties, 'geometry'>) {
  const layersEnabled = useSessionFeatureEnabled('layers')
  const geometry = useXRLayerGeometry(props)
  if (props.src instanceof HTMLVideoElement) {
    return layersEnabled ? (
      <XRVideoLayer {...(props as XRVideoLayerProperties)} geometry={geometry} />
    ) : (
      <NonXRVideoLayer {...(props as XRVideoLayerProperties)} geometry={geometry} />
    )
  }
  return layersEnabled ? (
    <XRImageLayer {...props} geometry={geometry} />
  ) : (
    <NonXRImageLayer {...props} geometry={geometry} />
  )
}
