import {
  WebXRManager,
  WebGLRenderer,
  Box3,
  BufferGeometry,
  Camera,
  Color,
  ColorRepresentation,
  CullFace,
  Data3DTexture,
  DataArrayTexture,
  Event,
  Material,
  Object3D,
  Scene,
  ShadowMapType,
  Texture,
  TextureEncoding,
  ToneMapping,
  Vector2,
  Vector3,
  Vector4,
  WebGLCapabilities,
  WebGLDebug,
  WebGLExtensions,
  WebGLInfo,
  WebGLMultipleRenderTargets,
  WebGLProperties,
  WebGLRenderLists,
  WebGLRenderTarget,
  WebGLShadowMap,
  WebGLState
} from 'three'
import { WebXRManagerMock } from './WebXRManagerMock'

export class WebGLRendererMock implements WebGLRenderer {
  xr: WebXRManager
  constructor() {
    this.xr = new WebXRManagerMock()
  }
  // @ts-ignore
  // @ts-ignore
  domElement: HTMLCanvasElement
  // @ts-ignore
  context: WebGLRenderingContext
  // @ts-ignore
  autoClear: boolean
  // @ts-ignore
  autoClearColor: boolean
  // @ts-ignore
  autoClearDepth: boolean
  // @ts-ignore
  autoClearStencil: boolean
  // @ts-ignore
  debug: WebGLDebug
  // @ts-ignore
  sortObjects: boolean
  // @ts-ignore
  clippingPlanes: any[]
  // @ts-ignore
  localClippingEnabled: boolean
  // @ts-ignore
  extensions: WebGLExtensions
  // @ts-ignore
  outputEncoding: TextureEncoding
  // @ts-ignore
  physicallyCorrectLights: boolean
  // @ts-ignore
  toneMapping: ToneMapping
  // @ts-ignore
  toneMappingExposure: number
  // @ts-ignore
  info: WebGLInfo
  // @ts-ignore
  shadowMap: WebGLShadowMap
  // @ts-ignore
  pixelRatio: number
  // @ts-ignore
  capabilities: WebGLCapabilities
  // @ts-ignore
  properties: WebGLProperties
  // @ts-ignore
  renderLists: WebGLRenderLists
  // @ts-ignore
  state: WebGLState
  // @ts-ignore
  getContext(): WebGLRenderingContext | WebGL2RenderingContext {
    throw new Error('Method not implemented.')
  }
  getContextAttributes() {
    throw new Error('Method not implemented.')
  }
  forceContextLoss(): void {
    throw new Error('Method not implemented.')
  }
  forceContextRestore(): void {
    throw new Error('Method not implemented.')
  }
  getMaxAnisotropy(): number {
    throw new Error('Method not implemented.')
  }
  getPrecision(): string {
    throw new Error('Method not implemented.')
  }
  getPixelRatio(): number {
    throw new Error('Method not implemented.')
  }
  setPixelRatio(_value: number): void {
    throw new Error('Method not implemented.')
  }
  getDrawingBufferSize(_target: Vector2): Vector2 {
    throw new Error('Method not implemented.')
  }
  setDrawingBufferSize(_width: number, _height: number, _pixelRatio: number): void {
    throw new Error('Method not implemented.')
  }
  getSize(_target: Vector2): Vector2 {
    throw new Error('Method not implemented.')
  }
  setSize(_width: number, _height: number, _updateStyle?: boolean | undefined): void {
    throw new Error('Method not implemented.')
  }
  getCurrentViewport(_target: Vector4): Vector4 {
    throw new Error('Method not implemented.')
  }
  getViewport(_target: Vector4): Vector4 {
    throw new Error('Method not implemented.')
  }
  setViewport(_x: number | Vector4, _y?: number | undefined, _width?: number | undefined, _height?: number | undefined): void {
    throw new Error('Method not implemented.')
  }
  getScissor(_target: Vector4): Vector4 {
    throw new Error('Method not implemented.')
  }
  setScissor(_x: number | Vector4, _y?: number | undefined, _width?: number | undefined, _height?: number | undefined): void {
    throw new Error('Method not implemented.')
  }
  getScissorTest(): boolean {
    throw new Error('Method not implemented.')
  }
  setScissorTest(_enable: boolean): void {
    throw new Error('Method not implemented.')
  }
  setOpaqueSort(_method: (a: any, b: any) => number): void {
    throw new Error('Method not implemented.')
  }
  setTransparentSort(_method: (a: any, b: any) => number): void {
    throw new Error('Method not implemented.')
  }
  getClearColor(_target: Color): Color {
    throw new Error('Method not implemented.')
  }
  setClearColor(_color: ColorRepresentation, _alpha?: number | undefined): void {
    throw new Error('Method not implemented.')
  }
  getClearAlpha(): number {
    throw new Error('Method not implemented.')
  }
  setClearAlpha(_alpha: number): void {
    throw new Error('Method not implemented.')
  }
  clear(_color?: boolean | undefined, _depth?: boolean | undefined, _stencil?: boolean | undefined): void {
    throw new Error('Method not implemented.')
  }
  clearColor(): void {
    throw new Error('Method not implemented.')
  }
  clearDepth(): void {
    throw new Error('Method not implemented.')
  }
  clearStencil(): void {
    throw new Error('Method not implemented.')
  }
  clearTarget(_renderTarget: WebGLRenderTarget, _color: boolean, _depth: boolean, _stencil: boolean): void {
    throw new Error('Method not implemented.')
  }
  resetGLState(): void {
    throw new Error('Method not implemented.')
  }
  dispose(): void {
    throw new Error('Method not implemented.')
  }
  renderBufferDirect(
    _camera: Camera,
    _scene: Scene,
    _geometry: BufferGeometry,
    _material: Material,
    _object: Object3D<Event>,
    _geometryGroup: any
  ): void {
    throw new Error('Method not implemented.')
  }
  setAnimationLoop(_callback: XRFrameRequestCallback | null): void {
    throw new Error('Method not implemented.')
  }
  animate(_callback: () => void): void {
    throw new Error('Method not implemented.')
  }
  compile(_scene: Object3D<Event>, _camera: Camera): void {
    throw new Error('Method not implemented.')
  }
  render(_scene: Object3D<Event>, _camera: Camera): void {
    throw new Error('Method not implemented.')
  }
  getActiveCubeFace(): number {
    throw new Error('Method not implemented.')
  }
  getActiveMipmapLevel(): number {
    throw new Error('Method not implemented.')
  }
  getRenderTarget(): WebGLRenderTarget | null {
    throw new Error('Method not implemented.')
  }
  getCurrentRenderTarget(): WebGLRenderTarget | null {
    throw new Error('Method not implemented.')
  }
  setRenderTarget(
    _renderTarget: WebGLRenderTarget | WebGLMultipleRenderTargets | null,
    _activeCubeFace?: number | undefined,
    _activeMipmapLevel?: number | undefined
  ): void {
    throw new Error('Method not implemented.')
  }
  readRenderTargetPixels(
    _renderTarget: WebGLRenderTarget | WebGLMultipleRenderTargets,
    _x: number,
    _y: number,
    _width: number,
    _height: number,
    _buffer: any,
    _activeCubeFaceIndex?: number | undefined
  ): void {
    throw new Error('Method not implemented.')
  }
  copyFramebufferToTexture(_position: Vector2, _texture: Texture, _level?: number | undefined): void {
    throw new Error('Method not implemented.')
  }
  copyTextureToTexture(_position: Vector2, _srcTexture: Texture, _dstTexture: Texture, _level?: number | undefined): void {
    throw new Error('Method not implemented.')
  }
  copyTextureToTexture3D(
    _sourceBox: Box3,
    _position: Vector3,
    _srcTexture: Texture,
    _dstTexture: Data3DTexture | DataArrayTexture,
    _level?: number | undefined
  ): void {
    throw new Error('Method not implemented.')
  }
  initTexture(_texture: Texture): void {
    throw new Error('Method not implemented.')
  }
  resetState(): void {
    throw new Error('Method not implemented.')
  }
  // @ts-ignore
  vr: boolean
  // @ts-ignore
  shadowMapEnabled: boolean
  // @ts-ignore
  shadowMapType: ShadowMapType
  // @ts-ignore
  shadowMapCullFace: CullFace
  supportsFloatTextures() {
    throw new Error('Method not implemented.')
  }
  supportsHalfFloatTextures() {
    throw new Error('Method not implemented.')
  }
  supportsStandardDerivatives() {
    throw new Error('Method not implemented.')
  }
  supportsCompressedTextureS3TC() {
    throw new Error('Method not implemented.')
  }
  supportsCompressedTexturePVRTC() {
    throw new Error('Method not implemented.')
  }
  supportsBlendMinMax() {
    throw new Error('Method not implemented.')
  }
  supportsVertexTextures() {
    throw new Error('Method not implemented.')
  }
  supportsInstancedArrays() {
    throw new Error('Method not implemented.')
  }
  enableScissorTest(_boolean: any) {
    throw new Error('Method not implemented.')
  }
}
