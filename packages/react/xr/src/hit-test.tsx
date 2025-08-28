import { createXRHitTestSource, GetWorldMatrixFromXRHitTest, requestXRHitTest } from '@pmndrs/xr'
import { ThreeElements, useFrame } from '@react-three/fiber'
import { forwardRef, RefObject, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Group, Object3D } from 'three'
import { useStore } from 'zustand'
import { useXRStore } from './xr.js'

export { createXRHitTestSource, requestXRHitTest, type GetWorldMatrixFromXRHitTest } from '@pmndrs/xr'

/**
 * Hook for creating a hit test source originating from the provided object or XRSpace. The provided object must be statically positioned in the XRSpace.
 *
 * @param relativeTo - The XRSpace, XRReferenceSpace, or Object3D to perform hit-tests from
 * @param trackableType - A string, or array of strings that specify the types of surfaces to hit test against ('point', 'plane', 'mesh')
 *
 * @example
 * function ManualHitTest() {
 *   const meshRef = useRef<Mesh>(null)
 *   const hitTestSource = useXRHitTestSource('viewer')
 *   const [someCondition, setSomeCondition] = useState(false)
 *   const [hitResults, setHitResults] = useState<XRHitTestResult[]>([])
 *
 *   useFrame((_, __, frame: XRFrame | undefined) => {
 *     // Only perform hit testing when certain conditions are met
 *     if (frame && hitTestSource && someCondition) {
 *       const results = frame.getHitTestResults(hitTestSource.source)
 *       setHitResults(results)
 *     }
 *   })
 *   return (
 *     <IfInSessionMode allow={'immersive-ar'}>
 *       <XRDomOverlay>
 *         <button onClick={() => setSomeCondition(true)}>Turn on hit testing</button>
 *       </XRDomOverlay>
 *     </IfInSessionMode>
 *   )
 * }
 *
 * @see [Hit Test Tutorial](https://pmndrs.github.io/xr/docs/tutorials/hit-test)
 * @see [Hit Test Example](https://pmndrs.github.io/xr/examples/hit-testing/)
 */
export function useXRHitTestSource(
  relativeTo: RefObject<Object3D | null> | XRSpace | XRReferenceSpaceType,
  trackableType?: XRHitTestTrackableType | Array<XRHitTestTrackableType>,
) {
  const [source, setState] = useState<Awaited<ReturnType<typeof createXRHitTestSource>> | undefined>()
  useCreateXRHitTestSource(relativeTo, trackableType, setState)
  return source
}

/**
 * Hook for setting up a continous hit test originating from the provided object or XRSpace. The provided object must be statically positioned in the XRSpace.
 *
 * @param fn - Callback function that contains the results of the hit test, and a function to retrieve the world matrix
 * @param relativeTo - The XRSpace, XRReferenceSpace, or Object3D to perform hit-tests from
 * @param trackableType - A string, or array of strings that specify the types of surfaces to hit test against ('point', 'plane', 'mesh')
 *
 * @example
 * const matrixHelper = new Matrix4()
 * const hitTestPosition = new Vector3()
 *
 * function ContinuousHitTest() {
 *   const previewRef = useRef<Mesh>(null)
 *
 *   useXRHitTest(
 *     (results, getWorldMatrix) => {
 *       if (results.length === 0) return
 *
 *       getWorldMatrix(matrixHelper, results[0])
 *       hitTestPosition.setFromMatrixPosition(matrixHelper)
 *     },
 *     'viewer'
 *   )
 *
 *   useFrame(() => {
 *     if (hitTestPosition && previewRef.current) {
 *       previewRef.current.position.copy(hitTestPosition)
 *     }
 *   })
 *
 *   return (
 *       <mesh ref={previewRef} position={hitPosition}>
 *         <sphereGeometry args={[0.05]} />
 *         <meshBasicMaterial color="red" />
 *       </mesh>
 *   )
 * }
 *
 * @see [Hit Test Tutorial](https://pmndrs.github.io/xr/docs/tutorials/hit-test)
 * @see [Hit Test Example](https://pmndrs.github.io/xr/examples/hit-testing/)
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
 * Hook that returns a function to request a single hit test. Cannot be called in the useFrame hook.
 *
 * @example
 * const matrixHelper = new Matrix4()
 * function EventDrivenHitTest() {
 *   const requestHitTest = useXRRequestHitTest()
 *   const [placedObjects, setPlacedObjects] = useState<Vector3[]>([])
 *
 *   const handleTap = async () => {
 *     const hitTestResult = await requestHitTest('viewer', ['plane', 'mesh'])
 *     const { results, getWorldMatrix } = hitTestResult
 *     if (results?.length > 0) {
 *       getWorldMatrix(matrixHelper, results[0])
 *       const position = new Vector3().setFromMatrixPosition(matrixHelper)
 *       setPlacedObjects((prev) => [...prev, position])
 *     }
 *   }
 *
 *   return (
 *     <>
 *       <IfInSessionMode allow={'immersive-ar'}>
 *         <XRDomOverlay>
 *           <button onClick={handleTap}>Place Object</button>
 *         </XRDomOverlay>
 *       </IfInSessionMode>
 *
 *       {placedObjects.map((position, index) => (
 *         <mesh key={index} position={position}>
 *           <sphereGeometry args={[0.1]} />
 *           <meshBasicMaterial color="blue" />
 *         </mesh>
 *       ))}
 *     </>
 *   )
 * }
 *
 * @see [Hit Test Tutorial](https://pmndrs.github.io/xr/docs/tutorials/hit-test)
 * @see [Hit Test Example](https://pmndrs.github.io/xr/examples/hit-testing/)
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
 * #### `onResults` - Callback function that is called with the results of the hit test
 *
 * @example
 * const matrixHelper = new Matrix4()
 * const hitTestPosition = new Vector3()
 *
 * const store = createXRStore({
 *   hand: () => {
 *     const inputSourceState = useXRInputSourceStateContext()
 *
 *     return (
 *       <>
 *         <DefaultXRHand />
 *         <XRHitTest
 *           space={inputSourceState.inputSource.targetRaySpace}
 *           onResults={(results, getWorldMatrix) => {
 *             if (results.length === 0) return
 *             getWorldMatrix(matrixHelper, results[0])
 *             hitTestPosition.setFromMatrixPosition(matrixHelper)
 *           }}
 *         />
 *       </>
 *     )
 *   },
 * })
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
