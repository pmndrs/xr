import {
  XRLayerShape,
  XRLayerProperties,
  XRLayerOptions,
  createXRLayer,
  setupStaticXRLayerContent,
  XRLayerEntry,
  waitForImageSize,
} from '@pmndrs/xr'
import { MeshProps, useThree } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Mesh, Object3D, SRGBColorSpace, Texture } from 'three'
import { useXRLayer } from './layer.js'
import { useXRStore, XRStore } from '../xr.js'

export type XRImageLayerProperties = {
  src: Exclude<TexImageSource, VideoFrame>
  shape?: XRLayerShape
} & Omit<XRLayerOptions, 'textureType' | 'isStatic'> &
  XRLayerProperties &
  MeshProps

export function NonXRImageLayer({ src, renderOrder, ...props }: XRImageLayerProperties) {
  const [texture, setTexture] = useState<Texture | undefined>(undefined)
  useEffect(() => {
    let aborted = false
    let cleanup: (() => void) | undefined
    waitForImageSize(src).then(() => {
      if (aborted) {
        return
      }
      const result = new Texture(src)
      result.needsUpdate = true
      cleanup = () => result.dispose()
      setTexture(result)
    })
    return () => {
      aborted = true
      cleanup?.()
    }
  }, [src])
  if (texture == null) {
    return
  }
  return (
    <mesh {...props}>
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  )
}

export function XRImageLayer({
  src,
  shape,
  colorFormat,
  depthFormat,
  layout,
  mipLevels,
  renderOrder = 0,
  blendTextureSourceAlpha,
  centralAngle,
  centralHorizontalAngle,
  chromaticAberrationCorrection,
  lowerVerticalAngle,
  quality,
  upperVerticalAngle,
  ...props
}: XRImageLayerProperties) {
  const ref = useRef<Mesh>(null)
  const renderer = useThree((xr) => xr.gl)
  const createLayer = useCallback(
    async (store: XRStore, object: Object3D, properties: XRLayerProperties) => {
      await waitForImageSize(src)
      return createXRLayer(
        store.getState(),
        renderer.xr,
        shape ?? 'quad',
        object,
        src.width,
        src.height,
        { colorFormat, depthFormat, isStatic: true, layout, mipLevels, textureType: 'texture' },
        properties,
      )
    },
    [colorFormat, depthFormat, layout, mipLevels, renderer.xr, shape, src],
  )
  const store = useXRStore()
  const onLoaded = useCallback(
    ({ layer }: XRLayerEntry) => setupStaticXRLayerContent(renderer, store, layer, src),
    [renderer, src, store],
  )
  useXRLayer(
    ref,
    renderOrder,
    createLayer,
    {
      blendTextureSourceAlpha,
      centralAngle,
      centralHorizontalAngle,
      chromaticAberrationCorrection,
      lowerVerticalAngle,
      quality,
      upperVerticalAngle,
    },
    onLoaded,
  )
  return (
    <mesh {...props} renderOrder={-Infinity} ref={ref}>
      <meshBasicMaterial colorWrite={false} />
    </mesh>
  )
}
