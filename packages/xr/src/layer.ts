import {
  CylinderGeometry,
  DepthTexture,
  HalfFloatType,
  LinearFilter,
  Matrix4,
  Object3D,
  PlaneGeometry,
  Quaternion,
  SphereGeometry,
  SRGBColorSpace,
  Texture,
  Vector3,
  VideoTexture,
  WebGLRenderer,
  WebGLRenderTarget,
  WebXRManager,
} from 'three'
import { getSpaceFromAncestors } from './space.js'
import { XRState, XRStore } from './store.js'
import { toDOMPointInit } from './utils.js'

export type XRLayerEntry = {
  renderOrder: number
  readonly layer: XRCylinderLayer | XRQuadLayer | XREquirectLayer
  readonly object3D: Object3D
}

export type XRLayerOptions = Pick<
  Partial<XRCylinderLayerInit & XRQuadLayerInit & XREquirectLayerInit>,
  'layout' | 'mipLevels' | 'colorFormat' | 'depthFormat'
> &
  Pick<
    Partial<XRMediaCylinderLayerInit & XRMediaQuadLayerInit & XRMediaEquirectLayerInit>,
    'layout' | 'invertStereo'
  > & {
    shape?: XRLayerShape
  }

export type XRLayerSrc = HTMLVideoElement | Exclude<TexImageSource, VideoFrame | HTMLVideoElement> | WebGLRenderTarget

export type XRLayerProperties = Pick<
  Partial<XRCylinderLayer & XRQuadLayer & XREquirectLayer>,
  | 'centralAngle'
  | 'centralHorizontalAngle'
  | 'upperVerticalAngle'
  | 'lowerVerticalAngle'
  | 'blendTextureSourceAlpha'
  | 'chromaticAberrationCorrection'
  | 'quality'
>

export type XRLayerShape = 'cylinder' | 'equirect' | 'quad'

const DefaultCentralAngle = (60 / 180) * Math.PI
const DefaultCentralHorizontalAngle = (60 / 180) * Math.PI
const DefaultLowerVerticalAngle = (-30 / 180) * Math.PI
const DefaultUpperVerticalAngle = (30 / 180) * Math.PI

export function createXRLayer(
  src: XRLayerSrc,
  state: XRState<any>,
  originReferenceSpace: XRReferenceSpace,
  xrManager: WebXRManager,
  relativeTo: Object3D,
  options: XRLayerOptions,
  properties: XRLayerProperties,
) {
  return src instanceof HTMLVideoElement
    ? createXRVideoLayer(src, state, originReferenceSpace, relativeTo, options, properties)
    : createXRNormalLayer(src, state.origin, originReferenceSpace, xrManager, relativeTo, options, properties)
}

function createXRVideoLayer(
  src: HTMLVideoElement,
  state: XRState<any>,
  originReferenceSpace: XRReferenceSpace,
  relativeTo: Object3D,
  { invertStereo, layout, shape = 'quad' }: XRLayerOptions,
  properties: XRLayerProperties = {},
) {
  const space = getSpaceFromAncestors(relativeTo, state.origin, originReferenceSpace, matrixHelper)
  const transform = matrixToRigidTransform(matrixHelper, scaleHelper)
  const init: XRMediaCylinderLayerInit &
    XRMediaEquirectLayerInit &
    XRMediaQuadLayerInit & { transform: XRRigidTransform } = {
    invertStereo,
    layout,
    space,
    transform,
  }
  applyXRLayerScale(shape, init, properties.centralAngle, scaleHelper)
  const fnName = `create${capitalize(shape)}Layer` as const
  const layer = state.mediaBinding?.[fnName](src, init)
  if (layer == null) {
    return undefined
  }
  updateXRLayerProperties(layer, properties)
  return layer
}

function createXRNormalLayer(
  src: Exclude<TexImageSource, VideoFrame | HTMLVideoElement> | WebGLRenderTarget,
  origin: Object3D | undefined,
  originReferenceSpace: XRReferenceSpace,
  xrManager: WebXRManager,
  relativeTo: Object3D,
  { shape = 'quad', ...options }: XRLayerOptions,
  properties: XRLayerProperties = {},
) {
  const space = getSpaceFromAncestors(relativeTo, origin, originReferenceSpace, matrixHelper)
  const transform = matrixToRigidTransform(matrixHelper, scaleHelper)
  const init: XRCylinderLayerInit & XREquirectLayerInit & XRQuadLayerInit & { transform: XRRigidTransform } = {
    ...options,
    isStatic: !(src instanceof WebGLRenderTarget),
    textureType: 'texture',
    viewPixelWidth: options.layout === 'stereo-left-right' ? src.width / 2 : src.width,
    viewPixelHeight: options.layout === 'stereo-top-bottom' ? src.height / 2 : src.height,
    space,
    transform,
  }
  applyXRLayerScale(shape, init, properties.centralAngle, scaleHelper)
  const fnName = `create${capitalize(shape)}Layer` as const
  const layer = xrManager.getBinding()?.[fnName](init)
  if (layer == null) {
    return undefined
  }
  updateXRLayerProperties(layer, properties)
  return layer
}

