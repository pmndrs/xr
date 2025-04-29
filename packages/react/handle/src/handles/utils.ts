import { defaultApply, HandleOptions, HandlesProperties, HandleState } from '@pmndrs/handle'
import { useThree } from '@react-three/fiber'
import { useCallback } from 'react'
import { Object3D, Vector2Tuple } from 'three'

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

export function disableProperties(properties: HandlesProperties | undefined): HandlesProperties | undefined {
  if (properties === false) {
    return false
  }
  if (properties === true || properties === undefined || properties === 'disabled') {
    return 'disabled'
  }
  if (typeof properties === 'string') {
    const result: HandlesProperties = {
      x: false,
      y: false,
      z: false,
      e: false,
    }
    result[properties] = 'disabled'
    return result
  }
  return {
    x: disabledOrRemoved(properties.x),
    y: disabledOrRemoved(properties.y),
    z: disabledOrRemoved(properties.z),
    e: disabledOrRemoved(properties.e),
  }
}

function disabledOrRemoved(value: boolean | Vector2Tuple | 'disabled' | undefined) {
  if (value === false) {
    return false
  }
  return 'disabled' as const
}
