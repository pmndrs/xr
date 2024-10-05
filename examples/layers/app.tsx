import { Canvas, useThree } from '@react-three/fiber'
import { createXRStore, useHover, XR, XRLayer, XROrigin } from '@react-three/xr'
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
        camera={{ position: [0, 0, 0], rotation: [0, 0, 0] }}
      >
        <SwitchToXRPointerEvents />
        <XR store={store}>
          <Text scale={0.03} color="black" position={[-0.6, 0.28, -0.5]}>
            32x32 XRLayer with DPR=32
          </Text>
          <XROrigin position={[0, -1.5, 0]} />
          <XRLayer
            rotation-y={Math.PI / 16}
            dpr={32}
            pixelWidth={32}
            pixelHeight={32}
            position={[-0.6, 0, -0.5]}
            scale={0.5}
            shape="quad"
          >
            <mesh>
              <boxGeometry />
              <meshBasicMaterial color="red" toneMapped={false} />
            </mesh>
          </XRLayer>

          <Text scale={0.03} color="black" position={[0, 0.28, -0.5]}>
            With XRLayer
          </Text>
          <XRLayer position={[0, 0, -0.5]} onClick={() => video.play()} scale={0.5} shape="quad" src={video} />

          <Text scale={0.03} color="black" position={[0.6, 0.28, -0.5]}>
            Without XRLayer
          </Text>
          <mesh rotation-y={-Math.PI / 16} position={[0.6, 0, -0.5]} scale={0.5}>
            <planeGeometry />
            <meshBasicMaterial map={videoTexture} toneMapped={false} />
          </mesh>
        </XR>
      </Canvas>
    </>
  )
}

export function SwitchToXRPointerEvents() {
  const domElement = useThree((s) => s.gl.domElement)
  const camera = useThree((s) => s.camera)
  const scene = useThree((s) => s.scene)
  useEffect(() => forwardHtmlEvents(domElement, () => camera, scene), [domElement, camera, scene])
  return null
}
