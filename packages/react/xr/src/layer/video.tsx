import { XRLayerProperties, XRLayerShape, XRVideoLayerOptions, createXRVideoLayer, waitForVideoSize } from '@pmndrs/xr'
import { useCallback, useMemo, useRef } from 'react'
import { XRStore } from '../xr.js'
import { MeshProps } from '@react-three/fiber'
import { Mesh, Object3D, SRGBColorSpace, VideoTexture } from 'three'
import { useXRLayer } from './layer.js'

export type XRVideoLayerProperties = {
  src: HTMLVideoElement
  shape?: XRLayerShape
} & XRVideoLayerOptions &
  XRLayerProperties &
  MeshProps

export function NonXRVideoLayer({ src, renderOrder, ...props }: XRVideoLayerProperties) {
  const texture = useMemo(() => {
    const result = new VideoTexture(src)
    result.colorSpace = SRGBColorSpace
    return result
  }, [src])

  //TODO: invertStereo, layout
  return (
    <mesh {...props}>
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  )
}

export function XRVideoLayer({
  src,
  shape,
  renderOrder = 0,
  centralAngle,
  invertStereo,
  layout,
  centralHorizontalAngle,
  upperVerticalAngle,
  lowerVerticalAngle,
  blendTextureSourceAlpha,
  chromaticAberrationCorrection,
  quality,
  ...props
}: XRVideoLayerProperties) {
  const ref = useRef<Mesh>(null)
  const createLayer = useCallback(
    async (store: XRStore, object: Object3D, properties: XRLayerProperties) => {
      await waitForVideoSize(src)
      return createXRVideoLayer(store.getState(), shape ?? 'quad', object, src, { invertStereo, layout }, properties)
    },
    [invertStereo, layout, shape, src],
  )
  useXRLayer(ref, renderOrder, createLayer, {
    blendTextureSourceAlpha,
    centralAngle,
    centralHorizontalAngle,
    chromaticAberrationCorrection,
    lowerVerticalAngle,
    quality,
    upperVerticalAngle,
  })
  return (
    <mesh {...props} renderOrder={-Infinity} ref={ref}>
      <meshBasicMaterial colorWrite={false} />
    </mesh>
  )
}
