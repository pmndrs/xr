import { createXRHitTestSource, GetWorldMatrixFromXRHitTest, requestXRHitTest } from '@pmndrs/xr'
import { ThreeElements, useFrame } from '@react-three/fiber'
import { forwardRef, RefObject, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Group, Object3D } from 'three'
import { useStore } from 'zustand'
import { useXRStore } from './xr.js'

export { createXRHitTestSource, requestXRHitTest, type GetWorldMatrixFromXRHitTest } from '@pmndrs/xr'

/**
 * Hook for creating a hit test source originating from the provided object or xrspace
 */
export function useXRHitTestSource(
  relativeTo: RefObject<Object3D | null> | XRSpace | XRReferenceSpaceType,
  trackableType?: XRHitTestTrackableType | Array<XRHitTestTrackableType>,
) {
  const [source, setState] = useState<Awaited<ReturnType<typeof createXRHitTestSource>> | undefined>()
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useCreateXRHitTestSource(relativeTo, trackableType, setState)
  return source
}

/**
 * Hook for setting up a continous hit test originating from the provided object or xrspace
 */
export function useXRHitTest(
  fn: ((results: Array<XRHitTestResult>, getWorldMatrix: GetWorldMatrixFromXRHitTest) => void) | undefined,
  relativeTo: RefObject<Object3D | null> | XRSpace | XRReferenceSpaceType,
  trackableType?: XRHitTestTrackableType | Array<XRHitTestTrackableType>,
) {
  const sourceRef = useRef<Awaited<ReturnType<typeof createXRHitTestSource>>>(undefined)
  useCreateXRHitTestSource(
    relativeTo,
    trackableType,
    useCallback((source) => (sourceRef.current = source), []),
  )
  useFrame((_s, _d, frame: XRFrame | undefined) => {
    if (fn == null || frame == null || sourceRef.current == null) {
      return
    }
    fn(frame.getHitTestResults(sourceRef.current.source), sourceRef.current.getWorldMatrix)
  })
}

function useCreateXRHitTestSource(
  relativeTo: RefObject<Object3D | null> | XRSpace | XRReferenceSpaceType,
  trackableType: undefined | XRHitTestTrackableType | Array<XRHitTestTrackableType>,
  onLoad: (result: Awaited<ReturnType<typeof createXRHitTestSource>>) => void,
) {
  const store = useXRStore()
  const session = useStore(store, (s) => s.session)
  useEffect(() => {
    if (session == null) {
      return
    }
    let storedResult: Awaited<ReturnType<typeof createXRHitTestSource>>
    let cancelled = false
    const relativeToResolved =
      relativeTo instanceof XRSpace || typeof relativeTo === 'string' ? relativeTo : relativeTo?.current
    if (relativeToResolved == null) {
      return
    }
    createXRHitTestSource(store, session, relativeToResolved, trackableType).then((result) => {
      if (cancelled) {
        return
      }
      storedResult = result
      onLoad(result)
    })
    return () => {
      onLoad(undefined)
      cancelled = true
      storedResult?.source.cancel()
    }
  }, [session, store, relativeTo, trackableType, onLoad])
}

/**
 * Hook that returns a function to request a single hit test
 */
export function useXRRequestHitTest() {
  const store = useXRStore()
  return useCallback(
    (
      relativeTo: RefObject<Object3D | null> | XRSpace | XRReferenceSpaceType,
      trackableType?: XRHitTestTrackableType | Array<XRHitTestTrackableType>,
    ) => {
      const relativeToResolved =
        relativeTo instanceof XRSpace || typeof relativeTo === 'string' ? relativeTo : relativeTo.current
      if (relativeToResolved == null) {
        return
      }
      return requestXRHitTest(store, relativeToResolved, trackableType)
    },
    [store],
  )
}

/**
 * A convenience wrapper component for the useXRHitTest hook. Used to setup hit testing in the scene.
 *
 * @param props
 * #### `space` - [XRSpaceType](https://developer.mozilla.org/en-US/docs/Web/API/XRSpace) | [XRReferenceSpaceType](https://developer.mozilla.org/en-US/docs/Web/API/XRReferenceSpace#reference_space_types)
 *
 * @see [Hit Test Tutorial](https://pmndrs.github.io/xr/docs/tutorials/hit-test)
 * @see [Hit Test Example](https://pmndrs.github.io/xr/examples/hit-testing/)
 * @function
 */
export const XRHitTest = forwardRef<
  Group,
  Omit<ThreeElements['group'], 'children'> & {
    space?: XRSpace | XRReferenceSpaceType
    trackableType?: XRHitTestTrackableType | Array<XRHitTestTrackableType>
    onResults?: (results: Array<XRHitTestResult>, getWorldMatrix: GetWorldMatrixFromXRHitTest) => void
  }
>(({ trackableType, onResults, space, ...rest }, ref) => {
  const internalRef = useRef<Group>(null)
  useImperativeHandle(ref, () => internalRef.current!)
  useXRHitTest(onResults, space ?? internalRef, trackableType)
  return <group {...rest} ref={internalRef} />
})
