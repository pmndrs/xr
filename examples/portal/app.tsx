import { Environment, Mask, useMask, useTexture } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitHandles } from '@react-three/handle'
import { createXRStore, XR, noEvents, PointerEvents } from '@react-three/xr'
import { Fragment, MutableRefObject, useRef } from 'react'
import { BackSide, ExtrudeGeometry, Float32BufferAttribute, Mesh, Shape, Vector2 } from 'three'
import { lerp } from 'three/src/math/MathUtils.js'
import { Lever } from './lever.js'

// Create a cube geometry with open top and bottom faces
const shape = new Shape()
shape.moveTo(-1, -1)
shape.lineTo(1, -1)
shape.lineTo(1, 1)
shape.lineTo(-1, 1)
shape.lineTo(-1, -1)

const extrudeSettings = {
  steps: 1,
  depth: 2,
  bevelEnabled: false,
}

// Create the geometry by extruding a square shape with open top and bottom
const geometry = new ExtrudeGeometry(shape, extrudeSettings)

// Create a custom BufferGeometry with only the side faces
const positions = []
const normals = []
const uvs = []

// Extract only the side faces from the extruded geometry
const positionAttr = geometry.attributes.position
const normalAttr = geometry.attributes.normal
const uvAttr = geometry.attributes.uv

// Loop through the vertices and only keep the ones for the side faces
for (let i = 0; i < positionAttr.count; i++) {
  const normal = new Vector2(normalAttr.getX(i), normalAttr.getY(i)).length()
  // Only keep vertices where the normal is not pointing up or down
  if (Math.abs(normalAttr.getZ(i)) < 0.9) {
    positions.push(positionAttr.getX(i), positionAttr.getY(i), positionAttr.getZ(i))
    normals.push(normalAttr.getX(i), normalAttr.getY(i), normalAttr.getZ(i))
    uvs.push(uvAttr.getX(i), uvAttr.getY(i))
  }
}

// Update the geometry with only the side faces
geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3))
geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
geometry.computeVertexNormals()

// Translate the geometry so that it's centered at the origin
geometry.translate(0, 0, -1)
geometry.rotateX(Math.PI / 2)

const store = createXRStore({
  foveation: 0,
  hand: {
    model: {
      renderOrder: -1,
      colorWrite: false,
    },
  },
})

export function App() {
  const stencil = useMask(1)
  const openRef = useRef(false)
  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '1rem',
          position: 'absolute',
          zIndex: 10000,
          bottom: '1rem',
          left: '50%',
          transform: 'translate(-50%, 0)',
        }}
      >
        <button
          style={{
            background: 'white',
            borderRadius: '0.5rem',
            border: 'none',
            fontWeight: 'bold',
            color: 'black',
            padding: '1rem 2rem',
            cursor: 'pointer',
            fontSize: '1.5rem',
            boxShadow: '0px 0px 20px rgba(0,0,0,1)',
          }}
          onClick={() => store.enterAR()}
        >
          Enter AR
        </button>
        <button
          style={{
            background: 'white',
            borderRadius: '0.5rem',
            border: 'none',
            fontWeight: 'bold',
            color: 'black',
            padding: '1rem 2rem',
            cursor: 'pointer',
            fontSize: '1.5rem',
            boxShadow: '0px 0px 20px rgba(0,0,0,1)',
          }}
          onClick={() => store.enterVR()}
        >
          Enter VR
        </button>
      </div>
      <Canvas
        gl={{ stencil: true }}
        camera={{ position: [-1, 1, 1] }}
        events={noEvents}
        style={{ width: '100%', flexGrow: 1 }}
      >
        <XR store={store}>
          <PointerEvents />
          <OrbitHandles />
          <Environment preset="park" />
          <group position-z={-1.3}>
            <Lever openRef={openRef} position-z={1} scale={0.01} />
            <Door openRef={openRef} />
            <Mask id={1} scale={2 * 0.6} rotation-x={-Math.PI / 2}>
              <planeGeometry />
            </Mask>
            <group scale={0.6} position-y={0.6 * -(-1 + 0.41 + 0.42 * 7)}>
              {new Array(8).fill(undefined).map((_, i) => (
                <Fragment key={i}>
                  <mesh position-y={-1 + 0.2 + 0.42 * i} scale-y={0.2} geometry={geometry}>
                    <meshPhysicalMaterial {...stencil} metalness={0.8} roughness={0.1} side={BackSide} color="black" />
                  </mesh>
                  <mesh position-y={-1 + 0.41 + 0.42 * i} scale-y={0.01} geometry={geometry}>
                    <meshPhysicalMaterial {...stencil} metalness={0.8} roughness={0.1} side={BackSide} color="white" />
                  </mesh>
                </Fragment>
              ))}
              <Img stencil={stencil} />
            </group>
          </group>
        </XR>
      </Canvas>
    </>
  )
}

function Door({ openRef }: { openRef: MutableRefObject<boolean> }) {
  const leftRef = useRef<Mesh>(null)
  const rightRef = useRef<Mesh>(null)

  useFrame((_, delta) => {
    if (leftRef.current == null || rightRef.current == null) {
      return
    }
    const leftGoalX = openRef.current ? -1 : -0.3
    const rightGoalX = openRef.current ? 1 : 0.3
    leftRef.current.position.x = lerp(leftRef.current.position.x, leftGoalX, delta)
    rightRef.current.position.x = lerp(rightRef.current.position.x, rightGoalX, delta)
  })

  return (
    <>
      <mesh
        ref={leftRef}
        position-x={-0.3}
        position-y={0.01}
        scale={[1.05 * 0.6, 2.5 * 0.6, 2 * 0.6]}
        rotation-x={-Math.PI / 2}
      >
        <planeGeometry />
        <meshBasicMaterial colorWrite={false} />
      </mesh>
      <mesh
        ref={rightRef}
        position-x={0.3}
        position-y={0.01}
        scale={[1.05 * 0.6, 2.5 * 0.6, 2 * 0.6]}
        rotation-x={-Math.PI / 2}
      >
        <planeGeometry />
        <meshBasicMaterial colorWrite={false} />
      </mesh>
    </>
  )
}

function Img({ stencil }: { stencil: ReturnType<typeof useMask> }) {
  const texture = useTexture('img.jpg')
  return (
    <mesh position-y={-1} scale={2} rotation-x={-Math.PI / 2}>
      <planeGeometry />
      <meshBasicMaterial {...stencil} toneMapped={false} map={texture} />
    </mesh>
  )
}