const matrixHelper = new Matrix4()
const vectorHelper = new Vector3()
const quaternionHelper = new Quaternion()
const scaleHelper = new Vector3()

function matrixToRigidTransform(matrix: Matrix4, scaleTarget: Vector3 = scaleHelper): XRRigidTransform {
  matrix.decompose(vectorHelper, quaternionHelper, scaleTarget)
  return new XRRigidTransform(toDOMPointInit(vectorHelper), toDOMPointInit(quaternionHelper))
}

declare module 'three' {
  export interface WebGLRenderer {
    setRenderTargetTextures(
      renderTarget: WebGLRenderTarget,
      colorTexture: WebGLTexture,
      depthTexture?: WebGLTexture,
    ): void
  }
}

const segmentPerAngle = 32 / Math.PI

function computeSegmentAmount(angle: number) {
  return Math.ceil(angle * segmentPerAngle)
}

export function setXRLayerRenderTarget(
  renderer: WebGLRenderer,
  renderTarget: WebGLRenderTarget,
  layerEntry: XRLayerEntry | undefined | null,
  frame: XRFrame | undefined,
) {
  if (layerEntry != null && frame != null) {
    const subImage = renderer.xr.getBinding().getSubImage(layerEntry.layer, frame)
    renderer.setRenderTargetTextures(renderTarget, subImage.colorTexture)
  }
  renderer.setRenderTarget(renderTarget)
}

export function createXRLayerGeometry(
  shape: XRLayerShape,
  properties: Pick<
    XRLayerProperties,
    'centralAngle' | 'centralHorizontalAngle' | 'lowerVerticalAngle' | 'upperVerticalAngle'
  >,
) {
  switch (shape) {
    case 'cylinder':
      const centralAngle = properties.centralAngle ?? DefaultCentralAngle
      return new CylinderGeometry(
        1,
        1,
        1,
        computeSegmentAmount(centralAngle),
        1,
        true,
        Math.PI - centralAngle / 2,
        centralAngle,
      ).scale(-1, 1, 1)
    case 'equirect': {
      const centralHorizontalAngle = properties.centralHorizontalAngle ?? DefaultCentralHorizontalAngle
      const upperVerticalAngle = properties.upperVerticalAngle ?? DefaultUpperVerticalAngle
      const lowerVerticalAngle = properties.lowerVerticalAngle ?? DefaultLowerVerticalAngle
      const centralVerticalAngle = upperVerticalAngle - lowerVerticalAngle
      return new SphereGeometry(
        1,
        computeSegmentAmount(centralHorizontalAngle),
        computeSegmentAmount(centralVerticalAngle),
        -Math.PI / 2 - centralHorizontalAngle / 2,
        centralHorizontalAngle,
        Math.PI / 2 - upperVerticalAngle,
        centralVerticalAngle,
      ).scale(-1, 1, 1)
    }
    case 'quad':
      return new PlaneGeometry()
  }
}

function capitalize<T extends string>(text: T) {
  return `${text[0].toUpperCase()}${text.slice(1)}` as Capitalize<T>
}

export function updateXRLayerProperties(
  target: XRCylinderLayer | XRQuadLayer | XREquirectLayer,
  properties: XRLayerProperties = {},
): void {
  target.chromaticAberrationCorrection = properties.chromaticAberrationCorrection
  target.quality = properties.quality ?? 'default'
  target.blendTextureSourceAlpha = properties.blendTextureSourceAlpha ?? false
  if (target instanceof XRCylinderLayer) {
    target.centralAngle = properties?.centralAngle ?? DefaultCentralAngle
    return
  }
  if (target instanceof XREquirectLayer) {
    target.centralHorizontalAngle = properties?.centralHorizontalAngle ?? DefaultCentralHorizontalAngle
    target.lowerVerticalAngle = properties?.lowerVerticalAngle ?? DefaultLowerVerticalAngle
    target.upperVerticalAngle = properties?.upperVerticalAngle ?? DefaultUpperVerticalAngle
  }
}

