import { Canvas, Color, extend, RootState, useFrame, useThree } from '@react-three/fiber'
import {
  createXRStore,
  IfInSessionMode,
  isXRInputSourceState,
  noEvents,
  NotInXR,
  PointerEvents,
  useHover,
  useSessionFeatureEnabled,
  useXR,
  XR,
  XRLayer,
  XROrigin,
} from '@react-three/xr'
import { PositionalAudio, RoundedBox, useGLTF } from '@react-three/drei'
import {
  OrbitHandles,
  Handle,
  HandleTarget,
  createScreenCameraStore,
  ScreenCameraStateAndFunctions,
  PivotHandles,
} from '@react-three/handle'
import {
  ComponentPropsWithoutRef,
  CSSProperties,
  forwardRef,
  ReactNode,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  Camera,
  DirectionalLight,
  Euler,
  Group,
  Mesh,
  Object3D,
  Object3DEventMap,
  Quaternion,
  Scene as SceneImpl,
  ShaderMaterial,
  Uniform,
  Vector3,
  Vector3Tuple,
  WebGLRenderer,
  WebGLRenderTarget,
  PositionalAudio as PAudio,
  BackSide,
} from 'three'
import { create } from 'zustand'
import {
  applyDampedScreenCameraState,
  defaultApply,
  defaultOrbitHandlesScreenCameraApply,
  HandleState,
  HandleStore,
} from '@pmndrs/handle'
import { damp } from 'three/src/math/MathUtils.js'
import { getVoidObject, PointerEventsMap, PointerEvent } from '@pmndrs/pointer-events'
import { CopyPass, EffectComposer, RenderPass, ShaderPass } from 'postprocessing'
import { MeshLineGeometry, MeshLineMaterial } from 'meshline'

function createDefaultTransformation(x: number, y: number, z: number) {
  return {
    position: [x, y, z] as Vector3Tuple,
    rotation: new Quaternion().toArray(),
    scale: [1, 1, 1] as Vector3Tuple,
  }
}

type ElementType = 'sphere' | 'cube' | 'cone'

const useSceneStore = create(() => ({
  lightPosition: [0.3, 0.3, 0.3] as Vector3Tuple,
  sphereTransformation: createDefaultTransformation(-0.1, 0, 0),
  cubeTransformation: createDefaultTransformation(0.1, 0, 0),
  coneTransformation: createDefaultTransformation(0, 0, 0.1),
  selected: undefined as ElementType | undefined,
}))

const cameraStore = createScreenCameraStore({ yaw: 0, distance: 0.5 })

const store = createXRStore()

const buttonStyles: CSSProperties = {
  background: 'white',
  border: 'none',
  color: 'black',
  padding: '0.5rem 1.5rem',
  cursor: 'pointer',
  fontSize: '1.5rem',
  fontFamily: 'monospace',
  bottom: '1rem',
  left: '50%',
  boxShadow: '0px 0px 20px rgba(0, 0, 0, 0.2)',
}

export function App() {
  return (
    <>
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          left: '50%',
          transform: 'translate(-50%, 0)',
          bottom: '1rem',
          gap: '1rem',
          zIndex: '10000',
        }}
      >
        <button style={buttonStyles} onClick={() => store.enterVR()}>
          VR
        </button>
        <button style={buttonStyles} onClick={() => store.enterAR()}>
          AR
        </button>
      </div>
      <Canvas
        shadows="soft"
        camera={{ position: [-0.5, 0.5, 0.5] }}
        events={noEvents}
        style={{ width: '100%', flexGrow: 1 }}
      >
        <XR store={store}>
          <IfInSessionMode deny="immersive-ar">
            <mesh scale={1000}>
              <meshBasicMaterial side={BackSide} color="black" />
              <sphereGeometry />
            </mesh>
          </IfInSessionMode>
          <group pointerEventsType={{ deny: 'touch' }}>
            <AudioEffects />
            <PointerEvents />
            <OrbitHandles damping />
            <XROrigin position={[0, -1, 0.5]} />
            <HandleTarget>
              <Scene isNotInRT />

              <HandleWithAudio useTargetFromContext scale={false} multitouch={false} rotate={false}>
                <Hover>
                  {(hovered) => (
                    <RoundedBox position-x={0.35} position-y={-0.05} args={[0.2, 0.2, 2]} scale={hovered ? 0.125 : 0.1}>
                      <meshStandardMaterial
                        emissiveIntensity={hovered ? 0.3 : 0}
                        emissive={0xffffff}
                        toneMapped={false}
                        color="grey"
                      />
                    </RoundedBox>
                  )}
                </Hover>
              </HandleWithAudio>

              <HandleWithAudio
                useTargetFromContext
                scale={{ uniform: true }}
                multitouch={false}
                translate="as-rotate-and-scale"
                rotate={{ x: false, z: false }}
              >
                <Hover>
                  {(hovered) => (
                    <mesh
                      position-x={0.335}
                      position-z={0.335}
                      position-y={-0.05}
                      rotation-y={Math.PI}
                      scale={hovered ? 0.04 : 0.03}
                    >
                      <RotateGeometry />
                      <meshStandardMaterial
                        emissiveIntensity={hovered ? 0.3 : 0}
                        emissive={0xffffff}
                        toneMapped={false}
                        color="grey"
                      />
                    </mesh>
                  )}
                </Hover>
              </HandleWithAudio>
              <CameraHelper />
            </HandleTarget>
            <Screen />
          </group>
        </XR>
      </Canvas>
    </>
  )
}

