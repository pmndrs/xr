import { Canvas, useThree } from '@react-three/fiber'
import { useHover, createXRStore, XR } from '@react-three/xr'
import { Environment } from '@react-three/drei'
import { Container, Text, Image, Root, setPreferredColorScheme, Fullscreen } from '@react-three/uikit'
import { Button, Slider } from '@react-three/uikit-default'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ConstructionIcon,
  ExpandIcon,
  MenuIcon,
  PlayIcon,
} from '@react-three/uikit-lucide'
import { useEffect, useRef, useState } from 'react'
import { forwardHtmlEvents } from '@pmndrs/pointer-events'

const store = createXRStore({
  hand: {
    teleportPointer: true,
    rayPointer: { cursorModel: { color: 'black' } },
    touchPointer: { cursorModel: { color: 'black' } },
  },
  controller: { teleportPointer: true },
})

setPreferredColorScheme('light')

export function App() {
  const [counter, setCounter] = useState(0)
  return (
    <>
      <button onClick={() => store.enterAR()}>Enter AR</button>
      <Canvas events={() => ({ enabled: false, priority: 0 })} style={{ width: '100%', flexGrow: 1 }}>
        <SwitchToXRPointerEvents />
        <XR store={store}>
          <Environment preset="city" />
          <group position={[0, 1.5, -0.5]}>
            <Root pointerEventsType={{ deny: 'grab' }} pixelSize={0.001}>
              <Container width="100%" display="flex" alignItems="center" justifyContent="center">
                <Container
                  dark={{ backgroundColor: 'rgb(31,41,55)' }}
                  width={384}
                  flexDirection="column"
                  height="auto"
                  backgroundColor="rgb(255,255,255)"
                  borderRadius={8}
                  overflow="hidden"
                >
                  <Container
                    dark={{ backgroundColor: 'rgb(55,65,81)' }}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    borderTopLeftRadius={8}
                    borderTopRightRadius={8}
                    backgroundColor="rgb(243,244,246)"
                    paddingLeft={16}
                    paddingRight={16}
                    paddingTop={8}
                    paddingBottom={8}
                  >
                    <Text
                      fontSize={18}
                      fontWeight={500}
                      lineHeight={28}
                      color="rgb(17,24,39)"
                      dark={{ color: 'rgb(243,244,246)' }}
                      flexDirection="column"
                    >
                      Music Player
                    </Text>
                    <Container display="flex" flexDirection="row" gapColumn={8}>
                      <ExpandIcon color="rgb(17,24,39)" dark={{ color: 'rgb(243,244,246)' }} />
                      <ConstructionIcon color="rgb(17,24,39)" dark={{ color: 'rgb(243,244,246)' }} />
                      <MenuIcon color="rgb(17,24,39)" dark={{ color: 'rgb(243,244,246)' }} />
                    </Container>
                  </Container>
                  <Container display="flex" flexDirection="column" gapRow={16} padding={16}>
                    <Container display="flex" alignItems="center" flexDirection="row" gapColumn={16}>
                      <Image height={64} src="placeholder.svg" width={64} flexDirection="column"></Image>
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
                          Bob Dylan {counter.toString()}
                        </Text>
                      </Container>
                    </Container>
                    <Slider flexGrow={1} flexShrink={1} flexBasis="0%" />
                    <Container display="flex" alignItems="center" justifyContent="space-between">
                      <Button size="icon" variant="ghost">
                        <ArrowLeftIcon color="rgb(17,24,39)" dark={{ color: 'rgb(243,244,246)' }} />
                      </Button>
                      <Button onClick={() => setCounter((c) => c + 1)} size="icon" variant="ghost" padding={8}>
                        <PlayIcon color="rgb(17,24,39)" dark={{ color: 'rgb(243,244,246)' }} />
                      </Button>
                      <Button size="icon" variant="ghost">
                        <ArrowRightIcon color="rgb(17,24,39)" dark={{ color: 'rgb(243,244,246)' }} />
                      </Button>
                    </Container>
                  </Container>
                  <Container padding={16} flexDirection="column">
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
                    <Container flexDirection="column" gapRow={8}>
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
                        <PlayIcon color="rgb(17,24,39)" dark={{ color: 'rgb(243,244,246)' }} />
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
                        <PlayIcon color="rgb(17,24,39)" dark={{ color: 'rgb(243,244,246)' }} />
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
                        <PlayIcon color="rgb(17,24,39)" dark={{ color: 'rgb(243,244,246)' }} />
                      </Container>
                    </Container>
                  </Container>
                </Container>
              </Container>
            </Root>
          </group>
        </XR>
      </Canvas>
    </>
  )
}

export function SwitchToXRPointerEvents() {
  const domElement = useThree((s) => s.gl.domElement)
  const camera = useThree((s) => s.camera)
  const scene = useThree((s) => s.scene)
  useEffect(() => forwardHtmlEvents(domElement, camera, scene), [domElement, camera, scene])
  return null
}
