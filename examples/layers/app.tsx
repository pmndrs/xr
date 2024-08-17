import { Canvas, useThree } from '@react-three/fiber'
import { createXRStore, useHover, XR, XRLayer } from '@react-three/xr'
import { Text } from '@react-three/drei'
import { useEffect, useMemo, useRef } from 'react'
import { Mesh, SRGBColorSpace, VideoTexture } from 'three'
import { forwardHtmlEvents } from '@pmndrs/pointer-events'

const store = createXRStore({
  foveation: 0,
})

export function App() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const video = useMemo(() => {
    const result = document.createElement('video')
    result.src = 'test.mp4'
    return result
  }, [])
  const videoTexture = useMemo(() => {
    const texture = new VideoTexture(video)
    texture.colorSpace = SRGBColorSpace
    return texture
  }, [video])
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
          <Text scale={0.03} color="black" position={[-0.3, 1.78, -0.5]}>
            With XRLayer
          </Text>
          <XRLayer position={[-0.3, 1.5, -0.5]} onClick={() => video.play()} scale={0.5} shape="quad" src={video} />

          <Text scale={0.03} color="black" position={[0.3, 1.78, -0.5]}>
            Without XRLayer
          </Text>
          <mesh position={[0.3, 1.5, -0.5]} scale={0.5}>
            <planeGeometry />
            <meshBasicMaterial map={videoTexture} toneMapped={false} />
          </mesh>
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
