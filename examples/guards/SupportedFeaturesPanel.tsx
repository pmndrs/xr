import { Container, Text } from '@react-three/uikit'
import { useXRSessionFeatureEnabled } from '@react-three/xr'

interface SupportedFeaturesPanelProps {
  position?: [number, number, number]
}

export const SupportedFeaturesPanel = ({ position }: SupportedFeaturesPanelProps) => {
  const canUseAnchors = useXRSessionFeatureEnabled('anchors')
  const canUseBoundedFloor = useXRSessionFeatureEnabled('bounded-floor')
  const canUseDepthSensing = useXRSessionFeatureEnabled('depth-sensing')
  const canUseDomOverlay = useXRSessionFeatureEnabled('dom-overlay')
  const canUseHandTracking = useXRSessionFeatureEnabled('hand-tracking')
  const canUseHitTest = useXRSessionFeatureEnabled('hit-test')
  const canUseLayers = useXRSessionFeatureEnabled('layers')
  const canUseLightEstimation = useXRSessionFeatureEnabled('light-estimation')
  const canUseLocal = useXRSessionFeatureEnabled('local')
  const canUseLocalFloor = useXRSessionFeatureEnabled('local-floor')
  const canUseSecondaryViews = useXRSessionFeatureEnabled('secondary-views')
  const canUseUnbounded = useXRSessionFeatureEnabled('unbounded')
  const canUseViewer = useXRSessionFeatureEnabled('viewer')

  const getTextColor = (enabled: boolean) => (enabled ? 'lightgreen' : 'red')

  return (
    <group position={position}>
      <Container
        width={200}
        height={280}
        padding={5}
        backgroundColor={'#222222'}
        borderRadius={0.5}
        display={'flex'}
        flexDirection={'column'}
      >
        <Text color={'white'}>{'Supported Features:'}</Text>
        <Text color={getTextColor(canUseAnchors)}>{`Anchors: ${canUseAnchors}`}</Text>
        <Text color={getTextColor(canUseBoundedFloor)}>{`Bounded Floor: ${canUseBoundedFloor}`}</Text>
        <Text color={getTextColor(canUseDepthSensing)}>{`Depth Sensing: ${canUseDepthSensing}`}</Text>
        <Text color={getTextColor(canUseDomOverlay)}>{`DOM Overlay: ${canUseDomOverlay}`}</Text>
        <Text color={getTextColor(canUseHandTracking)}>{`Hand Tracking: ${canUseHandTracking}`}</Text>
        <Text color={getTextColor(canUseHitTest)}>{`Hit Test: ${canUseHitTest}`}</Text>
        <Text color={getTextColor(canUseLayers)}>{`Layers: ${canUseLayers}`}</Text>
        <Text color={getTextColor(canUseLightEstimation)}>{`Light Estimation: ${canUseLightEstimation}`}</Text>
        <Text color={getTextColor(canUseLocal)}>{`Local: ${canUseLocal}`}</Text>
        <Text color={getTextColor(canUseLocalFloor)}>{`Local Floor: ${canUseLocalFloor}`}</Text>
        <Text color={getTextColor(canUseSecondaryViews)}>{`Secondary Views: ${canUseSecondaryViews}`}</Text>
        <Text color={getTextColor(canUseUnbounded)}>{`Unbounded: ${canUseUnbounded}`}</Text>
        <Text color={getTextColor(canUseViewer)}>{`Viewer: ${canUseViewer}`}</Text>
      </Container>
    </group>
  )
}
