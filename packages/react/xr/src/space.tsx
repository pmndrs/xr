import { GetXRSpace, createGetXRSpaceMatrix } from '@pmndrs/xr/internals'
import { RootState, useFrame } from '@react-three/fiber'
import { ReactNode, RefObject, forwardRef, useContext, useImperativeHandle, useMemo, useRef } from 'react'
import { Group, Object3D } from 'three'
import { xrReferenceSpaceContext } from './contexts.js'

/**
 * component that puts its children at the provided space
 */
export const XRSpace = forwardRef<
  Object3D,
  {
    space: GetXRSpace
    children?: ReactNode
  }
>(({ space, children }, ref) => {
  const internalRef = useRef<Group>(null)
  useImperativeHandle(ref, () => internalRef.current!, [])
  useApplyXRSpaceMatrix(internalRef, space, (_state, _delta, frame) => {
    if (internalRef.current == null) {
      return
    }
    internalRef.current.visible = frame != null
  })
  return (
    <group visible={false} matrixAutoUpdate={false} ref={internalRef}>
      <xrReferenceSpaceContext.Provider value={space}>{children}</xrReferenceSpaceContext.Provider>
    </group>
  )
})

/**
 * hook for retrieving getting xr reference space from the context
 */
export function useXRReferenceSpace() {
  const context = useContext(xrReferenceSpaceContext)
  if (context == null) {
    throw new Error(`XR objects must be placed inside the XROrigin`)
  }
  return context
}

/**
 * hook that returns a function to compute a matrix that contains the transformation of the provided xr space
 */
export function useGetXRSpaceMatrix(space: GetXRSpace) {
  const referenceSpace = useXRReferenceSpace()
  return useMemo(() => createGetXRSpaceMatrix(space, referenceSpace), [space, referenceSpace])
}

/**
 * hook that applies the transformation of the provided xr space to the provided object reference
 * @param onFrame optional callback that gets executed after the matrix of the reference object was updated
 * @requires that matrixAutoUpdate is disabled for the referenced object
 */
export function useApplyXRSpaceMatrix(
  ref: RefObject<Object3D>,
  space: GetXRSpace,
  onFrame?: (state: RootState, delta: number, frame: XRFrame | undefined) => void,
): void {
  const getXRSpaceMatrix = useGetXRSpaceMatrix(space)
  useFrame((state, delta, frame: XRFrame | undefined) => {
    if (ref.current == null) {
      return
    }
    getXRSpaceMatrix(ref.current.matrix, frame)
    onFrame?.(state, delta, frame)
    //makes sure we update the frame before using the space transformation anywhere
  }, -100)
}
