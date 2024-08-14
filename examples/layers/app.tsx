import { Canvas } from '@react-three/fiber'
import { createXRStore, XR, XRLayer } from '@react-three/xr'
import { useMemo } from 'react'

const store = createXRStore()

export function App() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const image = useMemo(() => {
    const result = document.createElement('video')
    result.src = 'test.mp4'
    return result
  }, [])
  return (
    <>
      <button onClick={() => store.enterAR()}>Enter AR</button>
      <Canvas style={{ width: '100%', flexGrow: 1 }} camera={{ position: [0, 1.5, 0], rotation: [0, 0, 0] }}>
        <XR store={store}>
          {image != null && (
            <XRLayer
              onClick={() => {}}
              position={[0, 1.5, -0.5]}
              scale={0.2}
              shape="equirect"
              centralHorizontalAngle={Math.PI}
              lowerVerticalAngle={-Math.PI / 2}
              upperVerticalAngle={Math.PI / 2}
              src={image}
              quality="graphics-optimized"
            />
          )}
        </XR>
      </Canvas>
    </>
  )
}
