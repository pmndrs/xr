import { Signal, computed } from '@preact/signals'
import { Environment } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { Handle, HandleStore, HandleTarget, OrbitHandles } from '@react-three/handle'
import {
  Container,
  Text,
  Image,
  setPreferredColorScheme,
  withOpacity,
  VanillaContainer,
} from '@react-three/uikit'
import { Button, colors, Slider } from '@react-three/uikit-default'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BackpackIcon,
  ConstructionIcon,
  ExpandIcon,
  HeartIcon,
  ListIcon,
  MenuIcon,
  PlayIcon,
} from '@react-three/uikit-lucide'
import { createXRStore, noEvents, PointerEvents, useXR, XR, XROrigin } from '@react-three/xr'
import { forwardRef, RefObject, useMemo, useRef } from 'react'
import { Euler, Group, MeshPhysicalMaterial, Object3D, Quaternion, Vector3 } from 'three'
import { clamp, damp } from 'three/src/math/MathUtils.js'

export class GlassMaterial extends MeshPhysicalMaterial {
  constructor() {
    super({
      transmission: 0.5,
      roughness: 0.3,
      reflectivity: 0.5,
      iridescence: 0.4,
      thickness: 0.05,
      specularIntensity: 1,
      metalness: 0.3,
      ior: 2,
      envMapIntensity: 1,
    })
  }
}

export class MetalMaterial extends MeshPhysicalMaterial {
  constructor() {
    super({
      metalness: 1,
      roughness: 0.25,
      envMapIntensity: 0.8,
      clearcoat: 1,
      clearcoatRoughness: 0.25,
    })
  }
}

const store = createXRStore({ foveation: 0, emulate: { syntheticEnvironment: false } })

setPreferredColorScheme('dark')

export function App() {
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
        events={noEvents}
        gl={{ localClippingEnabled: true }}
        style={{ width: '100%', flexGrow: 1 }}
        camera={{ position: [0, 0, 0.65] }}
      >
        <PointerEvents batchEvents={false} />
        <OrbitHandles />
        <XR store={store}>
          <NonAREnvironment />
          <XROrigin position-y={-1.5} position-z={0.5} />
          <MusicPlayer />
        </XR>
      </Canvas>
    </>
  )
}
function NonAREnvironment() {
  const inAR = useXR((s) => s.mode === 'immersive-ar')
  return <Environment blur={0.2} background={!inAR} environmentIntensity={2} preset="city" />
}

const eulerHelper = new Euler()
const quaternionHelper = new Quaternion()
const vectorHelper1 = new Vector3()
const vectorHelper2 = new Vector3()
const zAxis = new Vector3(0, 0, 1)

