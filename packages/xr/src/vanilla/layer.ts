import { BufferGeometry, Mesh, MeshBasicMaterial, WebGLRenderer, WebGLRenderTarget } from 'three'
import {
  createXRLayer,
  createXRLayerGeometry,
  getXRLayerSrcTexture,
  setupXRImageLayer,
  updateXRLayerProperties,
  updateXRLayerTransform,
  waitForXRLayerSrcSize,
  XRLayerEntry,
  XRLayerOptions,
  XRLayerProperties,
  XRLayerSrc,
} from '../layer.js'
import { XRState, XRStore } from '../store.js'

export class XRLayer extends Mesh<BufferGeometry, MeshBasicMaterial> {
  private layerEntry?: XRLayerEntry
  private cleanup?: () => void
  private cleanupSubscription?: () => void

  constructor(
    private readonly store: XRStore<any>,
    renderer: WebGLRenderer,
    private readonly options: XRLayerOptions & { src: XRLayerSrc },
    private properties: XRLayerProperties = {},
    private layerRenderOrder: number = 0,
  ) {
    super(createXRLayerGeometry(options.shape ?? 'quad', properties), new MeshBasicMaterial({ toneMapped: false }))
    this.frustumCulled = false //to prevent onBeforeRender from not beeing called
    let aborted = false
    this.cleanup = () => (aborted = true)
    waitForXRLayerSrcSize(options.src).then(() => {
      if (aborted) {
        return
      }
      const update = ({ session, originReferenceSpace }: XRState<any>, prevState?: XRState<any>) => {
        if (originReferenceSpace == null) {
          return
        }
        if (prevState != null && session === prevState.session) {
          return
        }
        this.cleanup?.()
        const layersEnabled = session?.enabledFeatures?.includes('layers') === true
        this.material.colorWrite = !layersEnabled
        this.renderOrder = layersEnabled ? -Infinity : 0

        if (!layersEnabled) {
          this.material.colorWrite = true
          const texture = getXRLayerSrcTexture(options.src)
          this.material.map = texture
          this.material.needsUpdate = true
          this.cleanup = options.src instanceof WebGLRenderTarget ? () => {} : () => texture.dispose()
          return
        }

        this.material.map = null
        const layer = createXRLayer(
          options.src,
          store.getState(),
          originReferenceSpace,
          renderer.xr,
          this,
          options,
          properties,
        )
        if (layer == null) {
          this.cleanup = () => {}
          return
        }
        const layerEntry = (this.layerEntry = { layer, renderOrder: this.layerRenderOrder, object3D: this })
        store.addLayerEntry(this.layerEntry)
        if (options.src instanceof HTMLVideoElement || options.src instanceof WebGLRenderTarget) {
          this.cleanup = () => this.store.removeLayerEntry(layerEntry)
          return
        }
        const cleanupXRImageLayer = setupXRImageLayer(renderer, store, layer, options.src)
        this.cleanup = () => {
          this.store.removeLayerEntry(layerEntry)
          cleanupXRImageLayer()
        }
      }
      update(store.getState())
      this.cleanupSubscription = store.subscribe(update)
    })
  }

  setLayerRenderOrder(layerRenderOrder: number): void {
    this.layerRenderOrder = layerRenderOrder
    if (this.layerEntry != null) {
      this.layerEntry.renderOrder = layerRenderOrder
    }
  }

  setProperties(properties: XRLayerProperties = {}) {
    this.properties = properties
    this.geometry.dispose()
    this.geometry = createXRLayerGeometry(this.options.shape ?? 'quad', properties)
    if (this.layerEntry != null) {
      updateXRLayerProperties(this.layerEntry.layer, properties)
    }
  }

  destroy() {
    this.cleanupSubscription?.()
    this.cleanup?.()
  }

  onBeforeRender(): void {
    if (this.layerEntry == null) {
      return
    }
    updateXRLayerTransform(this.store.getState(), this.layerEntry?.layer, this.properties.centralAngle, this)
  }
}
