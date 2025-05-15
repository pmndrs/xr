import { Environment, Gltf } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { createXRStore, XR, useXR, XRControllerModel, XRSpace } from '@react-three/xr'
import { Suspense } from 'react'
import { HandWithWatch } from './hand.js'

const store = createXRStore({
  secondaryInputSources: true,
  foveation: 0,
  hand: { right: HandWithWatch, left: false },
  controller: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const hasHands = useXR((xr) => xr.inputSourceStates.find((state) => state.type === 'hand') != null)
    return (
      <>
        <XRSpace space="target-ray-space">
          <Suspense>
            <Gltf
              rotation-x={(-20 / 180) * Math.PI}
              position={[0, -0.03, 0.005]}
              rotation-y={Math.PI}
              scale={0.00011}
              src="pistol.glb"
            />
          </Suspense>
        </XRSpace>
        {!hasHands && <XRControllerModel />}
      </>
    )
  },
})

export function App() {
  return (
    <>
      <button onClick={() => store.enterAR()}>Enter AR</button>
      <Canvas style={{ width: '100%', flexGrow: 1 }}>
        <XR store={store}>
          <ambientLight intensity={2} />
          <directionalLight intensity={2} position={[1, 1, 1]} />
          <Suspense>
            <Environment preset="apartment" />
          </Suspense>
        </XR>
      </Canvas>
    </>
  )
}
