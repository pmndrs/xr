import { GroupProps, useThree } from '@react-three/fiber'
import { forwardRef, useCallback } from 'react'
import { Group } from 'three'
import { xrReferenceSpaceContext } from './contexts.js'

/**
 * component for setting the origin of the player (their feet)
 */
export const XROrigin = forwardRef<Group, GroupProps>(({ children, ...props }, ref) => {
  const xrCamera = useThree((s) => s.gl.xr.getCamera())
  const xr = useThree((s) => s.gl.xr)
  const referenceSpace = useCallback(() => xr.getReferenceSpace(), [xr])
  return (
    <group ref={ref} {...props}>
      <primitive object={xrCamera} />
      <xrReferenceSpaceContext.Provider value={referenceSpace}>{children}</xrReferenceSpaceContext.Provider>
    </group>
  )
})