export function setupXRImageLayer(
  renderer: WebGLRenderer,
  store: XRStore<any>,
  layer: XRCompositionLayer,
  src: Exclude<TexImageSource, VideoFrame | HTMLVideoElement>,
) {
  let stop = false
  const draw = async () => {
    const frame = await store.requestFrame()
    if (stop) {
      return
    }
    writeContentToXRLayer(renderer, layer, frame, src)
  }
  layer.addEventListener('redraw', draw)
  draw()
  return () => {
    stop = true
    layer.removeEventListener('redraw', draw)
  }
}

export async function waitForXRLayerSrcSize(src: XRLayerSrc | undefined) {
  if (src instanceof HTMLImageElement && !src.complete) {
    await new Promise<void>((resolve) => {
      const onResolve = () => {
        resolve()
        src.removeEventListener('load', onResolve)
      }
      src.addEventListener('load', onResolve)
    })
  }
  if (src instanceof HTMLVideoElement && src.readyState < 1) {
    return new Promise<void>((resolve) => {
      const onResolve = () => {
        resolve()
        src.removeEventListener('loadedmetadata', onResolve)
      }
      src.addEventListener('loadedmetadata', onResolve)
    })
  }
}

export function getXRLayerSrcTexture(src: XRLayerSrc): Texture {
  if (src instanceof WebGLRenderTarget) {
    return src.texture
  }
  const texture = src instanceof HTMLVideoElement ? new VideoTexture(src) : new Texture(src)
  texture.colorSpace = SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

function writeContentToXRLayer(
  renderer: WebGLRenderer,
  layer: XRCompositionLayer,
  frame: XRFrame,
  content: Exclude<TexImageSource, VideoFrame>,
) {
  const context = renderer.getContext() as WebGL2RenderingContext
  const subImage = renderer.xr.getBinding().getSubImage(layer, frame)
  renderer.state.bindTexture(context.TEXTURE_2D, subImage.colorTexture)
  context.pixelStorei(context.UNPACK_FLIP_Y_WEBGL, true)
  context.texSubImage2D(
    context.TEXTURE_2D,
    0,
    0,
    0,
    content.width,
    content.height,
    context.RGBA,
    context.UNSIGNED_BYTE,
    content,
  )
}

export function updateXRLayerTransform(
  state: XRState<any>,
  target: XRCylinderLayer | XRQuadLayer | XREquirectLayer,
  centralAngle: number | undefined,
  relativeTo: Object3D,
) {
  if (state.originReferenceSpace == null) {
    return
  }
  target.space = getSpaceFromAncestors(relativeTo, state.origin, state.originReferenceSpace, matrixHelper)
  target.transform = matrixToRigidTransform(matrixHelper, scaleHelper)
  applyXRLayerScale(getLayerShape(target), target, centralAngle, scaleHelper)
}

function applyXRLayerScale(
  shape: XRLayerShape,
  target: Partial<XRCylinderLayer & XRQuadLayer & XREquirectLayer>,
  centralAngle: number | undefined,
  scale: Vector3,
) {
  if (shape === 'cylinder') {
    //0.5 * avg of x and z axis
    const scaleXZ = (scale.x + scale.z) / 2
    const radius = scaleXZ
    const layerWidth = radius * (centralAngle ?? DefaultCentralAngle)
    target.radius = radius
    target.aspectRatio = layerWidth / scale.y
  } else if (shape === 'quad') {
    target.width = scale.x / 2
    target.height = scale.y / 2
  } else {
    target.radius = (scale.x + scale.y + scale.z) / 3
  }
}

export function getLayerShape(layer: XRCylinderLayer | XRQuadLayer | XREquirectLayer): XRLayerShape {
  if (layer instanceof XRCylinderLayer) {
    return 'cylinder'
  }
  if (layer instanceof XREquirectLayer) {
    return 'equirect'
  }
  return 'quad'
}

export function createXRLayerRenderTarget(pixelWidth: number, pixelHeight: number, dpr: number) {
  return new WebGLRenderTarget(pixelWidth * dpr, pixelHeight * dpr, {
    minFilter: LinearFilter,
    magFilter: LinearFilter,
    type: HalfFloatType,
    depthTexture: new DepthTexture(pixelWidth, pixelHeight),
  })
}