function MusicPlayer() {
  const ref = useRef<Group>(null)
  const storeRef = useRef<HandleStore<any>>(null)
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
  const height = useMemo(() => new Signal(450), [])
  const width = useMemo(() => new Signal(700), [])
  const menuWidth = useMemo(() => new Signal(200), [])
  const showSidePanel = useMemo(() => computed(() => width.value > 500), [width])
  const sidePanelDisplay = useMemo(() => computed(() => (showSidePanel.value ? 'flex' : 'none')), [showSidePanel])
  const borderLeftRadius = useMemo(() => computed(() => (showSidePanel.value ? 0 : 16)), [showSidePanel])
  const paddingLeft = useMemo(() => computed(() => (showSidePanel.value ? 20 : 0)), [showSidePanel])
  const intialMaxHeight = useRef<number>(undefined)
  const intialWidth = useRef<number>(undefined)
  const containerRef = useRef<VanillaContainer>(null)
  const handleRef = useMemo(
    () =>
      new Proxy<RefObject<Object3D | null>>({ current: null }, { get: () => containerRef.current }),
    [],
  )
  const innerTarget = useRef<Object3D>(null)
  return (
    <group position-y={-0.3}>
      <HandleTarget>
        <group ref={ref} pointerEventsType={{ deny: 'grab' }}>
          <group ref={innerTarget}>
            <Container
              anchorY="bottom"
              width={width}
              height={height}
              alignItems="center"
              pixelSize={0.0015}
              flexDirection="column"
              {...{ '*': { borderColor: colors.background } }}
            >
              <Container flexDirection="row" width="100%" height={26} flexShrink={0} justifyContent="flex-end">
                <Handle
                  translate="as-scale"
                  targetRef={innerTarget}
                  apply={(state) => {
                    if (state.first) {
                      intialMaxHeight.current = height.value
                      intialWidth.current = width.value
                    } else if (intialMaxHeight.current != null && intialWidth.current != null) {
                      height.value = clamp(state.current.scale.y * intialMaxHeight.current, 250, 700)
                      width.value = clamp(state.current.scale.x * intialWidth.current, 300, 1000)
                    }
                  }}
                  handleRef={handleRef}
                  rotate={false}
                  multitouch={false}
                  scale={{ z: false }}
                >
                  <Container
                    ref={containerRef}
                    pointerEventsType={{ deny: 'touch' }}
                    width={26}
                    height={26}
                    backgroundColor={colors.background}
                    borderRadius={100}
                    panelMaterialClass={GlassMaterial}
                    borderBend={0.4}
                    borderWidth={4}
                  ></Container>
                </Handle>
              </Container>
              <Container flexDirection="row" flexGrow={1} width="100%">
                <Container alignItems="center" flexGrow={1} flexDirection="column-reverse" gapRow={8}>
                  <BarHandle ref={storeRef} />
                  <Container
                    display="flex"
                    alignItems="center"
                    flexShrink={0}
                    paddingLeft={16}
                    paddingRight={16}
                    paddingTop={4}
                    paddingBottom={4}
                    backgroundColor={colors.background}
                    borderRadius={16}
                    panelMaterialClass={MetalMaterial}
                    borderBend={0.4}
                    borderWidth={4}
                    flexDirection="row"
                    gapColumn={16}
                    width="90%"
                    zIndex={1}
                    marginTop={-30}
                    maxWidth={350}
                    maxHeight={40}
                    pointerEvents="none"
                  >
                    <MenuIcon width={16} color="rgb(17,24,39)" dark={{ color: 'rgb(243,244,246)' }} />
                    <Text
                      fontSize={14}
                      fontWeight={500}
                      lineHeight={28}
                      color="rgb(17,24,39)"
                      dark={{ color: 'rgb(243,244,246)' }}
                    >
                      Music Player
                    </Text>
                    <Container flexGrow={1} />
                    <ExpandIcon width={16} color="rgb(17,24,39)" dark={{ color: 'rgb(243,244,246)' }} />
                    <ConstructionIcon width={16} color="rgb(17,24,39)" dark={{ color: 'rgb(243,244,246)' }} />
                  </Container>
                  <Container width="100%" flexDirection="row" flexGrow={1}>
                    <Container
                      display={sidePanelDisplay}
                      flexDirection="column"
                      borderLeftRadius={16}
                      backgroundColor="#555555"
                      borderColor="#555555"
                      panelMaterialClass={GlassMaterial}
                      borderWidth={4}
                      borderRightWidth={2}
                      borderBend={0.4}
                      width={menuWidth}
                      height="100%"
                      padding={16}
                      gapRow={16}
                      flexShrink={1}
                    >
                      <WidthHandle targetRef={innerTarget} width={menuWidth} />
                      <Text marginBottom={8} fontSize={20} fontWeight="semi-bold" color={colors.cardForeground}>
                        Your Content
                      </Text>

                      <Container flexDirection="row" alignItems="center" justifyContent="space-between">
                        <Text color={colors.cardForeground}>Playlists</Text>
                        <ListIcon width={16} color={colors.cardForeground} />
                      </Container>
                      <Container flexDirection="row" alignItems="center" justifyContent="space-between">
                        <Text color={colors.cardForeground}>Favorites</Text>
                        <HeartIcon width={16} color={colors.cardForeground} />
                      </Container>

                      <Container flexDirection="row" alignItems="center" justifyContent="space-between">
                        <Text color={colors.cardForeground}>History</Text>
                        <BackpackIcon width={16} color={colors.cardForeground} />
                      </Container>
                    </Container>

                    <Container
                      flexGrow={1}
                      scrollbarBorderRadius={4}
                      scrollbarColor={withOpacity(colors.foreground, 0.2)}
                      flexDirection="column"
                      overflow="scroll"
                      paddingLeft={paddingLeft}
                      panelMaterialClass={GlassMaterial}
                      borderBend={0.4}
                      backgroundColor={colors.background}
                      borderRadius={16}
                      borderLeftRadius={borderLeftRadius}
                      borderWidth={4}
                      borderLeftWidth={0}
                    >
                      <Container flexShrink={0} padding={16} flexDirection="column" gapRow={16}>
                        <Container display="flex" flexDirection="row" gapColumn={16}>
                          <Image height={64} src="picture.jpg" width={64} aspectRatio={1} objectFit="cover" borderRadius={1000} />
                          <Container flexDirection="column" justifyContent="center" gapRow={4}>
                            <Text fontSize={18} fontWeight={500} color="rgb(17,24,39)" dark={{ color: 'rgb(243,244,246)' }}>
                              Blowin' in the Wind
                            </Text>
                            <Text fontSize={14} color="rgb(107,114,128)" dark={{ color: 'rgb(156,163,175)' }}>
                              Bob Dylan
                            </Text>
                          </Container>
                        </Container>
                        <Container paddingX={16}>
                          <Slider defaultValue={[50]} />
                        </Container>
                        <Container display="flex" justifyContent="space-between">
                          <Button size="icon" variant="ghost">
                            <ArrowLeftIcon color="rgb(17,24,39)" dark={{ color: 'rgb(243,244,246)' }} />
                          </Button>
                          <Button size="icon" variant="ghost" padding={8}>
                            <PlayIcon color="rgb(17,24,39)" dark={{ color: 'rgb(243,244,246)' }} />
                          </Button>
                          <Button size="icon" variant="ghost">
                            <ArrowRightIcon color="rgb(17,24,39)" dark={{ color: 'rgb(243,244,246)' }} />
                          </Button>
                        </Container>
                      </Container>
                      <Container flexShrink={0} padding={16} flexDirection="column" gapRow={8}>
                        <Text fontSize={18} fontWeight={500} color="rgb(17,24,39)" dark={{ color: 'rgb(243,244,246)' }} marginBottom={8}>
                          Playlist
                        </Text>
                        <Container flexDirection="column" gapRow={12}>
                          <Container display="flex" alignItems="center" justifyContent="space-between">
                            <Text fontSize={14} color="rgb(17,24,39)" dark={{ color: 'rgb(243,244,246)' }}>
                              Like a Rolling Stone
                            </Text>
                            <PlayIcon width={20} color="rgb(17,24,39)" dark={{ color: 'rgb(243,244,246)' }} />
                          </Container>
                          <Container display="flex" alignItems="center" justifyContent="space-between">
                            <Text fontSize={14} color="rgb(17,24,39)" dark={{ color: 'rgb(243,244,246)' }}>
                              The Times They Are a-Changin'
                            </Text>
                            <PlayIcon width={20} color="rgb(17,24,39)" dark={{ color: 'rgb(243,244,246)' }} />
                          </Container>
                          <Container display="flex" alignItems="center" justifyContent="space-between">
                            <Text fontSize={14} color="rgb(17,24,39)" dark={{ color: 'rgb(243,244,246)' }}>
                              Subterranean Homesick Blues
                            </Text>
                            <PlayIcon width={20} color="rgb(17,24,39)" dark={{ color: 'rgb(243,244,246)' }} />
                          </Container>
                          <Container display="flex" alignItems="center" justifyContent="space-between">
                            <Text fontSize={14} color="rgb(17,24,39)" dark={{ color: 'rgb(243,244,246)' }}>
                              Like a Rolling Stone
                            </Text>
                            <PlayIcon width={20} color="rgb(17,24,39)" dark={{ color: 'rgb(243,244,246)' }} />
                          </Container>
                        </Container>
                      </Container>
                    </Container>
                  </Container>
                </Container>
                <Container width={26} flexShrink={0} />
              </Container>
            </Container>
          </group>
        </group>
      </HandleTarget>
    </group>
  )
}

