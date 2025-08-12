import { useFrame } from '@react-three/fiber'
import {
  DefaultXRController,
  XRHitTest,
  XRSpace,
  useXRInputSourceState,
  useXRInputSourceStateContext,
} from '@react-three/xr'
import { useState } from 'react'
import { onResults } from './app.js'

export const CustomController = () => {
  const [allowRightHandHitTesting, setAllowRightHandHitTesting] = useState(false)
  const state = useXRInputSourceStateContext()
  const rightController = useXRInputSourceState('controller', 'right')
  const isLeftHanded = state.inputSource.handedness === 'left'

  useFrame(() => {
    if (rightController?.gamepad?.['a-button']?.state === 'pressed') {
      setAllowRightHandHitTesting((prev) => !prev)
    }
  })

  return (
    <>
      <DefaultXRController />
      {(isLeftHanded || allowRightHandHitTesting) && (
        <XRSpace space={state.inputSource.targetRaySpace}>
          <XRHitTest onResults={onResults.bind(null, state.inputSource.handedness)} />
        </XRSpace>
      )}
    </>
  )
}
