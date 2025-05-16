import { signal, computed } from '@preact/signals-core'
import { useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { Root, Text, Container } from '@react-three/uikit'
import { FootprintsIcon, GoalIcon, PlayIcon } from '@react-three/uikit-lucide'
import { XRHandModel } from '@react-three/xr'
import { Suspense, useMemo, useRef, useState } from 'react'
import { Vector3 } from 'three'

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

const vectorHelper = new Vector3()

export function Watch(props: any) {
  const { nodes, materials } = useGLTF('watch-v1.glb')
  const [state, setState] = useState<'walking' | 'paused' | 'stopped'>('stopped')
  const distanceSignal = useMemo(() => signal(0), [])
  const camera = useThree((state) => state.camera)
  const ref = useRef<Vector3>()
  useFrame(() => {
    if (state != 'walking') {
      return
    }
    camera.getWorldPosition(vectorHelper)
    if (ref.current == null) {
      // eslint-disable-next-line @react-three/no-clone-in-loop
      ref.current = vectorHelper.clone()
      return
    }
    ref.current.sub(vectorHelper)
    ref.current.y = 0
    distanceSignal.value += ref.current.length()
    ref.current.copy(vectorHelper)
  })
  return (
    <group
      rotation={[-0.2, Math.PI / 2, Math.PI]}
      position={[0, -0.01, -0.02]}
      scale={0.00011}
      {...props}
      dispose={null}
    >
      <group rotation-x={Math.PI / 2} position-y={-270}>
        <Root pixelSize={0.66} width={512} height={512}>
          {state === 'stopped' && (
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
              onClick={() => setState('walking')}
            >
              <FootprintsIcon color="white" width="50%" height="50%" />
              <Text fontWeight="bold" fontSize={72} color="white">
                Let's go
              </Text>
            </Container>
          )}
          {state === 'walking' && (
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
              onClick={() => setState('paused')}
            >
              <Text fontWeight="bold" fontSize={192} color="white">
                {computed(() => distanceSignal.value.toFixed(0))}
              </Text>
              <Text fontWeight="bold" fontSize={72} color="white">
                METER
              </Text>
            </Container>
          )}
          {state === 'paused' && (
            <Container
              flexDirection="column"
              justifyContent="center"
              backgroundColor="black"
              width="100%"
              height="100%"
              gap={64}
            >
              <Container
                alignItems="center"
                gap={32}
                padding={48}
                backgroundOpacity={0.2}
                hover={{ backgroundColor: 'white' }}
                cursor="pointer"
                onClick={() => setState('walking')}
              >
                <PlayIcon width={72} flexShrink={0} color="white" />
                <Text color="white" fontSize={72} fontWeight="bold">
                  RESUME
                </Text>
              </Container>

              <Container
                alignItems="center"
                padding={48}
                gap={32}
                onClick={() => {
                  distanceSignal.value = 0
                  setState('stopped')
                }}
                backgroundOpacity={0.2}
                hover={{ backgroundColor: 'white' }}
                cursor="pointer"
              >
                <GoalIcon width={72} flexShrink={0} color="white" />
                <Text color="white" fontSize={72} fontWeight="bold">
                  FINISH
                </Text>
              </Container>
            </Container>
          )}
        </Root>
      </group>
      <mesh castShadow receiveShadow geometry={(nodes.Object006_watch_0 as any).geometry} material={materials.watch} />
    </group>
  )
}
