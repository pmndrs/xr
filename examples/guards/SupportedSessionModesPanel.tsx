import { Container, Text } from '@react-three/uikit'
import { useXRSessionModeSupported } from '@react-three/xr'

interface SupportedSessionModesPanelProps {
  position?: [number, number, number]
}

export const SupportedSessionModesPanel = ({ position }: SupportedSessionModesPanelProps) => {
  const supportsImmersiveVR = useXRSessionModeSupported('immersive-vr')
  const supportsImmersiveAR = useXRSessionModeSupported('immersive-ar')
  const supportsInline = useXRSessionModeSupported('inline')

  const getTextColor = (supported?: boolean) => (supported ? 'lightgreen' : 'red')

  return (
    <group position={position}>
      <Container
        width={200}
        height={120}
        padding={5}
        backgroundColor={'#222222'}
        borderRadius={0.5}
        display={'flex'}
        flexDirection={'column'}
      >
        <Text color={'white'}>{'Supported Session Modes:'}</Text>
        <Text color={getTextColor(supportsImmersiveVR)}>{`Immersive VR: ${supportsImmersiveVR}`}</Text>
        <Text color={getTextColor(supportsImmersiveAR)}>{`Immersive AR: ${supportsImmersiveAR}`}</Text>
        <Text color={getTextColor(supportsInline)}>{`Inline: ${supportsInline}`}</Text>
      </Container>
    </group>
  )
}
