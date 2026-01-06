import {
  defaultTouchPointerOpacity,
  PointerCursorModel,
  useTouchPointer,
  useXRInputSourceStateContext,
  XRHandModel,
  XRSpace,
} from '@react-three/xr'
import { Suspense, useRef } from 'react'
import { Object3D } from 'three'

export function CustomHand() {
  const state = useXRInputSourceStateContext('hand')
  const pinkyFingerRef = useRef<Object3D>(null)
  const pointer = useTouchPointer(pinkyFingerRef, state)

  return (
    <>
      <XRSpace ref={pinkyFingerRef} space={state.inputSource.hand.get('pinky-finger-tip')!} />
      <Suspense>
        <XRHandModel />
      </Suspense>
      <PointerCursorModel pointer={pointer} opacity={defaultTouchPointerOpacity} />
    </>
  )
}
