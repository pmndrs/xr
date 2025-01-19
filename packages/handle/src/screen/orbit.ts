import { RotateScreenHandleStore } from './rotate.js'
import { ZoomScreenHandleStore } from './zoom.js'
import { PanScreenHandleStore } from './pan.js'
import { filterForOnePointerLeftClick, filterForOnePointerRightClickOrTwoPointer } from './index.js'
import { OrthographicCamera, PerspectiveCamera, Scene, Vector3 } from 'three'
import { StoreApi } from 'zustand'
import {
  applyScreenCameraState,
  createScreenCameraStore,
  ScreenCameraState,
  ScreenCameraStateAndFunctions,
} from './camera.js'
import { clamp } from 'three/src/math/MathUtils.js'

export function defaultOrbitHandlesScreenCameraApply(
  update: Partial<ScreenCameraState>,
  store: StoreApi<ScreenCameraState>,
) {
  if (update.pitch != null) {
    console.log(update.pitch)
    update.pitch = clamp(update.pitch, -Math.PI / 2, Math.PI / 2)
  }
  store.setState(update)
}

const vectorHelper = new Vector3()

export class OrbitHandles {
  public readonly rotate: RotateScreenHandleStore
  public readonly pan: PanScreenHandleStore
  public readonly zoom: ZoomScreenHandleStore

  private readonly store: StoreApi<ScreenCameraStateAndFunctions>
  private readonly getCamera: () => PerspectiveCamera | OrthographicCamera

  constructor(
    canvas: HTMLCanvasElement,
    camera: (() => PerspectiveCamera | OrthographicCamera) | PerspectiveCamera | OrthographicCamera,
    store?: StoreApi<ScreenCameraStateAndFunctions>,
  ) {
    if (store == null) {
      store = createScreenCameraStore()
      const resolvedCamera = typeof camera === 'function' ? camera() : camera
      store.getState().setCameraPosition(...resolvedCamera.getWorldPosition(vectorHelper).toArray())
    }
    this.store = store
    this.getCamera = typeof camera === 'function' ? camera : () => camera
    this.rotate = new RotateScreenHandleStore(
      store,
      this.getCamera,
      filterForOnePointerLeftClick,
      defaultOrbitHandlesScreenCameraApply,
    )
    this.pan = new PanScreenHandleStore(
      canvas,
      store,
      this.getCamera,
      filterForOnePointerRightClickOrTwoPointer,
      defaultOrbitHandlesScreenCameraApply,
    )
    this.zoom = new ZoomScreenHandleStore(store, this.getCamera, undefined, defaultOrbitHandlesScreenCameraApply)
  }

  getStore() {
    return this.store
  }

  update(): void {
    this.rotate.update()
    this.pan.update()
    this.zoom.update()
  }

  bind(scene: Scene) {
    const unbindRotate = this.rotate.bind(scene)
    const unbindPan = this.pan.bind(scene)
    const unbindZoom = this.zoom.bind(scene)
    const unsubscribeCamera = applyScreenCameraState(this.store, this.getCamera)
    return () => {
      unbindRotate()
      unbindPan()
      unbindZoom()
      unsubscribeCamera()
    }
  }
}

/**
 * @deprecated use OrbitHandles instead
 */
export const OrbitControls = OrbitHandles
