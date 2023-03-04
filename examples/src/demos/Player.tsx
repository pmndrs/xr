import { Environment, Box } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { Controllers, useXR, VRButton, XR } from '@react-three/xr'

function PlayerExample() {
  const player = useXR((state) => state.player)
  useFrame(() => void (player.rotation.y += 0.0005))

  return (
    <>
      <Environment preset="sunset" background />
      <Box position={[0, 0.8, -1]} args={[0.4, 0.1, 0.1]} />
    </>
  )
}

export default function () {
  return (
    <>
      <VRButton />
      <Canvas>
        <XR>
          <ambientLight intensity={0.5} />
          <pointLight position={[5, 5, 5]} />
          <Controllers />
          <PlayerExample />
        </XR>
      </Canvas>
    </>
  )
}
