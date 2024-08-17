import { Canvas, useThree } from '@react-three/fiber'
import { createXRStore, useHover, XR, XRLayer } from '@react-three/xr'
import { useEffect, useMemo, useRef } from 'react'
import { Mesh } from 'three'
import { forwardHtmlEvents } from '@pmndrs/pointer-events'

const store = createXRStore({
  foveation: 0,
})

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
      <Canvas
        events={() => ({ enabled: false, priority: 0 })}
        style={{ width: '100%', flexGrow: 1 }}
        camera={{ position: [0, 1.5, 0], rotation: [0, 0, 0] }}
      >
        <SwitchToXRPointerEvents />
        <XR store={store}>
          {image != null && (
            <XRLayer
              position={[0, 1.5, -0.5]}
              onClick={() => image.play()}
              scale={0.5}
              shape="quad"
              pixelHeight={1024}
              pixelWidth={1024}
              centralAngle={Math.PI}
              centralHorizontalAngle={Math.PI}
              lowerVerticalAngle={-Math.PI / 2}
              upperVerticalAngle={Math.PI / 2}
              src={image}
            >
              <Inner />
            </XRLayer>
          )}
        </XR>
      </Canvas>
    </>
  )
}

function Inner() {
  const ref = useRef<Mesh>(null)
  const hover = useHover(ref)
  return (
    <mesh ref={ref}>
      <boxGeometry />
      <meshBasicMaterial color={hover ? 'red' : 'blue'} />
    </mesh>
  )
}

export function SwitchToXRPointerEvents() {
  const domElement = useThree((s) => s.gl.domElement)
  const camera = useThree((s) => s.camera)
  const scene = useThree((s) => s.scene)
  useEffect(() => forwardHtmlEvents(domElement, camera, scene), [domElement, camera, scene])
  return null
}
