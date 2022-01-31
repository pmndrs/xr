import { XRState } from 'store'
import { useXR } from './XRSessionManager'

export const useRequestXRSession: () => XRState['requestXRSession'] = useXR.bind(
  null,
  ({ requestXRSession }) => requestXRSession,
  undefined
) as any
export const useExitXRSession: () => XRState['exitXRSession'] = useXR.bind(null, ({ exitXRSession }) => exitXRSession, undefined) as any
export const useRegisterWebXRManager: () => XRState['registerWebXRManager'] = useXR.bind(
  null,
  ({ registerWebXRManager }) => registerWebXRManager,
  undefined
) as any
