import { useGLTF } from '@react-three/drei'
import { Root, Text, Container } from '@react-three/uikit'
import { ClockIcon } from '@react-three/uikit-lucide'
import { XRHandModel } from '@react-three/xr'
import { Suspense, useEffect, useState } from 'react'

export function HandWithWatch() {
  return (
    <>
      <Suspense>
        <XRHandModel colorWrite={false} renderOrder={-1} />
      </Suspense>
      <Suspense>
        <Watch />
      </Suspense>
    </>
  )
}

function getTime() {
  const date = new Date()
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
}

export function Watch(props: any) {
  const { nodes, materials } = useGLTF('watch-v1.glb')
  const [time, setTime] = useState(getTime())
  useEffect(() => {
    const id = setInterval(() => setTime(getTime()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <group
      rotation={[-0.2, Math.PI / 2, Math.PI]}
      position={[0, -0.002, -0.01]}
      scale={0.00011}
      {...props}
      dispose={null}
    >
      <group rotation-x={Math.PI / 2} position-y={-270}>
        <Root pixelSize={0.66} width={512} height={512}>
          <Container
            flexDirection="column"
            backgroundColor="black"
            hover={{ backgroundColor: 'gray' }}
            cursor="pointer"
            width="100%"
            height="100%"
            alignItems="center"
            justifyContent="center"
            gap={32}
          >
            <ClockIcon color="white" height="20%" />
            <Text fontWeight="bold" fontSize={96} color="white">
              {time}
            </Text>
          </Container>
        </Root>
      </group>
      <mesh castShadow receiveShadow geometry={(nodes.Object006_watch_0 as any).geometry} material={materials.watch} />
    </group>
  )
}
