import { OrthographicCamera, PerspectiveCamera, Scene, Vector2, Vector3, Vector3Tuple } from 'three'
import { StoreApi } from 'zustand/vanilla'
import { defaultScreenCameraApply, ScreenCameraStateAndFunctions } from './camera.js'
import { ScreenHandleStore } from './store.js'
import { average, convertScreenSpaceMovementToGlobalPan } from './utils.js'

const vector2Helper = new Vector2()
const initialHelper = new Vector2()

const resultHelper = new Vector3()

export class PanScreenHandleStore extends ScreenHandleStore<Readonly<Vector3Tuple>> {
  constructor(
    private readonly canvas: HTMLCanvasElement,
    store: StoreApi<ScreenCameraStateAndFunctions>,
    getCamera: () => PerspectiveCamera | OrthographicCamera,
    public filter: (map: ScreenHandleStore['map']) => boolean,
    public customApply?: typeof defaultScreenCameraApply,
    public speed?: number,
    public space?: 'screen' | 'xz',
  ) {
    super(
      (initial, map) => {
        if (!this.filter(map)) {
          return
        }

        average(vector2Helper, map, 'currentScreenPosition')
        average(initialHelper, map, 'initialScreenPosition')

        vector2Helper.sub(initialHelper)

        convertScreenSpaceMovementToGlobalPan(
          store.getState(),
          getCamera(),
          vector2Helper,
          resultHelper,
          this.speed ?? 1,
          this.space ?? 'screen',
        )

        const [x, y, z] = initial
        resultHelper.x += x
        resultHelper.y += y
        resultHelper.z += z
        ;(this.customApply ?? defaultScreenCameraApply)({ origin: resultHelper.toArray() }, store)
      },
      () => store.getState().origin,
    )
  }

  bind(scene: Scene): () => void {
    const fn = (e: MouseEvent) => e.preventDefault()
    this.canvas.addEventListener('contextmenu', fn)
    const superUnbind = super.bind(scene)
    return () => {
      superUnbind()
      this.canvas.removeEventListener('contextmenu', fn)
    }
  }
}
