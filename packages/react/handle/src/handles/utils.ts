import { defaultApply, HandleOptions, HandleState } from '@pmndrs/handle'
import { useThree } from '@react-three/fiber'
import { useCallback } from 'react'
import { Object3D } from 'three'

type ControlsProto = {
  enabled: boolean
}

export function useApplyThatDisablesDefaultControls<T>(apply: HandleOptions<T>['apply']): HandleOptions<T>['apply'] {
  const controls = useThree((s) => s.controls as unknown as ControlsProto | undefined)
  return useCallback(
    (state: HandleState<T>, target: Object3D) => {
      if (controls != null && state.first) {
        controls.enabled = false
      }
      if (controls != null && state.last) {
        controls.enabled = true
      }
      return (apply ?? defaultApply)(state, target)
    },
    [apply, controls],
  )
}
