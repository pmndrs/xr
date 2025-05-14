import { ThreeElements, useThree } from '@react-three/fiber'
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { Group } from 'three'
import { xrSpaceContext } from './contexts.js'
import { useXR } from './xr.js'

export type XROriginProps = ThreeElements['group'] & {
  disabled?: boolean
}

/**
 * Component for setting the origin of the player (their feet)
 *
 * @param props
 * Accepts the same props as a ThreeJs [Group](https://threejs.org/docs/#api/en/objects/Group)
 * @function
 */
export const XROrigin = forwardRef<Group, XROriginProps>(({ children, disabled, ...props }, ref) => {
  const xrCamera = useThree((s) => s.gl.xr.getCamera())
  const internalRef = useRef<Group>(null)
  const referenceSpace = useXR((xr) => xr.originReferenceSpace)

  useImperativeHandle(ref, () => internalRef.current!, [])

  useEffect(() => {
    const group = internalRef.current
    if (!group || disabled) {
      return
    }

    group.add(xrCamera)

    return () => void group.remove(xrCamera)
  }, [disabled, xrCamera])

  return (
    <group ref={internalRef} {...props}>
      <xrSpaceContext.Provider value={referenceSpace}>{children}</xrSpaceContext.Provider>
    </group>
  )
})
