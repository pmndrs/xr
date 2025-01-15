import { OrthographicCamera, PerspectiveCamera, Vector2, Vector2Tuple } from 'three'
import { StoreApi } from 'zustand/vanilla'
import { ScreenHandleStore } from './store.js'
import { defaultScreenCameraApply, ScreenCameraStateAndFunctions } from './camera.js'
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
      ([initialRotationX, initialRotationY], map) => {
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
            rotationX: vector2Helper.y + initialRotationX,
            rotationY: vector2Helper.x * aspect + initialRotationY,
          },
          store,
        )
      },
      () => [store.getState().rotationX, store.getState().rotationY],
    )
  }
}
