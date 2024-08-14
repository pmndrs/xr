import {
  CylinderGeometry,
  Matrix4,
  Object3D,
  PlaneGeometry,
  Quaternion,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
  WebXRManager,
} from 'three'
import { getSpaceFromAncestors } from './space.js'
import { XRState, XRStore } from './store.js'

export type XRLayerEntry = { renderOrder: number; readonly layer: XRCylinderLayer | XRQuadLayer | XREquirectLayer }

export type XRVideoLayerOptions = Pick<
  Partial<XRMediaCylinderLayerInit & XRMediaQuadLayerInit & XRMediaEquirectLayerInit>,
  'layout' | 'invertStereo'
>

export type XRLayerOptions = Pick<
  Partial<XRCylinderLayerInit & XRQuadLayerInit & XREquirectLayerInit>,
  'layout' | 'mipLevels' | 'colorFormat' | 'depthFormat' | 'isStatic' | 'textureType'
>

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

export async function waitForVideoSize(src: HTMLVideoElement) {
  if (src.readyState < 1) {
    return new Promise<void>((resolve) => {
      const onResolve = () => {
        resolve()
        src.removeEventListener('loadedmetadata', onResolve)
      }
      src.addEventListener('loadedmetadata', onResolve)
    })
  }
}

export function createXRVideoLayer(
  state: XRState<any>,
  shape: XRLayerShape,
  relativeTo: Object3D,
  src: HTMLVideoElement,
  options: XRVideoLayerOptions = {},
  properties: XRLayerProperties = {},
) {
  const space = getSpaceFromAncestors(relativeTo, state.origin, state.originReferenceSpace, matrixHelper)
  if (space == null) {
    return undefined
  }
  const transform = matrixToRigidTransform(matrixHelper, scaleHelper)
  const init: XRMediaCylinderLayerInit &
    XRMediaEquirectLayerInit &
    XRMediaQuadLayerInit & { transform: XRRigidTransform } = {
    ...options,
    space,
    transform,
  }
  applyXRLayerScale(shape, init, properties.centralAngle, scaleHelper)
  const fnName = `create${capitalize(shape)}Layer` as const
  const layer = state.mediaBinding?.[fnName](src, init)
  if (layer == null) {
    return
  }
  updateXRLayerProperties(layer, properties)
  return layer
}

export async function waitForImageSize(src: Exclude<TexImageSource, VideoFrame>) {
  if (src instanceof HTMLImageElement && !src.complete) {
    await new Promise<void>((resolve) => {
      const onResolve = () => {
        resolve()
        src.removeEventListener('load', onResolve)
      }
      src.addEventListener('load', onResolve)
    })
  }
}

export function createXRLayer(
  state: XRState<any>,
  xrManager: WebXRManager,
  shape: XRLayerShape,
  relativeTo: Object3D,
  viewPixelWidth: number,
  viewPixelHeight: number,
  options: XRLayerOptions = {},
  properties: XRLayerProperties = {},
) {
  const space = getSpaceFromAncestors(relativeTo, state.origin, state.originReferenceSpace, matrixHelper)
  if (space == null) {
    return undefined
  }
  const transform = matrixToRigidTransform(matrixHelper, scaleHelper)
  const init: XRCylinderLayerInit & XREquirectLayerInit & XRQuadLayerInit & { transform: XRRigidTransform } = {
    ...options,
    viewPixelWidth,
    viewPixelHeight,
    space,
    transform,
  }
  applyXRLayerScale(shape, init, properties.centralAngle, scaleHelper)
  const fnName = `create${capitalize(shape)}Layer` as const
  const layer = xrManager.getBinding()?.[fnName](init)
  if (layer == null) {
    return
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
  return new XRRigidTransform({ ...vectorHelper, w: 1.0 }, { ...quaternionHelper })
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
      return new CylinderGeometry(1, 1, 1, 32, 1, true, Math.PI - centralAngle / 2, centralAngle).scale(-1, 1, 1)
    case 'equirect': {
      const centralHorizontalAngle = properties.centralHorizontalAngle ?? DefaultCentralHorizontalAngle
      const upperVerticalAngle = properties.upperVerticalAngle ?? DefaultUpperVerticalAngle
      return new SphereGeometry(
        1,
        32,
        16,
        -Math.PI / 2 - centralHorizontalAngle / 2,
        centralHorizontalAngle,
        Math.PI / 2 - upperVerticalAngle,
        upperVerticalAngle - (properties.lowerVerticalAngle ?? DefaultLowerVerticalAngle),
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

export function setupStaticXRLayerContent(
  renderer: WebGLRenderer,
  store: XRStore<any>,
  layer: XRCompositionLayer,
  content: Exclude<TexImageSource, VideoFrame>,
) {
  let stop = false
  const draw = async () => {
    const frame = await store.requestFrame()
    if (stop) {
      return
    }
    writeContentToXRLayer(renderer, layer, frame, content)
  }
  layer.addEventListener('redraw', draw)
  draw()
  return () => {
    stop = true
    layer.removeEventListener('redraw', draw)
  }
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
  target.space = getSpaceFromAncestors(relativeTo, state.origin, state.originReferenceSpace, matrixHelper)!
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