function WidthHandle({ width, targetRef }: { width: Signal<number>; targetRef: RefObject<Object3D | null> }) {
  const containerRef = useRef<VanillaContainer>(null)
  const handleRef = useMemo(
    () =>
      new Proxy<RefObject<Object3D | null>>({ current: null }, { get: () => containerRef.current }),
    [],
  )
  const initialWidth = useRef<number>(undefined)
  return (
    <Handle
      apply={(state) => {
        if (state.first) {
          initialWidth.current = width.value
        } else if (initialWidth.current != null && containerRef.current != null) {
          width.value = clamp(
            initialWidth.current + state.offset.position.x / containerRef.current.properties.value.pixelSize,
            150,
            300,
          )
        }
      }}
      handleRef={handleRef}
      targetRef={targetRef}
      scale={false}
      multitouch={false}
      rotate={false}
    >
      <Container
        ref={containerRef}
        positionType="absolute"
        height="90%"
        maxHeight={200}
        positionRight={-20}
        positionTop="50%"
        transformTranslateY="-50%"
        width={10}
        backgroundColor={withOpacity('white', 0.2)}
        borderRadius={5}
        hover={{ backgroundColor: withOpacity('white', 0.5) }}
        cursor="pointer"
      ></Container>
    </Handle>
  )
}

const BarHandle = forwardRef<HandleStore<any>, {}>((props, ref) => {
  const containerRef = useRef<VanillaContainer>(null)
  const handleRef = useMemo(
    () =>
      new Proxy<RefObject<Object3D | null>>({ current: null }, { get: () => containerRef.current }),
    [],
  )
  return (
    <Handle ref={ref} handleRef={handleRef} targetRef="from-context" scale={false} multitouch={false} rotate={false}>
      <Container
        ref={containerRef}
        panelMaterialClass={GlassMaterial}
        borderBend={0.4}
        borderWidth={4}
        pointerEventsType={{ deny: 'touch' }}
        marginTop={4}
        hover={{
          backgroundColor: colors.accent,
          transformScaleX: 1.2,
          transformScaleY: 1.3,
          transformTranslateY: 2,
        }}
        cursor="pointer"
        width="90%"
        maxWidth={200}
        height={14}
        borderRadius={10}
        backgroundColor={colors.background}
        marginX={20}
      ></Container>
    </Handle>
  )
})
