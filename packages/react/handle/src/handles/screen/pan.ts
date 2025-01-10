import { useStore, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { Euler, PerspectiveCamera, Quaternion, Vector2, Vector3, Vector3Tuple } from 'three'
import { StoreApi } from 'zustand/vanilla'
import { computeScreenCameraTransformation, defaultScreenCameraApply, ScreenCameraState } from './camera.js'
import { ScreenHandleStore, useScreenHandleStore } from './store.js'
import { average, convertScreenSpaceMovementToGlobalPan } from './utils.js'

const vector2Helper = new Vector2()
const initialHelper = new Vector2()

const resultHelper = new Vector3()

export function useScreenCameraPanHandle(
  store: StoreApi<ScreenCameraState>,
  filter: (map: ScreenHandleStore['map']) => boolean,
  speed: number = 1,
  enabled: boolean = true,
  space: 'screen' | 'xz' = 'screen',
  apply = defaultScreenCameraApply,
) {
  const speedRef = useRef(speed)
  speedRef.current = speed

  const applyRef = useRef(apply)
  applyRef.current = apply

  const canvas = useThree((s) => s.gl.domElement)
  useEffect(
    () => (enabled ? canvas.addEventListener('contextmenu', (e) => e.preventDefault()) : undefined),
    [enabled, canvas],
  )

  const fiberStore = useStore()

  useScreenHandleStore<Readonly<Vector3Tuple>>(
    (initial, map) => {
      if (!filter(map)) {
        return
      }

      average(vector2Helper, map, 'currentScreenPosition')
      average(initialHelper, map, 'initialScreenPosition')

      vector2Helper.sub(initialHelper)

      convertScreenSpaceMovementToGlobalPan(
        store.getState(),
        fiberStore.getState().camera,
        vector2Helper,
        resultHelper,
        speedRef.current,
        space,
      )

      const [x, y, z] = initial
      resultHelper.x += x
      resultHelper.y += y
      resultHelper.z += z

      applyRef.current({ origin: resultHelper.toArray() }, store)
    },
    () => store.getState().origin,
    [store, fiberStore],
    enabled,
  )
}
