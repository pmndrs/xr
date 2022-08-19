import * as React from 'react'
import * as THREE from 'three'
import * as ReactDOM from 'react-dom/client'
import { VRButton, XR, Hands, useXR, Interactive, useHitTest, Controllers } from '@react-three/xr'
import { Box, Text } from '@react-three/drei'
import { useFrame, Canvas } from '@react-three/fiber'

function Button(props: JSX.IntrinsicElements['mesh']) {
  const [hover, setHover] = React.useState(false)
  const [color, setColor] = React.useState(0x123456)

  return (
    <Interactive onSelect={() => setColor((Math.random() * 0xffffff) | 0)} onHover={() => setHover(true)} onBlur={() => setHover(false)}>
      <Box {...props} args={[0.4, 0.1, 0.1]} scale={hover ? 1.5 : 1}>
        <meshStandardMaterial color={color} />
        {false && (
          <Text position={[0, 0, 0.06]} fontSize={0.05} color="#000" anchorX="center" anchorY="middle">
            Hello react-xr!
          </Text>
        )}
      </Box>
    </Interactive>
  )
}

function PlayerExample() {
  const player = useXR((state) => state.player)
  useFrame(() => void (player.rotation.x = player.rotation.y += 0.01))

  return null
}

function HitTestExample() {
  const boxRef = React.useRef<THREE.Mesh>(null!)
  useHitTest((hitMatrix) => boxRef.current.applyMatrix4(hitMatrix))

  return <Box ref={boxRef} args={[0.1, 0.1, 0.1]} />
}

function App() {
  return (
    <>
      <VRButton />
      <Canvas>
        <XR>
          <ambientLight intensity={0.5} />
          <pointLight position={[5, 5, 5]} />
          <Hands
          // modelLeft="/hand-left.gltf"
          // modelRight="/hand-right.gltf"
          />
          <Button position={[0, 0.8, -1]} />
          <Controllers />
          {false && <PlayerExample />}
          {false && <HitTestExample />}
        </XR>
      </Canvas>
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
