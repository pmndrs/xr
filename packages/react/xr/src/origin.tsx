import { GroupProps, useThree } from '@react-three/fiber'
import { forwardRef } from 'react'
import { Group } from 'three'
import { xrReferenceSpaceContext } from './contexts.js'
import { useXR } from './xr.js'

/**
 * component for setting the origin of the player (their feet)
 */
export const XROrigin = forwardRef<Group, GroupProps>(({ children, ...props }, ref) => {
  const xrCamera = useThree((s) => s.gl.xr.getCamera())
  const referenceSpace = useXR((xr) => xr.originReferenceSpace)
  if (referenceSpace == null) {
    return null
  }
  return (
    <group ref={ref} {...props}>
      <primitive object={xrCamera} />
      <xrReferenceSpaceContext.Provider value={referenceSpace}>{children}</xrReferenceSpaceContext.Provider>
    </group>
  )
})
