import { OrthographicCamera, PerspectiveCamera, Vector2, Vector2Tuple } from 'three'
import { StoreApi } from 'zustand/vanilla'
import { defaultScreenCameraApply, ScreenCameraStateAndFunctions } from './camera.js'
import { ScreenHandleStore } from './store.js'
import { average } from './utils.js'

const vector2Helper = new Vector2()
const initialHelper = new Vector2()

export class RotateScreenHandleStore extends ScreenHandleStore<Readonly<Vector2Tuple>> {
  constructor(
    store: StoreApi<ScreenCameraStateAndFunctions>,
    getCamera: () => PerspectiveCamera | OrthographicCamera,
    public filter: (map: ScreenHandleStore['map']) => boolean,
    public customApply?: typeof defaultScreenCameraApply,
    public speed?: number,
  ) {
    super(
      ([initialPitch, initialYaw], map) => {
        if (!this.filter(map)) {
          return
        }

        average(vector2Helper, map, 'currentScreenPosition')
        average(initialHelper, map, 'initialScreenPosition')

        vector2Helper.sub(initialHelper).multiplyScalar(-Math.PI * (this.speed ?? 1))

        const camera = getCamera()
        const aspect =
          camera instanceof PerspectiveCamera
            ? camera.aspect
            : (camera.right - camera.left) / (camera.top - camera.bottom)
        ;(this.customApply ?? defaultScreenCameraApply)(
          {
            pitch: initialPitch - vector2Helper.y,
            yaw: initialYaw + vector2Helper.x * aspect,
          },
          store,
        )
      },
      () => [store.getState().pitch, store.getState().yaw],
    )
  }
}
