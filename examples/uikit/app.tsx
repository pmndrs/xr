import { Signal, computed } from '@preact/signals'
import { Environment } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { Handle, HandleStore, HandleTarget, OrbitHandles } from '@react-three/handle'
import {
  Container,
  Text,
  Image,
  Root,
  setPreferredColorScheme,
  ComponentInternals,
  DefaultProperties,
  MetalMaterial,
} from '@react-three/uikit'
import { Button, colors, Defaults, Slider } from '@react-three/uikit-default'
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
  const containerRef = useRef<ComponentInternals>(null)
  const handleRef = useMemo(
    () =>
      new Proxy<RefObject<Object3D | null>>({ current: null }, { get: () => containerRef.current?.interactionPanel }),
    [],
  )
  const innerTarget = useRef<Object3D>(null)
  return (
    <group position-y={-0.3}>
      <HandleTarget>
        <group ref={ref} pointerEventsType={{ deny: 'grab' }}>
          <group ref={innerTarget}>
            <DefaultProperties borderColor={colors.background}>
              <Defaults>
                <Root
                  anchorY="bottom"
                  width={width}
                  height={height}
                  alignItems="center"
                  flexDirection="column"
                  pixelSize={0.0015}
                >
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
                      pointerEventsType={{ deny: 'touch' }}
                      ref={containerRef}
                      positionType="absolute"
                      positionTop={-26}
                      width={26}
                      height={26}
                      backgroundColor={colors.background}
                      borderRadius={100}
                      positionRight={-26}
                      panelMaterialClass={GlassMaterial}
                      borderBend={0.4}
                      borderWidth={4}
                    ></Container>
                  </Handle>
                  <Container alignItems="center" flexGrow={1} width="100%" flexDirection="column-reverse" gapRow={8}>
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
                      zIndexOffset={10}
                      transformTranslateZ={10}
                      marginTop={-30}
                      maxWidth={350}
                      pointerEvents="none"
                    >
                      <MenuIcon width={16} color="rgb(17,24,39)" dark={{ color: 'rgb(243,244,246)' }} />
                      <Text
                        fontSize={14}
                        fontWeight={500}
                        lineHeight={28}
                        color="rgb(17,24,39)"
                        dark={{ color: 'rgb(243,244,246)' }}
                        flexDirection="column"
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
                        scrollbarOpacity={0.2}
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
                        <Container flexShrink={0} display="flex" flexDirection="column" gapRow={16} padding={32}>
                          <Container display="flex" alignItems="center" flexDirection="row" gapColumn={16}>
                            <Image
                              height={64}
                              src="picture.jpg"
                              width={64}
                              aspectRatio={1}
                              objectFit="cover"
                              borderRadius={1000}
                              flexDirection="column"
                            ></Image>
                            <Container flexGrow={1} flexShrink={1} flexBasis="0%" flexDirection="column" gapRow={4}>
                              <Text
                                fontSize={18}
                                fontWeight={500}
                                lineHeight={28}
                                color="rgb(17,24,39)"
                                dark={{ color: 'rgb(243,244,246)' }}
                                flexDirection="column"
                              >
                                Blowin' in the Wind
                              </Text>
                              <Text
                                fontSize={14}
                                lineHeight={20}
                                color="rgb(107,114,128)"
                                dark={{ color: 'rgb(156,163,175)' }}
                                flexDirection="column"
                              >
                                Bob Dylan
                              </Text>
                            </Container>
                          </Container>
                          <Slider />
                          <Container display="flex" alignItems="center" justifyContent="space-between">
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
                        <Container flexShrink={0} padding={16} flexDirection="column">
                          <Text
                            fontSize={18}
                            fontWeight={500}
                            lineHeight={28}
                            color="rgb(17,24,39)"
                            dark={{ color: 'rgb(243,244,246)' }}
                            marginBottom={8}
                            flexDirection="column"
                          >
                            Playlist
                          </Text>
                          <Container flexDirection="column" gapRow={16}>
                            <Container display="flex" alignItems="center" justifyContent="space-between">
                              <Text
                                fontSize={14}
                                lineHeight={20}
                                color="rgb(17,24,39)"
                                dark={{ color: 'rgb(243,244,246)' }}
                                flexDirection="column"
                              >
                                Like a Rolling Stone
                              </Text>
                              <PlayIcon width={20} color="rgb(17,24,39)" dark={{ color: 'rgb(243,244,246)' }} />
                            </Container>
                            <Container display="flex" alignItems="center" justifyContent="space-between">
                              <Text
                                fontSize={14}
                                lineHeight={20}
                                color="rgb(17,24,39)"
                                dark={{ color: 'rgb(243,244,246)' }}
                                flexDirection="column"
                              >
                                The Times They Are a-Changin'
                              </Text>
                              <PlayIcon width={20} color="rgb(17,24,39)" dark={{ color: 'rgb(243,244,246)' }} />
                            </Container>
                            <Container display="flex" alignItems="center" justifyContent="space-between">
                              <Text
                                fontSize={14}
                                lineHeight={20}
                                color="rgb(17,24,39)"
                                dark={{ color: 'rgb(243,244,246)' }}
                                flexDirection="column"
                              >
                                Subterranean Homesick Blues
                              </Text>
                              <PlayIcon width={20} color="rgb(17,24,39)" dark={{ color: 'rgb(243,244,246)' }} />
                            </Container>
                            <Container display="flex" alignItems="center" justifyContent="space-between">
                              <Text
                                fontSize={14}
                                lineHeight={20}
                                color="rgb(17,24,39)"
                                dark={{ color: 'rgb(243,244,246)' }}
                                flexDirection="column"
                              >
                                Like a Rolling Stone
                              </Text>
                              <PlayIcon width={20} color="rgb(17,24,39)" dark={{ color: 'rgb(243,244,246)' }} />
                            </Container>
                          </Container>
                        </Container>
                      </Container>
                    </Container>
                  </Container>
                  <BarHandle ref={storeRef} />
                </Root>
              </Defaults>
            </DefaultProperties>
          </group>
        </group>
      </HandleTarget>
    </group>
  )
}

function WidthHandle({ width, targetRef }: { width: Signal<number>; targetRef: RefObject<Object3D | null> }) {
  const containerRef = useRef<ComponentInternals>(null)
  const handleRef = useMemo(
    () =>
      new Proxy<RefObject<Object3D | null>>({ current: null }, { get: () => containerRef.current?.interactionPanel }),
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
            initialWidth.current + state.offset.position.x / containerRef.current.pixelSize.value,
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
        backgroundColor="white"
        backgroundOpacity={0.2}
        borderRadius={5}
        hover={{ backgroundOpacity: 0.5 }}
        cursor="pointer"
      ></Container>
    </Handle>
  )
}

const BarHandle = forwardRef<HandleStore<any>, {}>((props, ref) => {
  const containerRef = useRef<ComponentInternals>(null)
  const handleRef = useMemo(
    () =>
      new Proxy<RefObject<Object3D | null>>({ current: null }, { get: () => containerRef.current?.interactionPanel }),
    [],
  )
  return (
    <Handle ref={ref} handleRef={handleRef} targetRef="from-context" scale={false} multitouch={false} rotate={false}>
      <Container
        panelMaterialClass={GlassMaterial}
        borderBend={0.4}
        borderWidth={4}
        pointerEventsType={{ deny: 'touch' }}
        marginTop={10}
        hover={{
          maxWidth: 240,
          width: '100%',
          backgroundColor: colors.accent,
          marginX: 10,
          marginTop: 6,
          height: 18,
          transformTranslateY: 2,
        }}
        cursor="pointer"
        ref={containerRef}
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