function RotateGeometry() {
  const { scene } = useGLTF('rotate.glb')
  return <primitive attach="geometry" object={(scene.children[2] as Mesh).geometry} />
}

const eulerHelper = new Euler()
const quaternionHelper = new Quaternion()
const vectorHelper1 = new Vector3()
const vectorHelper2 = new Vector3()
const zAxis = new Vector3(0, 0, 1)

// Create a custom ShaderMaterial for gamma correction
const myShaderMaterial = new ShaderMaterial({
  uniforms: {
    tDiffuse: new Uniform(null), // Input texture (rendered scene)
    gamma: new Uniform(2.2), // Default gamma value
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float gamma;
    varying vec2 vUv;

    void main() {
      // Sample the input texture
      vec4 color = texture2D(tDiffuse, vUv);

      // Apply gamma correction
      color.rgb = pow(color.rgb, vec3(1.0 / gamma));

      // Output the corrected color
      gl_FragColor = color;
    }
  `,
})

function Screen() {
  const ref = useRef<Group>(null)
  const storeRef = useRef<HandleStore<unknown>>(null)
  useFrame((state, dt) => {
    if (ref.current == null || storeRef.current?.getState() == null) {
      return
    }
    state.camera.getWorldPosition(vectorHelper1)
    ref.current.getWorldPosition(vectorHelper2)
    quaternionHelper.setFromUnitVectors(zAxis, vectorHelper1.sub(vectorHelper2).normalize())
    eulerHelper.setFromQuaternion(quaternionHelper, 'YXZ')
    ref.current.rotation.y = damp(ref.current.rotation.y, eulerHelper.y, 10, dt)
  })
  const isInXR = useSessionFeatureEnabled('layers')
  const renderFunction = useMemo(() => {
    let cache:
      | {
          composer: EffectComposer
          camera: Camera
          scene: SceneImpl
          renderer: WebGLRenderer
          renderTarget: WebGLRenderTarget
        }
      | undefined
    return (renderTarget: WebGLRenderTarget, state: RootState, delta: number) => {
      if (
        cache == null ||
        state.scene != cache.scene ||
        state.camera != cache.camera ||
        state.gl != cache.renderer ||
        renderTarget != cache.renderTarget
      ) {
        if (cache != null) {
          cache.composer.dispose()
        }
        const composer = new EffectComposer(state.gl)
        composer.autoRenderToScreen = false
        composer.addPass(new RenderPass(state.scene, state.camera))
        //gamma correction pass
        composer.addPass(new ShaderPass(myShaderMaterial, 'tDiffuse'))
        composer.addPass(new CopyPass(renderTarget))
        cache = {
          composer,
          camera: state.camera,
          scene: state.scene,
          renderer: state.gl,
          renderTarget,
        }
      }
      cache.composer.render(delta)
    }
  }, [])

  return (
    <HandleTarget>
      <group position-z={-0.4}>
        <group ref={ref}>
          <group position-y={0.05}>
            <HandleTarget>
              <mesh position-y={0.15} rotation-y={Math.PI} scale={[(0.3 * 16) / 9, 0.3, 0.3]}>
                <planeGeometry />
                <meshBasicMaterial />
              </mesh>
              <XRLayer
                pointerEventsType={{ deny: 'grab' }}
                position-y={0.15}
                customRender={isInXR ? renderFunction : undefined}
                scale={[(0.3 * 16) / 9, 0.3, 0.3]}
                pixelWidth={1920 / 2}
                pixelHeight={1080 / 2}
              >
                <NotInXR>
                  <color attach="background" args={['white']} />
                  <OrbitHandles damping store={cameraStore} />
                  <Scene />
                </NotInXR>
              </XRLayer>
              <HandleWithAudio
                useTargetFromContext
                translate="as-scale"
                apply={(state, target) => {
                  defaultApply(state, target)
                  target.scale.z = state.current.scale.x
                }}
                scale={{ z: false, uniform: true }}
                rotate={false}
              >
                <Hover>
                  {(hovered) => (
                    <mesh
                      rotation-x={Math.PI / 2}
                      rotation-z={Math.PI}
                      position={[(0.15 * 16) / 9 + (hovered ? 0.035 : 0.03), hovered ? 0.325 : 0.32, 0]}
                      scale={hovered ? 0.035 : 0.025}
                    >
                      <RotateGeometry />
                      <meshStandardMaterial
                        emissiveIntensity={hovered ? 0.3 : 0}
                        emissive={0xffffff}
                        toneMapped={false}
                        color="grey"
                      />
                    </mesh>
                  )}
                </Hover>
              </HandleWithAudio>
            </HandleTarget>
          </group>
          <HandleWithAudio useTargetFromContext ref={storeRef} scale={false} multitouch={false} rotate={false}>
            <Hover>
              {(hovered) => (
                <RoundedBox scale={hovered ? 0.125 : 0.1} args={[2, 0.2, 0.2]}>
                  <meshStandardMaterial
                    emissiveIntensity={hovered ? 0.3 : 0}
                    emissive={0xffffff}
                    toneMapped={false}
                    color="grey"
                  />
                </RoundedBox>
              )}
            </Hover>
          </HandleWithAudio>
        </group>
      </group>
    </HandleTarget>
  )
}

function CameraHelper() {
  const ref = useRef<Object3D>(null)
  const update = useMemo(
    () =>
      applyDampedScreenCameraState(
        cameraStore,
        () => ref.current,
        () => true,
      ),
    [],
  )
  useFrame((state, dt) => update(dt * 1000))
  const cameraGeometry = (useGLTF('camera.glb').scene.children[0] as Mesh).geometry
  const hoverTargetRef = useRef<Mesh>(null)
  return (
    <HandleTarget ref={ref}>
      <Hover hoverTargetRef={hoverTargetRef}>
        {(hovered) => (
          <>
            <HandleWithAudio
              useTargetFromContext
              apply={(state) => cameraStore.getState().setCameraPosition(...state.current.position.toArray())}
              scale={false}
              multitouch={false}
              rotate={false}
            >
              <mesh ref={hoverTargetRef} scale={hovered ? 0.025 : 0.02}>
                <sphereGeometry />
                <meshStandardMaterial
                  emissiveIntensity={hovered ? 0.3 : 0}
                  emissive={0xffffff}
                  toneMapped={false}
                  color="grey"
                />
              </mesh>
            </HandleWithAudio>
            <group scale-x={16 / 9} rotation-y={Math.PI}>
              <mesh position-z={0.1} scale={hovered ? 0.025 : 0.02}>
                <primitive attach="geometry" object={cameraGeometry} />
                <meshStandardMaterial
                  emissiveIntensity={hovered ? 0.3 : 0}
                  emissive={0xffffff}
                  toneMapped={false}
                  color="grey"
                />
              </mesh>
            </group>
          </>
        )}
      </Hover>
    </HandleTarget>
  )
}

function Scene({ isNotInRT = false }: { isNotInRT?: boolean }) {
  const lightTarget = useMemo(() => new Object3D(), [])
  const light = useMemo(() => new DirectionalLight(), [])
  light.castShadow = true
  light.shadow.camera.left = -0.5
  light.shadow.camera.right = 0.5
  light.shadow.camera.bottom = -0.5
  light.shadow.camera.top = 0.5
  light.shadow.camera.near = 0
  light.target = lightTarget
  light.position.set(0, 0, 0)
  light.intensity = 5

  const sunGeometry = (useGLTF('sun.glb').scene.children[0] as Mesh).geometry

  const lightGroupRef = useRef<Group>(null)
  useEffect(() => {
    const fn = (state: Vector3Tuple) => lightGroupRef.current?.position.set(...state)
    fn(useSceneStore.getState().lightPosition)
    return useSceneStore.subscribe((s) => fn(s.lightPosition))
  }, [])

  const scene = useThree((s) => s.scene)
  useEffect(() => {
    const voidObject = getVoidObject(scene) as Object3D<Object3DEventMap & PointerEventsMap>
    const fn = () => useSceneStore.setState({ selected: undefined })
    voidObject.addEventListener('click', fn)
    return () => voidObject.removeEventListener('click', fn)
  }, [scene])

  const sunHoverTargetRef = useRef<Mesh>(null)

  const pivotSize = isNotInRT ? 1 : 2

  return (
    <>
      <ambientLight intensity={0.6} />
      <Hover hoverTargetRef={sunHoverTargetRef}>
        {(hovered) => (
          <>
            {isNotInRT && (
              <StripedLineToCenter
                color={hovered ? 'white' : 'gray'}
                width={hovered ? 0.008 : 0.005}
                fromRef={lightGroupRef}
              />
            )}
            <HandleTarget ref={lightGroupRef}>
              <primitive object={light} />
              {isNotInRT && (
                <>
                  <HandleWithAudio
                    useTargetFromContext
                    apply={(state) => useSceneStore.setState({ lightPosition: state.current.position.toArray() })}
                    scale={false}
                    multitouch={false}
                    rotate={false}
                  >
                    <mesh ref={sunHoverTargetRef} scale={hovered ? 0.025 : 0.02}>
                      <sphereGeometry />
                      <meshStandardMaterial
                        emissiveIntensity={hovered ? 0.3 : 0}
                        emissive={0xffffff}
                        toneMapped={false}
                        color="grey"
                      />
                    </mesh>
                  </HandleWithAudio>
                  <mesh scale={(hovered ? 0.025 : 0.02) * 0.7}>
                    <primitive attach="geometry" object={sunGeometry} />
                    <meshStandardMaterial
                      emissiveIntensity={hovered ? 0.3 : 0}
                      emissive={0xffffff}
                      toneMapped={false}
                      color="grey"
                    />
                  </mesh>
                </>
              )}
            </HandleTarget>
          </>
        )}
      </Hover>
      <CustomTransformHandles size={pivotSize} target="cone">
        <Hover>
          {(hovered) => (
            <mesh castShadow receiveShadow scale={0.1}>
              <cylinderGeometry args={[0, 1]} />
              <meshStandardMaterial
                emissiveIntensity={hovered ? 0.3 : -0.4}
                emissive="blue"
                toneMapped={false}
                color="blue"
              />
            </mesh>
          )}
        </Hover>
      </CustomTransformHandles>

      <CustomTransformHandles size={pivotSize} target="sphere">
        <Hover>
          {(hovered) => (
            <mesh castShadow receiveShadow scale={0.1}>
              <sphereGeometry />
              <meshStandardMaterial
                emissiveIntensity={hovered ? 0.3 : -0.4}
                emissive="green"
                toneMapped={false}
                color="green"
              />
            </mesh>
          )}
        </Hover>
      </CustomTransformHandles>
      <CustomTransformHandles size={pivotSize} target="cube">
        <Hover>
          {(hovered) => (
            <mesh castShadow receiveShadow scale={0.1}>
              <boxGeometry />
              <meshStandardMaterial
                emissiveIntensity={hovered ? 0.3 : -0.4}
                emissive="red"
                toneMapped={false}
                color="red"
              />
            </mesh>
          )}
        </Hover>
      </CustomTransformHandles>

      <RoundedBox receiveShadow rotation-x={Math.PI / 2} position-y={-0.05} scale={0.1} args={[6, 6, 0.1]}>
        <meshStandardMaterial toneMapped={false} color="purple" />
        <primitive object={lightTarget} />
      </RoundedBox>
    </>
  )
}

function CustomTransformHandles({
  target,
  children,
  size,
}: {
  size?: number
  target: ElementType
  children?: ReactNode
}) {
  const isInXR = useXR((s) => s.session != null)
  const targetRef = useRef<Group>(null)
  useEffect(() => {
    const fn = ({ position, rotation, scale }: ReturnType<typeof createDefaultTransformation>) => {
      if (targetRef.current == null) {
        return
      }
      targetRef.current.position.fromArray(position)
      targetRef.current.quaternion.fromArray(rotation)
      targetRef.current.scale.fromArray(scale)
    }
    fn(useSceneStore.getState()[`${target}Transformation`])
    return useSceneStore.subscribe((state) => fn(state[`${target}Transformation`]))
  }, [isInXR, target])
  const apply = useCallback(
    (state: HandleState<unknown>) => {
      useSceneStore.setState({
        [`${target}Transformation`]: {
          position: state.current.position.toArray(),
          rotation: state.current.quaternion.toArray(),
          scale: state.current.scale.toArray(),
        },
      })
    },
    [target],
  )
  if (isInXR) {
    return (
      <HandleTarget ref={targetRef}>
        <HandleWithAudio useTargetFromContext apply={apply}>
          {children}
        </HandleWithAudio>
      </HandleTarget>
    )
  }
  return (
    <SelectablePivotHandles size={size} target={target} apply={apply} ref={targetRef}>
      {children}
    </SelectablePivotHandles>
  )
}

const SelectablePivotHandles = forwardRef<
  Group,
  {
    size?: number
    target: ElementType
    apply?: (state: HandleState<unknown>, target: Object3D) => unknown
    children?: ReactNode
  }
>(({ children, size, apply, target }, ref) => {
  const isSelected = useSceneStore((state) => state.selected === target)
  const groupRef = useRef<Group>(null)
  useHover(groupRef, (hover, e) => {
    if (hover) {
      vibrateOnEvent(e)
    }
  })
  return (
    <group ref={groupRef} onClick={() => useSceneStore.setState({ selected: target })}>
      <PivotHandles
        size={size}
        enabled={isSelected}
        apply={(state, target) => applyWithAudioEffect(state, target, apply)}
        ref={ref}
      >
        {children}
      </PivotHandles>
    </group>
  )
})

function Hover({
  children,
  hoverTargetRef,
}: {
  hoverTargetRef?: RefObject<Object3D>
  children?: (hovered: boolean) => ReactNode
}) {
  const ref = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)
  useHover(hoverTargetRef ?? ref, (hoverd, e) => {
    setHovered(hoverd)
    if (hoverd) {
      vibrateOnEvent(e)
    }
  })
  return <group ref={ref}>{children?.(hovered)}</group>
}

function vibrateOnEvent(e: PointerEvent) {
  if (isXRInputSourceState(e.pointerState) && e.pointerState.type === 'controller') {
    e.pointerState.inputSource.gamepad?.hapticActuators[0]?.pulse(0.3, 50)
  }
}

extend({ MeshLineGeometry, MeshLineMaterial })

function StripedLineToCenter({ fromRef, width, color }: { fromRef: RefObject<Object3D>; width: number; color: Color }) {
  const ref = useRef<Mesh>(null)
  const materialRef = useRef<MeshLineMaterial>(null)
  useFrame(() => {
    if (ref.current == null || fromRef.current == null || materialRef.current == null) {
      return
    }
    const p1 = vectorHelper1.copy(fromRef.current.position)
    const p2 = vectorHelper2.set(0, 0, 0)
    materialRef.current.dashArray = (0.8 / p1.distanceTo(p2)) * 0.02
    ref.current.position.copy(p1)
    p2.sub(p1)
    const length = p2.length()
    ref.current.quaternion.setFromUnitVectors(zAxis, p2.divideScalar(length))
    ref.current.scale.setScalar(length)
  })
  return (
    <mesh ref={ref}>
      {/*@ts-ignore*/}
      <meshLineGeometry points={[0, 0, 0, 0, 0, 1]} />
      {/*@ts-ignore*/}
      <meshLineMaterial ref={materialRef} lineWidth={width} dashArray={0.03} opacity={0.5} transparent color={color} />
    </mesh>
  )
}

const handleStartAudioEffectRef: RefObject<PAudio> = { current: null }
const handleEndAudioEffectRef: RefObject<PAudio> = { current: null }

function AudioEffects() {
  return (
    <>
      <PositionalAudio loop={false} ref={handleStartAudioEffectRef} url="start.mp3" />
      <PositionalAudio loop={false} ref={handleEndAudioEffectRef} url="end.mp3" />
    </>
  )
}

function applyWithAudioEffect(state: HandleState<unknown>, target: Object3D, apply: typeof defaultApply | undefined) {
  if (state.first && handleStartAudioEffectRef.current != null) {
    target.getWorldPosition(handleStartAudioEffectRef.current.position)
    handleStartAudioEffectRef.current.setVolume(0.3)
    if (handleStartAudioEffectRef.current.isPlaying) {
      handleStartAudioEffectRef.current.stop()
    }
    handleStartAudioEffectRef.current.play()
  }
  if (state.last && handleEndAudioEffectRef.current != null) {
    target.getWorldPosition(handleEndAudioEffectRef.current.position)
    handleEndAudioEffectRef.current.setVolume(0.3)
    if (handleEndAudioEffectRef.current.isPlaying) {
      handleEndAudioEffectRef.current.stop()
    }
    handleEndAudioEffectRef.current.play()
  }
  return (apply ?? defaultApply)(state, target)
}

const HandleWithAudio = forwardRef<HandleStore<unknown>, ComponentPropsWithoutRef<typeof Handle>>((props, ref) => {
  return <Handle {...props} apply={(state, target) => applyWithAudioEffect(state, target, props.apply)} ref={ref} />
})
