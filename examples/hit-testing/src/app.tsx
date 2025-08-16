import { Canvas } from '@react-three/fiber'
import { createXRStore, IfInSessionMode, XR } from '@react-three/xr'
import { Suspense } from 'react'
import { Matrix4 } from 'three'
import { CustomController } from './custom-controller.js'
import { CustomHand } from './custom-hand.js'
import { DomOverlay } from './dom-overlay.js'
import { Duck } from './duck.js'
import { Ducks } from './ducks.js'
import { HitTest } from './hit-test.js'

export let hitTestMatrices: Partial<Record<XRHandedness | 'duck', Matrix4 | undefined>> = {}

export function onResults(
  handedness: XRHandedness | 'duck',
  results: Array<XRHitTestResult>,
  getWorldMatrix: (target: Matrix4, hit: XRHitTestResult) => void,
) {
  if (results && results.length > 0 && results[0]) {
    hitTestMatrices[handedness] ??= new Matrix4()
    getWorldMatrix(hitTestMatrices[handedness], results[0])
  }
}

const xr_store = createXRStore({
  domOverlay: true,
  hitTest: true,
  anchors: true,
  layers: false,
  meshDetection: false,
  planeDetection: false,
  hand: CustomHand,
  controller: CustomController,
})

export function App() {
  return (
    <>
      <button onClick={() => xr_store.enterAR()}>Enter AR</button>

      <Canvas>
        <XR store={xr_store}>
          <directionalLight position={[1, 2, 1]} />
          <ambientLight />

          <IfInSessionMode allow={'immersive-ar'}>
            <HitTest />
            <Ducks />
            <DomOverlay />
          </IfInSessionMode>

          <IfInSessionMode deny={'immersive-ar'}>
            <Suspense fallback={null}>
              <Duck position={[0, -2, 0]} scale={2} />
            </Suspense>
          </IfInSessionMode>
        </XR>
      </Canvas>
    </>
  )
}
