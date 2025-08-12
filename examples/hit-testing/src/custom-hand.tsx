import { DefaultXRHand, XRHitTest, XRSpace, useXRInputSourceStateContext } from '@react-three/xr'
import { onResults } from './app.js'

export const CustomHand = () => {
  const state = useXRInputSourceStateContext()

  return (
    <>
      <DefaultXRHand />
      <XRSpace space={state.inputSource.targetRaySpace}>
        <XRHitTest onResults={onResults.bind(null, state.inputSource.handedness)} />
      </XRSpace>
    </>
  )
}
