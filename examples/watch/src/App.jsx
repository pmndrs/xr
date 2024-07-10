import { Canvas } from '@react-three/fiber'
import { XR, createXRStore } from '@react-three/xr'
import { HandWithWatch } from './Hand.jsx'

const store = createXRStore({
  hand: { right: HandWithWatch, left: false },
})

export default function App() {
  return (
    <>
      <button onClick={() => store.enterAR()}>Enter AR</button>
      <Canvas shadows camera={{ position: [0, 0, 10], fov: 25 }}>
        <XR store={store}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 10]} />
        </XR>
      </Canvas>
    </>
  )
}
