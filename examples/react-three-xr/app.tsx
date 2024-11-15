import { Canvas, useFrame } from '@react-three/fiber'
import {
  useHover,
  createXRStore,
  XR,
  XROrigin,
  TeleportTarget,
  useXRInputSourceStates,
  XRSpace,
  useXR,
  useXRSpace,
} from '@react-three/xr'
import { useMemo, useRef, useState } from 'react'
import { Bone, Euler, Matrix4, Mesh, Object3D, Vector3 } from 'three'
import { Smoke } from './smoke.js'
import { Environment, useGLTF } from '@react-three/drei'

const store = createXRStore({
  hand: { teleportPointer: true, model: false },
  controller: { teleportPointer: true },
})

export function App() {
  const [position, setPosition] = useState(new Vector3())
  return (
    <>
      <button onClick={() => store.enterVR()}>Enter VR</button>
      <button onClick={() => store.enterAR()}>Enter AR</button>
      <Canvas style={{ width: '100%', flexGrow: 1 }}>
        <XR store={store}>
          <ambientLight />
          <XROrigin position={position}>
            <Avatar />
          </XROrigin>
          <Environment preset="warehouse" />
          <Cube />
          <Smoke count={100} maxSize={0.3} minSize={0.1} spawnRate={10} speed={0.1} />
          <TeleportTarget onTeleport={setPosition}>
            <mesh scale={[10, 1, 10]} position={[0, -0.5, 0]}>
              <boxGeometry />
              <meshBasicMaterial color="green" />
            </mesh>
          </TeleportTarget>
        </XR>
      </Canvas>
    </>
  )
}

const mapping = {
  hips: 'Hips',
  'spine-lower': 'Spine',
  'spine-middle': 'Spine1',
  'spine-upper': 'Spine2',
  neck: 'Neck',
  head: 'Head',
  'left-shoulder': 'LeftShoulder',
  'left-arm-upper': 'LeftArm',
  'left-arm-lower': 'LeftForeArm',
  'left-hand-wrist': 'LeftHand',
  'left-hand-thumb-phalanx-proximal': 'LeftHandThumb1',
  'left-hand-thumb-phalanx-distal': 'LeftHandThumb2',
  'left-hand-thumb-tip': 'LeftHandThumb3',
  'left-hand-index-phalanx-proximal': 'LeftHandIndex1',
  'left-hand-index-phalanx-intermediate': 'LeftHandIndex2',
  'left-hand-index-tip': 'LeftHandIndex3',
  'left-hand-middle-phalanx-proximal': 'LeftHandMiddle1',
  'left-hand-middle-phalanx-intermediate': 'LeftHandMiddle2',
  'left-hand-middle-tip': 'LeftHandMiddle3',
  'left-hand-ring-phalanx-proximal': 'LeftHandRing1',
  'left-hand-ring-phalanx-intermediate': 'LeftHandRing2',
  'left-hand-ring-tip': 'LeftHandRing3',
  'left-hand-little-phalanx-proximal': 'LeftHandPinky1',
  'left-hand-little-phalanx-intermediate': 'LeftHandPinky2',
  'left-hand-little-tip': 'LeftHandPinky3',
  'right-shoulder': 'RightShoulder',
  'right-arm-upper': 'RightArm',
  'right-arm-lower': 'RightForeArm',
  'right-hand-wrist': 'RightHand',
  'right-hand-thumb-phalanx-proximal': 'RightHandThumb1',
  'right-hand-thumb-phalanx-distal': 'RightHandThumb2',
  'right-hand-thumb-tip': 'RightHandThumb3',
  'right-hand-index-phalanx-proximal': 'RightHandIndex1',
  'right-hand-index-phalanx-intermediate': 'RightHandIndex2',
  'right-hand-index-tip': 'RightHandIndex3',
  'right-hand-middle-phalanx-proximal': 'RightHandMiddle1',
  'right-hand-middle-phalanx-intermediate': 'RightHandMiddle2',
  'right-hand-middle-tip': 'RightHandMiddle3',
  'right-hand-ring-phalanx-proximal': 'RightHandRing1',
  'right-hand-ring-phalanx-intermediate': 'RightHandRing2',
  'right-hand-ring-tip': 'RightHandRing3',
  'right-hand-little-phalanx-proximal': 'RightHandPinky1',
  'right-hand-little-phalanx-intermediate': 'RightHandPinky2',
  'right-hand-little-tip': 'RightHandPinky3',
  'left-upper-leg': 'LeftUpLeg',
  'left-lower-leg': 'LeftLeg',
  'left-foot-ankle': 'LeftFoot',
  'left-foot-ball': 'LeftToeBase',
  'right-upper-leg': 'RightUpLeg',
  'right-lower-leg': 'RightLeg',
  'right-foot-ankle': 'RightFoot',
  'right-foot-ball': 'RightToeBase',
}

const conversionMatrix = new Matrix4().makeRotationFromEuler(new Euler(0, 0, -Math.PI / 2))
const identity = new Matrix4()

function Avatar() {
  const { scene } = useGLTF('man.glb')
  const referenceSpace = useXRSpace()
  const bufferRef = useRef<Float32Array | undefined>(undefined)
  const objectMap = useMemo(() => {
    scene.traverse((o) => (o.frustumCulled = false))
    const result = {} as Record<keyof typeof mapping, Object3D>
    for (const [key, name] of Object.entries(mapping)) {
      const jointObject = scene.getObjectByName(name)!
      jointObject.matrixAutoUpdate = false
      result[key as keyof typeof mapping] = jointObject
    }
    return result
  }, [scene])
  useFrame((_, _s, frame: XRFrame | undefined) => {
    if (frame == null || frame.body == null) {
      scene.visible = false
      return
    }
    scene.visible = true
    if (bufferRef.current == null) {
      // eslint-disable-next-line @react-three/no-new-in-loop
      bufferRef.current = new Float32Array(frame.body.size * 16)
    }
    frame.fillPoses(frame.body.values(), referenceSpace, bufferRef.current)
    let i = 0
    for (const key of frame.body.keys()) {
      if (key in objectMap) {
        objectMap[key as keyof typeof objectMap].matrix
          .fromArray(bufferRef.current, i * 16)
          .multiply(key.includes('hand') ? identity : conversionMatrix)
      }
      i++
    }
  })
  return <primitive object={scene} />
}

function Cube() {
  const ref = useRef<Mesh>(null)
  const hover = useHover(ref)
  const [toggle, setToggle] = useState(false)
  return (
    <mesh
      onClick={() => setToggle((x) => !x)}
      position={[0, 1, -1]}
      scale={0.1}
      pointerEventsType={{ deny: 'grab' }}
      ref={ref}
    >
      <boxGeometry />
      <meshBasicMaterial color={toggle ? 'white' : hover ? 'red' : 'blue'} />
    </mesh>
  )
}
