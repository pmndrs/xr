import { getVoidObject, PointerEventsMap, WheelEvent } from '@pmndrs/pointer-events'
import {
  Object3D,
  Object3DEventMap,
  OrthographicCamera,
  PerspectiveCamera,
  Scene,
  Vector2,
  Vector3,
  Vector3Tuple,
} from 'three'
import { StoreApi } from 'zustand/vanilla'
import { defaultScreenCameraApply, ScreenCameraState, ScreenCameraStateAndFunctions } from './camera.js'
import { ScreenHandleStore } from './store.js'
import { convertScreenSpaceMovementToGlobalPan } from './utils.js'

const resultHelper = new Vector3()
const centerHelper = new Vector2()

export class ZoomScreenHandleStore extends ScreenHandleStore<{ distance: number; origin: Readonly<Vector3Tuple> }> {
  constructor(
    private readonly store: StoreApi<ScreenCameraStateAndFunctions>,
    private readonly getCamera: () => OrthographicCamera | PerspectiveCamera,
    public filter?: (map: ScreenHandleStore['map']) => boolean,
    public customApply?: typeof defaultScreenCameraApply,
    public speed?: number,
    public zoomToPointer?: boolean,
  ) {
    super(
      ({ distance: initialDistance, origin: initialOrigin }, map) => {
        if (map.size < 2 || (this.filter != null && !this.filter(map))) {
          return
        }
        const [p1, p2] = map.values()
        const initialPointerDistance = p1.initialScreenPosition.distanceTo(p2.initialScreenPosition)
        const currentPointerDistance = p1.currentScreenPosition.distanceTo(p2.currentScreenPosition)

        const zoomFactor = currentPointerDistance / initialPointerDistance

        const update: Partial<ScreenCameraState> = {
          distance: initialDistance / zoomFactor,
        }

        if (this.zoomToPointer ?? false) {
          centerHelper.copy(p1.currentScreenPosition).add(p2.currentScreenPosition).multiplyScalar(0.5)
          update.origin = computeOriginFromZoomToPoint(
            centerHelper,
            store.getState(),
            initialOrigin,
            getCamera(),
            zoomFactor,
          )
        }

        ;(this.customApply ?? defaultScreenCameraApply)(update, store)
      },
      () => ({ distance: store.getState().distance, origin: store.getState().origin }),
    )
  }

  private onWheel(e: WheelEvent) {
    const zoomFactor = Math.pow(0.95, (this.speed ?? 1) * e.deltaY * 0.01)
    const update: Partial<ScreenCameraState> = {
      distance: this.store.getState().distance / zoomFactor,
    }
    if (e.intersection.details.type === 'screen-ray' && (this.zoomToPointer ?? false)) {
      const state = this.store.getState()
      update.origin = computeOriginFromZoomToPoint(
        e.intersection.details.screenPoint,
        state,
        state.origin,
        this.getCamera(),
        zoomFactor,
      )
    }

    ;(this.customApply ?? defaultScreenCameraApply)(update, this.store)
  }

  bind(scene: Scene): () => void {
    const voidObject = getVoidObject(scene) as Object3D<Object3DEventMap & PointerEventsMap>
    const fn = this.onWheel.bind(this)
    voidObject.addEventListener('wheel', fn)

    const unbind = super.bind(scene)
    return () => {
      unbind()
      voidObject.removeEventListener('wheel', fn)
    }
  }
}

const vector2Helper = new Vector2()

function computeOriginFromZoomToPoint(
  point: Vector2,
  state: ScreenCameraStateAndFunctions,
  origin: Readonly<Vector3Tuple>,
  camera: OrthographicCamera | PerspectiveCamera,
  zoomFactor: number,
) {
  vector2Helper.copy(point).multiplyScalar(-(zoomFactor - 1) / zoomFactor)
  convertScreenSpaceMovementToGlobalPan(state, camera, vector2Helper, resultHelper, 1, 'screen')
  const [x, y, z] = origin
  resultHelper.x += x
  resultHelper.y += y
  resultHelper.z += z

  return resultHelper.toArray()
}
