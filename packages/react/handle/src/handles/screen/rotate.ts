import { useStore } from '@react-three/fiber'
import { useRef } from 'react'
import { Vector2, Vector2Tuple } from 'three'
import { StoreApi } from 'zustand/vanilla'
import { ScreenHandleStore, useScreenHandleStore } from './store.js'
import { defaultScreenCameraApply, ScreenCameraState } from './camera.js'
import { average } from './utils.js'

const vector2Helper = new Vector2()

export type ScreenCameraRotateHandleProperties = { speed?: number; enabled?: boolean } | boolean

const initialHelper = new Vector2()

export function useScreenCameraRotateHandle(
  store: StoreApi<ScreenCameraState>,
  filter: (map: ScreenHandleStore['map']) => boolean,
  speed: number = 1,
  enabled: boolean = true,
  apply = defaultScreenCameraApply,
) {
  const speedRef = useRef(speed)
  speedRef.current = speed

  const applyRef = useRef(apply)
  applyRef.current = apply

  const filterRef = useRef(filter)
  filterRef.current = filter

  const fiberStore = useStore()

  useScreenHandleStore<Readonly<Vector2Tuple>>(
    ([initialRotationX, initialRotationY], map) => {
      if (!filterRef.current(map)) {
        return
      }

      average(vector2Helper, map, 'currentScreenPosition')
      average(initialHelper, map, 'initialScreenPosition')

      vector2Helper.sub(initialHelper).multiplyScalar(-Math.PI * speedRef.current)

      applyRef.current(
        {
          rotationX: vector2Helper.y + initialRotationX,
          rotationY: vector2Helper.x * fiberStore.getState().viewport.aspect + initialRotationY,
        },
        store,
      )
    },
    () => [store.getState().rotationX, store.getState().rotationY],
    [store, fiberStore],
    enabled,
  )
}
