import { Canvas } from '@react-three/fiber'
import {
  XRSpace,
  createXRStore,
  XR,
  XRHitTest,
  XRControllerModel,
  XRHandModel,
  GetWorldMatrixFromXRHitTest,
  useXRInputSourceEvent,
  useXRRequestHitTest,
  useXRAnchor,
  useXRInputSourceStateContext,
} from '@react-three/xr'
import { useEffect, useRef } from 'react'
import { Matrix4, Mesh, Vector3 } from 'three'
import { create } from 'zustand'

const matrixHelper = new Matrix4()

function onResults(handedness: XRHandedness, results: XRHitTestResult[], getWorldMatrix: GetWorldMatrixFromXRHitTest) {
  ;(handedness === 'left' ? useLeftPoints : useRightPoints).setState(
    results
      .map((result) => {
        if (!getWorldMatrix(matrixHelper, result)) {
          return undefined
        }
        return new Vector3().setFromMatrixPosition(matrixHelper)
      })
      .filter((vector) => vector != null),
  )
}

const store = createXRStore({
  hand: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const state = useXRInputSourceStateContext()
    return (
      <>
        <XRHandModel />
        <XRSpace space={state.inputSource.targetRaySpace}>
          <XRHitTest onResults={onResults.bind(null, state.inputSource.handedness)} />
        </XRSpace>
      </>
    )
  },
  controller: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const state = useXRInputSourceStateContext()
    return (
      <>
        <XRControllerModel />
        <XRHitTest
          space={state.inputSource.targetRaySpace}
          onResults={onResults.bind(null, state.inputSource.handedness)}
        />
      </>
    )
  },
  screenInput: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const state = useXRInputSourceStateContext()
    return (
      <XRHitTest
        space={state.inputSource.targetRaySpace}
        onResults={onResults.bind(null, state.inputSource.handedness)}
      />
    )
  },
})

const useLeftPoints = create<Array<Vector3>>(() => [])
const useRightPoints = create<Array<Vector3>>(() => [])

export function App() {
  const leftLength = useLeftPoints((s) => s.length)
  const rightLength = useRightPoints((s) => s.length)
  return (
    <>
      <button onClick={() => store.enterAR()}>Enter AR</button>
      <Canvas style={{ width: '100%', flexGrow: 1 }}>
        <XR store={store}>
          <ambientLight />
          {new Array(leftLength).fill(undefined).map((_, i) => (
            <Point left key={i} index={i} />
          ))}
          {new Array(rightLength).fill(undefined).map((_, i) => (
            <Point key={i} index={i} />
          ))}
          <Anchors />
        </XR>
      </Canvas>
    </>
  )
}

function Anchors() {
  const [anchor, requestAnchor] = useXRAnchor()
  const requestHitTest = useXRRequestHitTest()
  useXRInputSourceEvent(
    'all',
    'select',
    async (e) => {
      const result = await requestHitTest(e.inputSource.targetRaySpace)
      if (result == null || result.results.length === 0) {
        return
      }
      requestAnchor({ relativeTo: 'hit-test-result', hitTestResult: result.results[0] })
    },
    [requestHitTest, requestAnchor],
  )
  if (anchor == null) {
    return null
  }
  return (
    <XRSpace space={anchor.anchorSpace}>
      <mesh scale={0.1}>
        <boxGeometry />
      </mesh>
    </XRSpace>
  )
}

function Point({ index, left }: { left?: boolean; index: number }) {
  const ref = useRef<Mesh>(null)
  useEffect(
    () =>
      (left ? useLeftPoints : useRightPoints).subscribe((state) => {
        if (index >= state.length) {
          return
        }
        ref.current!.position.copy(state[index])
      }),
    [index, left],
  )
  return (
    <mesh scale={0.05} ref={ref}>
      <sphereGeometry />
      <meshBasicMaterial />
    </mesh>
  )
}
