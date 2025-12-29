import { getVoidObject, WheelEvent } from '@pmndrs/pointer-events'
import { PerspectiveCamera, OrthographicCamera, Scene, Vector3 } from 'three'
import { clamp } from 'three/src/math/MathUtils.js'
import { StoreApi } from 'zustand'
import {
  applyDampedScreenCameraState,
  applyScreenCameraState,
  createScreenCameraStore,
  ScreenCameraState,
  ScreenCameraStateAndFunctions,
} from './camera.js'
import { filterForOnePointerLeftClick, filterForOnePointerRightClickOrTwoPointer } from './index.js'
import { PanScreenHandleStore } from './pan.js'
import { RotateScreenHandleStore } from './rotate.js'
import { ZoomScreenHandleStore } from './zoom.js'

const vectorHelper = new Vector3()

const DEFAULT_ZOOM_SPEED = 0.01
const DEFAULT_YAW_SPEED = 0.002
const DEFAULT_PITCH_SPEED = 0.02
const DEFAULT_PAN_SPEED = 0.0005

export interface MapHandlesWheelOptions {
  zoom?: number | false
  yaw?: number | false
  pitch?: number | false
  pan?: number | false
}

export function defaultMapHandlesScreenCameraApply(
  update: Partial<ScreenCameraState>,
  store: StoreApi<ScreenCameraState>,
) {
  if (update.pitch != null) {
    update.pitch = clamp(update.pitch, -Math.PI / 2, 0)
  }
  store.setState(update)
}

/**
 * Map-style camera controls with pan, rotate, and zoom.
 *
 * To prevent browser gestures from interfering, set `touch-action: none`
 * on the canvas container for touch devices.
 */
export class MapHandles {
  public readonly rotate: RotateScreenHandleStore
  public readonly pan: PanScreenHandleStore
  public readonly zoom: ZoomScreenHandleStore

  private readonly store: StoreApi<ScreenCameraStateAndFunctions>
  private readonly getCamera: () => PerspectiveCamera | OrthographicCamera
  private readonly wheelOptions: Required<MapHandlesWheelOptions>
  private updateDamping: (deltaTime: number) => void
  private damping: boolean | number = false

  constructor(
    canvas: HTMLCanvasElement,
    camera: (() => PerspectiveCamera | OrthographicCamera) | PerspectiveCamera | OrthographicCamera,
    store?: StoreApi<ScreenCameraStateAndFunctions>,
    wheel?: MapHandlesWheelOptions,
  ) {
    if (store == null) {
      store = createScreenCameraStore()
      const resolvedCamera = typeof camera === 'function' ? camera() : camera
      store.getState().setCameraPosition(...resolvedCamera.getWorldPosition(vectorHelper).toArray())
    }
    this.store = store
    this.getCamera = typeof camera === 'function' ? camera : () => camera
    this.wheelOptions = {
      zoom: wheel?.zoom ?? DEFAULT_ZOOM_SPEED,
      yaw: wheel?.yaw ?? DEFAULT_YAW_SPEED,
      pitch: wheel?.pitch ?? DEFAULT_PITCH_SPEED,
      pan: wheel?.pan ?? DEFAULT_PAN_SPEED,
    }
    this.updateDamping = applyDampedScreenCameraState(store, this.getCamera, () => this.damping)
    this.rotate = new RotateScreenHandleStore(
      store,
      this.getCamera,
      filterForOnePointerRightClickOrTwoPointer,
      defaultMapHandlesScreenCameraApply,
    )
    this.pan = new PanScreenHandleStore(
      canvas,
      store,
      this.getCamera,
      filterForOnePointerLeftClick,
      defaultMapHandlesScreenCameraApply,
      1,
      'xz',
    )
    this.zoom = new ZoomScreenHandleStore(
      store,
      this.getCamera,
      undefined,
      defaultMapHandlesScreenCameraApply,
      undefined,
      undefined,
      true, // skipWheel - MapHandles handles wheel events
    )
  }

  getStore() {
    return this.store
  }

