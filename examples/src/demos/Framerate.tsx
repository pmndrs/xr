import { Box } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Controllers, Interactive, VRButton, XR, Stats } from '@react-three/xr'
import React, { ComponentProps } from 'react'
import { controls, selectableButton } from '../styles.css'

export function Button(props: ComponentProps<typeof Box>) {
  const [hover, setHover] = React.useState(false)
  const [color, setColor] = React.useState(0x123456)

  return (
    <Interactive onSelect={() => setColor((Math.random() * 0xffffff) | 0)} onHover={() => setHover(true)} onBlur={() => setHover(false)}>
      <Box {...props} args={[0.4, 0.1, 0.1]} scale={hover ? 1.5 : 1}>
        <meshStandardMaterial color={color} />
      </Box>
    </Interactive>
  )
}

export default function () {
  const [frameRate, setFrameRate] = React.useState(72)
  return (
    <>
      <div className={controls}>
        {[72, 90, 120].map((fps) => (
          <button key={fps} className={selectableButton[frameRate === fps ? 'selected' : 'default']} onClick={() => setFrameRate(fps)}>
            {`${fps} FPS`}
          </button>
        ))}
      </div>
      <VRButton />
      <Canvas>
        <XR frameRate={frameRate}>
          <ambientLight intensity={0.5} />
          <pointLight position={[5, 5, 5]} />
          <Stats enabledPanels={['FPS']} />
          <Controllers />
          <Button position={[0, 0.8, -1]} />
        </XR>
      </Canvas>
    </>
  )
}
