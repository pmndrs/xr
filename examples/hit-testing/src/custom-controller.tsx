import { useFrame } from '@react-three/fiber'
import { Root, Text } from '@react-three/uikit'
import {
  DefaultXRController,
  XRHitTest,
  XRSpace,
  useXRHitTestSource,
  useXRInputSourceState,
  useXRInputSourceStateContext,
} from '@react-three/xr'
import { useRef, useState } from 'react'
import { Group } from 'three'
import { hitTestMatrices, onResults } from './app.js'
import { useTestDistanceToFloor } from './useTestDistanceToFloor.js'

const defaultRightControllerMessage = 'Press the A button to test distance to floor'
export const CustomController = () => {
  const [rightControllerText, setRightControllerText] = useState<string>(defaultRightControllerMessage)
  const [leftControllerPlacementEnabled, setLeftControllerPlacementEnabled] = useState<boolean>(false)
  const leftControllerRayRef = useRef<Group>(null)
  const isAPressed = useRef<boolean>(false)
  const isXPressed = useRef<boolean>(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const testDistance = useTestDistanceToFloor()

  const leftControllerHitTestSource = useXRHitTestSource(leftControllerRayRef)

  const state = useXRInputSourceStateContext()
  const rightController = useXRInputSourceState('controller', 'right')
  const leftController = useXRInputSourceState('controller', 'left')
  const isRightHand = state.inputSource.handedness === 'right'

  useFrame((_, __, frame) => {
    // Button press handling **********************
    if (rightController?.gamepad?.['a-button']?.state === 'pressed' && !isAPressed.current) {
      isAPressed.current = true
      testDistance().then((result) => {
        if (result !== undefined) {
          setRightControllerText(`Distance to Floor: ${result.toFixed(2)} meters`)
        } else {
          setRightControllerText('Unable to calculate distance. Try looking towards the floor.')
        }

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        timeoutRef.current = setTimeout(() => {
          setRightControllerText(defaultRightControllerMessage)
        }, 5000)
      })
    }

    if (leftController?.gamepad?.['x-button']?.state === 'pressed' && !isXPressed.current) {
      isXPressed.current = true
      setLeftControllerPlacementEnabled((x) => {
        const newValue = !x
        if (!newValue) {
          hitTestMatrices['left'] = undefined
        }
        return newValue
      })
    }

    if (leftController?.gamepad?.['x-button']?.state === 'default') {
      isXPressed.current = false
    }

    if (rightController?.gamepad?.['a-button']?.state === 'default') {
      isAPressed.current = false
    }

    // Conditional Hit-test handling**********************
    if (frame && leftControllerPlacementEnabled && leftControllerHitTestSource) {
      const results = frame.getHitTestResults(leftControllerHitTestSource.source)
      onResults('left', results, leftControllerHitTestSource.getWorldMatrix)
    }
  })

  const leftControllerText = `Press the X button to ${leftControllerPlacementEnabled ? 'disable' : 'enable'} placing with the left controller`

  return (
    <>
      <DefaultXRController />
      <Root transformTranslateY={-2.9} transformRotateX={-25}>
        <Text fontSize={2} color={'white'}>
          {isRightHand ? rightControllerText : leftControllerText}
        </Text>
      </Root>
      <XRSpace space={state.inputSource.targetRaySpace}>
        {isRightHand ? (
          <XRHitTest onResults={onResults.bind(null, state.inputSource.handedness)} />
        ) : (
          <group ref={leftControllerRayRef} />
        )}
      </XRSpace>
    </>
  )
}