  update(deltaTime: number): void {
    this.rotate.update()
    this.pan.update()
    this.zoom.update()
    this.updateDamping(deltaTime)
  }

  bindWheel(scene: Scene) {
    const voidObject = getVoidObject(scene)
    const onWheel = this.onWheel.bind(this)
    voidObject.addEventListener('wheel', onWheel)
    return () => voidObject.removeEventListener('wheel', onWheel)
  }

  /**
   * Handles wheel events for trackpad/mouse gestures:
   * - Vertical scroll → zoom
   * - Horizontal scroll → yaw (rotate)
   * - Ctrl + scroll (pinch) → pitch (tilt angle)
   * - Shift + scroll → pan
   *
   * Note: There's no reliable cross-browser way to distinguish mouse wheel from trackpad.
   * @see https://github.com/w3c/uievents/issues/337
   */
  private onWheel(e: WheelEvent) {
    const { deltaX, deltaY, ctrlKey, shiftKey } = e
    if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return

    const state = this.store.getState()

    if (ctrlKey && this.wheelOptions.pitch !== false) {
      ;(e.nativeEvent as globalThis.WheelEvent).preventDefault?.()
      this.applyPitch(state, deltaY)
    } else if (shiftKey && this.wheelOptions.pan !== false) {
      ;(e.nativeEvent as globalThis.WheelEvent).preventDefault?.()
      this.applyPan(state, deltaX, deltaY)
    } else if (this.wheelOptions.zoom !== false || this.wheelOptions.yaw !== false) {
      ;(e.nativeEvent as globalThis.WheelEvent).preventDefault?.()
      this.applyZoomAndYaw(state, deltaX, deltaY)
    }
  }

  private applyPan(state: ScreenCameraStateAndFunctions, deltaX: number, deltaY: number) {
    const speed = this.wheelOptions.pan as number
    const panX = deltaX * speed * state.distance
    const panZ = deltaY * speed * state.distance
    const cosYaw = Math.cos(state.yaw)
    const sinYaw = Math.sin(state.yaw)
    const [ox, oy, oz] = state.origin
    defaultMapHandlesScreenCameraApply(
      {
        origin: [ox + panX * cosYaw + panZ * sinYaw, oy, oz - panX * sinYaw + panZ * cosYaw],
      },
      this.store,
    )
  }

  private applyPitch(state: ScreenCameraStateAndFunctions, deltaY: number) {
    const speed = this.wheelOptions.pitch as number
    defaultMapHandlesScreenCameraApply(
      {
        pitch: state.pitch - deltaY * speed,
      },
      this.store,
    )
  }

  private applyZoomAndYaw(state: ScreenCameraStateAndFunctions, deltaX: number, deltaY: number) {
    const update: Partial<ScreenCameraState> = {}
    const { yaw, zoom } = this.wheelOptions
    if (Math.abs(deltaX) >= 1 && yaw !== false) {
      update.yaw = state.yaw - deltaX * yaw
    }
    if (Math.abs(deltaY) >= 1 && zoom !== false) {
      update.distance = state.distance / Math.pow(0.95, deltaY * zoom)
    }
    defaultMapHandlesScreenCameraApply(update, this.store)
  }

  bind(scene: Scene, damping: boolean | number = false) {
    const unbindRotate = this.rotate.bind(scene)
    const unbindPan = this.pan.bind(scene)
    const unbindZoom = this.zoom.bind(scene)

    const voidObject = getVoidObject(scene)
    const onWheel = this.onWheel.bind(this)
    voidObject.addEventListener('wheel', onWheel)

    let unsubscribeCamera: (() => void) | undefined
    if (damping === false) {
      unsubscribeCamera = applyScreenCameraState(this.store, this.getCamera)
    }
    this.damping = damping
    return () => {
      unbindRotate()
      unbindPan()
      unbindZoom()
      voidObject.removeEventListener('wheel', onWheel)
      unsubscribeCamera?.()
    }
  }
}

/**
 * @deprecated use MapHandles instead
 */
export const MapControls = MapHandles
