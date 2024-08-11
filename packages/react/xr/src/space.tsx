import { createGetXRSpaceMatrix } from '@pmndrs/xr/internals'
import { RootState, useFrame } from '@react-three/fiber'
import {
  ReactNode,
  RefObject,
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Group, Object3D } from 'three'
import { xrSpaceContext } from './contexts.js'
import { useXR, useXRStore } from './xr.js'

/**
 * component that puts its children at the provided space (or reference space type)
 */
export const XRSpace = forwardRef<
  Object3D,
  {
    space: XRSpace | XRReferenceSpaceType
    children?: ReactNode
  }
>(({ space, children }, ref) => {
  const internalRef = useRef<Group>(null)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const resolvedSpace = typeof space === 'string' ? useXRSpace(space) : space
  useImperativeHandle(ref, () => internalRef.current!, [])
  useApplyXRSpaceMatrix(internalRef, resolvedSpace, (_state, _delta, frame) => {
    if (internalRef.current == null) {
      return
    }
    internalRef.current.visible = frame != null
  })
  if (resolvedSpace == null) {
    return null
  }
  return (
    <group xrSpace={resolvedSpace} visible={false} matrixAutoUpdate={false} ref={internalRef}>
      <xrSpaceContext.Provider value={resolvedSpace}>{children}</xrSpaceContext.Provider>
    </group>
  )
})

/**
 * hook for retrieving getting xr space from the context
 */
export function useXRSpace(): XRSpace

export function useXRSpace(type: XRReferenceSpaceType): XRReferenceSpace | undefined

export function useXRSpace(type?: XRReferenceSpaceType): XRSpace | XRReferenceSpace | undefined {
  if (type == null) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const context = useContext(xrSpaceContext)
    if (context == null) {
      throw new Error(`XR objects must be placed inside the XROrigin`)
    }
    return context
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [referenceSpace, setReferenceSpace] = useState<XRReferenceSpace | undefined>(undefined)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const store = useXRStore()
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const { session } = store.getState()
    if (session == null) {
      return
    }
    let aborted = false
    session.requestReferenceSpace(type).then((space) => {
      if (aborted) {
        return
      }
      setReferenceSpace(space)
    })
    return () => void (aborted = true)
  }, [store, type])
  return referenceSpace
}

/**
 * hook that returns a function to compute a matrix that contains the transformation of the provided xr space
 */
export function useGetXRSpaceMatrix(space: XRSpace | undefined) {
  const localReferenceSpace = useContext(xrSpaceContext)
  const referenceSpace = useXR((xr) => localReferenceSpace ?? xr.originReferenceSpace)
  return useMemo(
    () => (space == null || referenceSpace == null ? undefined : createGetXRSpaceMatrix(space, referenceSpace)),
    [space, referenceSpace],
  )
}

/**
 * hook that applies the transformation of the provided xr space to the provided object reference
 * @param onFrame optional callback that gets executed after the matrix of the reference object was updated
 * @requires that matrixAutoUpdate is disabled for the referenced object
 */
export function useApplyXRSpaceMatrix(
  ref: RefObject<Object3D>,
  space: XRSpace | undefined,
  onFrame?: (state: RootState, delta: number, frame: XRFrame | undefined) => void,
): void {
  const getXRSpaceMatrix = useGetXRSpaceMatrix(space)
  useFrame((state, delta, frame: XRFrame | undefined) => {
    if (ref.current == null || getXRSpaceMatrix == null) {
      return
    }
    getXRSpaceMatrix(ref.current.matrix, frame)
    onFrame?.(state, delta, frame)
    //makes sure we update the frame before using the space transformation anywhere
  }, -100)
}
