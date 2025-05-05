import { ThreeElements, useThree } from '@react-three/fiber'
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { Group } from 'three'
import { xrSpaceContext } from './contexts.js'
import { useXR } from './xr.js'

/**
 * Component for setting the origin of the player (their feet)
 * @param props
 * * Accepts the same props as a ThreeJs [Group](https://threejs.org/docs/#api/en/objects/Group)
 * @function
 */
export const XROrigin = forwardRef<Group, ThreeElements['group']>(({ children, ...props }, ref) => {
  const xrCamera = useThree((s) => s.gl.xr.getCamera())
  const internalRef = useRef<Group>(null)
  useImperativeHandle(ref, () => internalRef.current!, [])
  const referenceSpace = useXR((xr) => xr.originReferenceSpace)
  useEffect(() => {
    const group = internalRef.current
    if (group == null) {
      return
    }
    group.add(xrCamera)
    return () => void group.remove(xrCamera)
  }, [xrCamera])
  return (
    <group ref={internalRef} {...props}>
      {referenceSpace != null && <xrSpaceContext.Provider value={referenceSpace}>{children}</xrSpaceContext.Provider>}
    </group>
  )
})
