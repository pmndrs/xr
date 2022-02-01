import { useThree, useFrame } from '@react-three/fiber'
import { useState, useRef } from 'react'
import { XRState } from 'store'
import { Matrix4, XRFrame, XRHandedness, XRHitTestResult, XRHitTestSource, XRReferenceSpace } from 'three'
import { useXR } from '.'

//TODO: hook to check if we are using hands

export const useXRSessionMode: () => XRState['sessionMode'] =  useXR.bind(
    null,
    ({ sessionMode }) => sessionMode,
    undefined
  ) as any

export const usePlayer: () => XRState['player'] =  useXR.bind(
    null,
    ({ player }) => player,
    undefined
  ) as any

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



export function useController(handedness: XRHandedness) {
  return useXR(({ controllers }) => controllers.find((it) => it.inputSource.handedness === handedness))
}

export const useControllers: () => XRState['controllers'] = useXR.bind(null, ({ controllers }) => controllers, undefined) as any

export function useHitTest(hitTestCallback: (hitMatrix: Matrix4, hit: XRHitTestResult) => void) {
  const { gl } = useThree()

  const hitTestSource = useRef<XRHitTestSource | undefined>()
  const hitTestSourceRequested = useRef(false)
  const [hitMatrix] = useState(() => new Matrix4())

  useFrame(() => {
    if (!gl.xr.isPresenting) return

    const session = gl.xr.getSession()
    if (!session) return

    if (!hitTestSourceRequested.current) {
      session.requestReferenceSpace('viewer').then((referenceSpace: XRReferenceSpace) => {
        session.requestHitTestSource({ space: referenceSpace }).then((source: XRHitTestSource) => {
          hitTestSource.current = source
        })
      })
      session.addEventListener(
        'end',
        () => {
          hitTestSourceRequested.current = false
          hitTestSource.current = undefined
        },
        { once: true }
      )
      hitTestSourceRequested.current = true
    }

    if (hitTestSource.current && gl.xr.isPresenting) {
      const referenceSpace = gl.xr.getReferenceSpace()

      if (referenceSpace) {
        // This raf is unnecesary, we should get XRFrame from r3f but it's not implemented yet
        session.requestAnimationFrame((time: DOMHighResTimeStamp, frame: XRFrame) => {
          const hitTestResults = frame.getHitTestResults(hitTestSource.current as XRHitTestSource)
          if (hitTestResults.length) {
            const hit = hitTestResults[0]
            const pose = hit.getPose(referenceSpace)

            if (pose) {
              hitMatrix.fromArray(pose.transform.matrix)
              hitTestCallback(hitMatrix, hit)
            }
          }
        })
      }
    }
  })
}
