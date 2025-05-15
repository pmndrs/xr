import { useXRHitTest } from '@react-three/xr'
import { onResults } from './app.js'
import { Reticle } from './reticle.js'

const HitTestHandheld = () => {
  useXRHitTest(onResults.bind(null, 'none'), 'viewer')

  return <Reticle handedness="none" />
}

export { HitTestHandheld }
