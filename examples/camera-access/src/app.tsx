import { Canvas, useFrame } from '@react-three/fiber'
import { createXRStore, XR, XROrigin } from '@react-three/xr'
import { RotatingBox } from './box'

const store = createXRStore()

export function App() {
  return (
    <>
      <button onClick={() => store.enterAR()}>Enter AR</button>
      <Canvas style={{ width: '100%', flexGrow: 1 }}>
        <XR store={store}>
          <XROrigin />
          <hemisphereLight position={[0.5, 1, 0.25]} color={0xffffbb} groundColor={0x080820} intensity={3}/>
          <RotatingBox/>
        </XR>
      </Canvas>
    </>
  )
}
