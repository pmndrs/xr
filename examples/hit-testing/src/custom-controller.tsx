import { useFrame } from '@react-three/fiber'
import { Root, Text } from '@react-three/uikit'
import {
  DefaultXRController,
  XRHitTest,
  XRSpace,
  useXRInputSourceState,
  useXRInputSourceStateContext,
} from '@react-three/xr'
import { useRef, useState } from 'react'
import { onResults } from './app.js'
import { useTestDistanceToFloor } from './useTestDistanceToFloor.js'

const defaultControllerMessage = 'Press the A button to test distance to floor'
export const CustomController = () => {
  const [controllerText, setControllerText] = useState<string>(defaultControllerMessage)
  const isPressed = useRef<boolean>(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const testDistance = useTestDistanceToFloor()

  const state = useXRInputSourceStateContext()
  const rightController = useXRInputSourceState('controller', 'right')
  const isRightHand = state.inputSource.handedness === 'right'

  useFrame(() => {
    if (rightController?.gamepad?.['a-button']?.state === 'pressed' && !isPressed.current) {
      testDistance().then((result) => {
        if (result !== undefined) {
          setControllerText(`Distance to Floor: ${result.toFixed(2)} meters`)
        } else {
          setControllerText('Unable to calculate distance. Try looking towards the floor.')
        }

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        timeoutRef.current = setTimeout(() => {
          setControllerText(defaultControllerMessage)
        }, 5000)
      })
      isPressed.current = true
    }

    if (rightController?.gamepad?.['a-button']?.state === 'default') {
      isPressed.current = false
    }
  })

  return (
    <>
      <DefaultXRController />
      {isRightHand && (
        <Root transformTranslateY={-2.9} transformRotateX={-25}>
          <Text fontSize={2} color={'white'}>
            {controllerText}
          </Text>
        </Root>
      )}
      <XRSpace space={state.inputSource.targetRaySpace}>
        <XRHitTest onResults={onResults.bind(null, state.inputSource.handedness)} />
      </XRSpace>
    </>
  )
}
