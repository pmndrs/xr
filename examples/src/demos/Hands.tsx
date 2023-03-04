import { Canvas } from '@react-three/fiber'
import { Hands, XR, VRButton } from '@react-three/xr'

export default function () {
  return (
    <>
      <VRButton onError={(e) => console.error(e)} />
      <Canvas>
        <XR>
          <ambientLight intensity={0.5} />
          <pointLight position={[5, 5, 5]} />
          <Hands
          // modelLeft="/hand-left.gltf"
          // modelRight="/hand-right.gltf"
          />
        </XR>
      </Canvas>
    </>
  )
}
