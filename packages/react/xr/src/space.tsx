import { createGetXRSpaceMatrix } from '@pmndrs/xr/internals'
import { RootState, useFrame } from '@react-three/fiber'
import {
  ReactNode,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Group, Object3D } from 'three'
import { xrSpaceContext } from './contexts.js'
import { useXRInputSourceStateContext } from './input.js'
import { useXR } from './xr.js'

/**
 * Component that puts its children in the provided XRSpace (or reference space type)
 *
 * @param props
 * * `space`: [XRSpaceType](https://developer.mozilla.org/en-US/docs/Web/API/XRSpace) | [XRSpaceType](https://pmndrs.github.io/xr/docs/api/space.XRSpaceType)
 * * `children`: [ReactNode](https://reactjs.org/docs/introducing-jsx.html#react-jsx)
 * @function
 */
export const XRSpace = forwardRef<
  Object3D,
  {
    space: XRSpace | XRSpaceType
    children?: ReactNode
  }
>(({ space, children }, ref) => {
  const internalRef = useRef<Group | null>(null)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const resolvedSpace = typeof space === 'string' ? useXRSpace(space) : space
  useImperativeHandle(ref, () => internalRef.current!, [])
  useApplyXRSpaceMatrix(internalRef, resolvedSpace)
  const setRef = useCallback((group: Group | null) => {
    if (group != null) {
      group.transformReady = false
      group.visible = false
    }
    internalRef.current = group
  }, [])
  return (
    <group xrSpace={resolvedSpace} matrixAutoUpdate={false} ref={setRef}>
      {resolvedSpace && <xrSpaceContext.Provider value={resolvedSpace}>{children}</xrSpaceContext.Provider>}
    </group>
  )
})

/**
 * A combined type of all XRSpace types
 * @see [XRReferenceSpaceType](https://developer.mozilla.org/en-US/docs/Web/API/XRReferenceSpaceType)
 * @see [XRInputSourceSpaceType](https://developer.mozilla.org/en-US/docs/Web/API/XRInputSourceSpaceType)
 * @see [XRHandJointSpaceType](https://developer.mozilla.org/en-US/docs/Web/API/XRHandJointSpaceType)
 * @see [XRBodyJointSpaceType](https://developer.mozilla.org/en-US/docs/Web/API/XRBodyJointSpaceType)
 */
export type XRSpaceType = XRReferenceSpaceType | XRInputSourceSpaceType | XRHandJointSpaceType | XRBodyJointSpaceType

export type XRInputSourceSpaceType = 'grip-space' | 'target-ray-space'

export type XRHandJointSpaceType = XRHandJoint

export type XRBodyJointSpaceType = XRBodyJoint

/**
 * Hook for retrieving XR space from the context
 */
export function useXRSpace(): XRSpace

export function useXRSpace(type: XRReferenceSpaceType): XRReferenceSpace | undefined

export function useXRSpace(type: XRSpaceType): XRSpace | undefined

