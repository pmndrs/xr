import { Canvas, createPortal, GroupProps, useFrame } from '@react-three/fiber'
import { createXRStore, XR, useLoadXRControllerLayout, useLoadXRControllerModel } from '@react-three/xr'
import { XRControllerGamepadComponentId, XRControllerLayout, getXRControllerComponentObject } from '@pmndrs/xr'
import { PropsWithChildren, Suspense, useEffect, useRef, useState } from 'react'
import { Group, MeshBasicMaterial, Object3D } from 'three'
import { Environment, OrbitControls } from '@react-three/drei'
import { Container, Root, Text } from '@react-three/uikit'

export function App() {
  return (
    <>
      <Canvas style={{ width: '100%', flexGrow: 1 }}>
        <OrbitControls />
        <ambientLight />
        <color args={[0x0]} attach="background" />
        <Suspense>
          <Environment preset="city" />
        </Suspense>
        <directionalLight position={[1, 1, 1]} />
        <TutorialController scale={50} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, -Math.PI / 4]} />
      </Canvas>
    </>
  )
}

function TutorialController(props: Omit<GroupProps, 'children'>) {
  const layout = useLoadXRControllerLayout(['meta-quest-touch-plus'], 'right')
  const model = useLoadXRControllerModel(layout)
  const materialRef = useRef<MeshBasicMaterial>(null)

  useFrame(({ clock }) => {
    if (materialRef.current == null) {
      return
    }
    materialRef.current.opacity = Math.sin(clock.getElapsedTime() * 10) * 0.25 + 0.5
  })

  if (layout == null) {
    return null
  }

  return (
    <group {...props}>
      <primitive object={model} />
      <DemoControllerComponent layout={layout} model={model} id="a-button">
        <Root
          transformTranslateY={-30}
          borderRadius={8}
          positionType="relative"
          backgroundColor="white"
          anchorY="bottom"
          pixelSize={0.0005}
          padding={12}
        >
          <Text>Press "A" Button{'\n'}for jumping</Text>
          <Container
            positionType="absolute"
            transformTranslateX="-50%"
            transformTranslateY="50%"
            positionLeft="50%"
            borderBottomLeftRadius={8}
            transformRotateZ={45}
            positionBottom={0}
            width={20}
            height={20}
            backgroundColor="white"
          ></Container>
        </Root>
        <mesh>
          <sphereGeometry args={[0.006]} />
          <meshBasicMaterial ref={materialRef} toneMapped={false} transparent opacity={0.2} color="green" />
        </mesh>
      </DemoControllerComponent>
      <DemoControllerComponent layout={layout} model={model} id="b-button">
        <mesh>
          <sphereGeometry args={[0.006]} />
          <meshPhongMaterial transparent toneMapped={false} opacity={0.2} color="blue" />
        </mesh>
      </DemoControllerComponent>
    </group>
  )
}

export function DemoControllerComponent({
  id,
  layout,
  model,
  children,
}: PropsWithChildren<{ id: XRControllerGamepadComponentId; model: Group; layout: XRControllerLayout }>) {
  const [object, setObject] = useState<Object3D | undefined>(undefined)

  useEffect(() => {
    if (!model) {
      return
    }
    const object = getXRControllerComponentObject(model, layout, id)

    setObject(object)
  }, [model, layout, id])
  if (object == null) {
    return null
  }
  return createPortal(children, object)
}
