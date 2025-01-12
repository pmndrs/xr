import { Canvas, RootState, useFrame, useThree } from '@react-three/fiber'
import { createXRStore, noEvents, NotInXR, PointerEvents, useXR, XR, XRLayer, XROrigin } from '@react-three/xr'
import { RoundedBox } from '@react-three/drei'
import {
  OrbitHandles,
  Handle,
  HandleTarget,
  createScreenCameraStore,
  ScreenCameraStateAndFunctions,
  PivotHandles,
} from '@react-three/handle'
import { forwardRef, ReactNode, useCallback, useEffect, useMemo, useRef } from 'react'
import {
  Camera,
  DirectionalLight,
  Euler,
  Group,
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
} from 'three'
import { create } from 'zustand'
import { HandleState, HandleStore } from '@pmndrs/handle'
import { damp } from 'three/src/math/MathUtils.js'
import { getVoidObject, PointerEventsMap } from '@pmndrs/pointer-events'
import { CopyPass, EffectComposer, RenderPass, ShaderPass } from 'postprocessing'

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

const cameraStore = createScreenCameraStore({ rotationY: Math.PI, distance: 0.5 })

const store = createXRStore({ handTracking: false })

export function App() {
  return (
    <>
      <button onClick={() => store.enterVR()}>Enter VR</button>
      <button onClick={() => store.enterAR()}>Enter AR</button>
      <Canvas
        shadows="soft"
        camera={{ position: [0, 0.5, 0] }}
        events={noEvents}
        style={{ width: '100%', flexGrow: 1 }}
      >
        <color args={['black']} attach="background" />
        <group pointerEventsType={{ deny: 'touch' }}>
          <PointerEvents />
          <OrbitHandles />
          <XR store={store}>
            <XROrigin position={[0, -1, 0.5]} />
            <HandleTarget>
              <Scene />
              <Handle scale={false} multitouch={false} rotate={false}>
                <RoundedBox position-x={0.35} position-y={-0.05} args={[0.2, 0.2, 2]} scale={0.1}>
                  <meshStandardMaterial color="white" />
                </RoundedBox>
              </Handle>

              <Handle
                scale={{ uniform: true }}
                multitouch={false}
                translate="as-rotate-and-scale"
                rotate={{ x: false, z: false }}
              >
                <mesh position-x={0.35} position-z={0.35} position-y={-0.05} scale={0.02}>
                  <sphereGeometry />
                  <meshStandardMaterial color="white" />
                </mesh>
              </Handle>
              <CameraHelper />
            </HandleTarget>
            <Screen />
          </XR>
        </group>
      </Canvas>
    </>
  )
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
  const isInXR = useXR((s) => s.session != null)
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
                customRender={isInXR ? renderFunction : undefined}
                position-y={0.15}
                scale={[(0.3 * 16) / 9, 0.3, 0.3]}
                pixelWidth={1920 / 2}
                pixelHeight={1080 / 2}
              >
                <NotInXR>
                  <color attach="background" args={['white']} />
                  <OrbitHandles store={cameraStore} />
                  <Scene />
                </NotInXR>
              </XRLayer>
              <Handle translate="as-scale" scale={{ z: false, uniform: true }} rotate={false}>
                <mesh position={[(0.15 * 16) / 9 + 0.02, 0.302, 0]} scale={0.01}>
                  <sphereGeometry />
                </mesh>
              </Handle>
            </HandleTarget>
          </group>
          <Handle ref={storeRef} scale={false} multitouch={false} rotate={false}>
            <RoundedBox scale={0.1} args={[2, 0.2, 0.2]}>
              <meshStandardMaterial color="white" />
            </RoundedBox>
          </Handle>
        </group>
      </group>
    </HandleTarget>
  )
}

function CameraHelper() {
  const ref = useRef<Object3D>(null)
  useEffect(() => {
    const fn = (state: ScreenCameraStateAndFunctions) => {
      if (ref.current == null) {
        return
      }
      state.getCameraPosition(ref.current.position)
      ref.current.rotation.set(state.rotationX, state.rotationY, 0, 'YXZ')
    }
    fn(cameraStore.getState())
    return cameraStore.subscribe(fn)
  }, [])
  return (
    <HandleTarget ref={ref}>
      <Handle
        apply={(state) => cameraStore.getState().setCameraPosition(...state.current.position.toArray())}
        scale={false}
        multitouch={false}
        rotate={false}
      >
        <mesh scale={0.05}>
          <sphereGeometry />
          <meshStandardMaterial color="blue" />
        </mesh>
      </Handle>
    </HandleTarget>
  )
}

function Scene() {
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

  return (
    <>
      <ambientLight intensity={0.6} />
      <HandleTarget ref={lightGroupRef}>
        <primitive object={light} />
        <Handle
          apply={(state) => useSceneStore.setState({ lightPosition: state.current.position.toArray() })}
          scale={false}
          multitouch={false}
          rotate={false}
        >
          <mesh scale={0.01}>
            <sphereGeometry />
          </mesh>
        </Handle>
      </HandleTarget>
      <CustomTransformHandles target="cone">
        <mesh castShadow scale={0.1}>
          <cylinderGeometry args={[0, 1]} />
          <meshStandardMaterial toneMapped={false} color="blue" />
        </mesh>
      </CustomTransformHandles>

      <CustomTransformHandles target="sphere">
        <mesh castShadow scale={0.1}>
          <sphereGeometry />
          <meshStandardMaterial toneMapped={false} color="green" />
        </mesh>
      </CustomTransformHandles>
      <CustomTransformHandles target="cube">
        <mesh castShadow scale={0.1}>
          <boxGeometry />
          <meshStandardMaterial toneMapped={false} color="red" />
        </mesh>
      </CustomTransformHandles>

      <RoundedBox receiveShadow rotation-x={Math.PI / 2} position-y={-0.05} scale={0.1} args={[6, 6, 0.1]}>
        <meshStandardMaterial toneMapped={false} color="purple" />
        <primitive object={lightTarget} />
      </RoundedBox>
    </>
  )
}

function CustomTransformHandles({ target, children }: { target: ElementType; children?: ReactNode }) {
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
        <Handle apply={apply}>{children}</Handle>
      </HandleTarget>
    )
  }
  return (
    <SelectablePivotHandles target={target} apply={apply} ref={targetRef}>
      {children}
    </SelectablePivotHandles>
  )
}

const SelectablePivotHandles = forwardRef<
  Group,
  { target: ElementType; apply?: (state: HandleState<unknown>, target: Object3D) => unknown; children?: ReactNode }
>(({ children, apply, target }, ref) => {
  const isSelected = useSceneStore((state) => state.selected === target)
  return (
    <group onClick={() => useSceneStore.setState({ selected: target })}>
      <PivotHandles enabled={isSelected} apply={apply} ref={ref}>
        {children}
      </PivotHandles>
    </group>
  )
})