export function useXRSpace(type?: XRSpaceType): XRSpace | XRReferenceSpace | undefined {
  switch (type) {
    case 'grip-space':
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useXRInputSourceStateContext().inputSource.gripSpace
    case 'target-ray-space':
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useXRInputSourceStateContext().inputSource.targetRaySpace
    case 'wrist':
    case 'thumb-metacarpal':
    case 'thumb-phalanx-proximal':
    case 'thumb-phalanx-distal':
    case 'thumb-tip':
    case 'index-finger-metacarpal':
    case 'index-finger-phalanx-proximal':
    case 'index-finger-phalanx-intermediate':
    case 'index-finger-phalanx-distal':
    case 'index-finger-tip':
    case 'middle-finger-metacarpal':
    case 'middle-finger-phalanx-proximal':
    case 'middle-finger-phalanx-intermediate':
    case 'middle-finger-phalanx-distal':
    case 'middle-finger-tip':
    case 'ring-finger-metacarpal':
    case 'ring-finger-phalanx-proximal':
    case 'ring-finger-phalanx-intermediate':
    case 'ring-finger-phalanx-distal':
    case 'ring-finger-tip':
    case 'pinky-finger-metacarpal':
    case 'pinky-finger-phalanx-proximal':
    case 'pinky-finger-phalanx-intermediate':
    case 'pinky-finger-phalanx-distal':
    case 'pinky-finger-tip':
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useXRInputSourceStateContext('hand').inputSource.hand.get(type)
    case 'root':
    case 'hips':
    case 'spine-lower':
    case 'spine-middle':
    case 'spine-upper':
    case 'chest':
    case 'neck':
    case 'head':
    case 'left-shoulder':
    case 'left-scapula':
    case 'left-arm-upper':
    case 'left-arm-lower':
    case 'left-hand-wrist-twist':
    case 'right-shoulder':
    case 'right-scapula':
    case 'right-arm-upper':
    case 'right-arm-lower':
    case 'right-hand-wrist-twist':
    case 'left-hand-palm':
    case 'left-hand-wrist':
    case 'left-hand-thumb-metacarpal':
    case 'left-hand-thumb-phalanx-proximal':
    case 'left-hand-thumb-phalanx-distal':
    case 'left-hand-thumb-tip':
    case 'left-hand-index-metacarpal':
    case 'left-hand-index-phalanx-proximal':
    case 'left-hand-index-phalanx-intermediate':
    case 'left-hand-index-phalanx-distal':
    case 'left-hand-index-tip':
    case 'left-hand-middle-metacarpal':
    case 'left-hand-middle-phalanx-proximal':
    case 'left-hand-middle-phalanx-intermediate':
    case 'left-hand-middle-phalanx-distal':
    case 'left-hand-middle-tip':
    case 'left-hand-ring-metacarpal':
    case 'left-hand-ring-phalanx-proximal':
    case 'left-hand-ring-phalanx-intermediate':
    case 'left-hand-ring-phalanx-distal':
    case 'left-hand-ring-tip':
    case 'left-hand-little-metacarpal':
    case 'left-hand-little-phalanx-proximal':
    case 'left-hand-little-phalanx-intermediate':
    case 'left-hand-little-phalanx-distal':
    case 'left-hand-little-tip':
    case 'right-hand-palm':
    case 'right-hand-wrist':
    case 'right-hand-thumb-metacarpal':
    case 'right-hand-thumb-phalanx-proximal':
    case 'right-hand-thumb-phalanx-distal':
    case 'right-hand-thumb-tip':
    case 'right-hand-index-metacarpal':
    case 'right-hand-index-phalanx-proximal':
    case 'right-hand-index-phalanx-intermediate':
    case 'right-hand-index-phalanx-distal':
    case 'right-hand-index-tip':
    case 'right-hand-middle-metacarpal':
    case 'right-hand-middle-phalanx-proximal':
    case 'right-hand-middle-phalanx-intermediate':
    case 'right-hand-middle-phalanx-distal':
    case 'right-hand-middle-tip':
    case 'right-hand-ring-metacarpal':
    case 'right-hand-ring-phalanx-proximal':
    case 'right-hand-ring-phalanx-intermediate':
    case 'right-hand-ring-phalanx-distal':
    case 'right-hand-ring-tip':
    case 'right-hand-little-metacarpal':
    case 'right-hand-little-phalanx-proximal':
    case 'right-hand-little-phalanx-intermediate':
    case 'right-hand-little-phalanx-distal':
    case 'right-hand-little-tip':
    case 'left-upper-leg':
    case 'left-lower-leg':
    case 'left-foot-ankle-twist':
    case 'left-foot-ankle':
    case 'left-foot-subtalar':
    case 'left-foot-transverse':
    case 'left-foot-ball':
    case 'right-upper-leg':
    case 'right-lower-leg':
    case 'right-foot-ankle-twist':
    case 'right-foot-ankle':
    case 'right-foot-subtalar':
    case 'right-foot-transverse':
    case 'right-foot-ball':
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useXR((state) => state.body)?.get(type)
  }
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
  const session = useXR((xr) => xr.session)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
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
  }, [session, type])
  return referenceSpace
}

/**
 * Hook that returns a function to compute a matrix that contains the transformation of the provided xr space
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
 * Hook that applies the transformation of the provided xr space to the provided object reference
 *
 * @param onFrame Optional callback that gets executed after the matrix of the reference object was updated
 * @requires matrixAutoUpdate to be disabled for the referenced object
 */
export function useApplyXRSpaceMatrix(
  ref: { current?: Group | null },
  space: XRSpace | undefined,
  onFrame?: (state: RootState, delta: number, frame: XRFrame | undefined) => void,
): void {
  const getXRSpaceMatrix = useGetXRSpaceMatrix(space)
  useFrame((state, delta, frame: XRFrame | undefined) => {
    if (ref.current != null) {
      ref.current.visible = ref.current.transformReady = getXRSpaceMatrix?.(ref.current.matrix, frame) ?? false
    }
    onFrame?.(state, delta, frame)
    //makes sure we update the frame before using the space transformation anywhere
  }, -100)
}
