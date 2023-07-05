import { Canvas } from '@react-three/fiber'
import { XR, VRButton, TeleportationPlane, Controllers } from '@react-three/xr'

export default function () {
  return (
    <>
      <VRButton onError={(e) => console.error(e)} />
      <Canvas>
        <color attach="background" args={['black']} />
        <XR>
          <Controllers />
          <TeleportationPlane leftHand />
          <mesh position={[1, 0, 0]}>
            <boxGeometry args={[0.1, 0.1, 0.1]} />
            <meshBasicMaterial color="red" />
          </mesh>
          <mesh position={[0, 1, 0]}>
            <boxGeometry args={[0.1, 0.1, 0.1]} />
            <meshBasicMaterial color="green" />
          </mesh>
          <mesh position={[0, 0, 1]}>
            <boxGeometry args={[0.1, 0.1, 0.1]} />
            <meshBasicMaterial color="blue" />
          </mesh>
          <ambientLight intensity={0.5} />
        </XR>
      </Canvas>
    </>
  )
}
