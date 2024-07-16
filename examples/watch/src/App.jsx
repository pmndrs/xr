import { Canvas } from '@react-three/fiber'
import { XR, createXRStore } from '@react-three/xr'
import { HandWithWatch } from './Hand.jsx'

const store = createXRStore({
  hand: { right: HandWithWatch, left: false },
})

export default function App() {
  return (
    <>
      <button
        style={{
          position: 'absolute',
          zIndex: 10000,
          background: 'black',
          borderRadius: '0.5rem',
          border: 'none',
          fontWeight: 'bold',
          color: 'white',
          padding: '1rem 2rem',
          cursor: 'pointer',
          fontSize: '1.5rem',
          bottom: '1rem',
          left: '50%',
          boxShadow: '0px 0px 20px rgba(0,0,0,1)',
          transform: 'translate(-50%, 0)',
        }}
        onClick={() => store.enterAR()}
      >
        Enter AR
      </button>
      <Canvas shadows camera={{ position: [0, 0, 10], fov: 25 }}>
        <XR store={store}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 10]} />
        </XR>
      </Canvas>
    </>
  )
}
