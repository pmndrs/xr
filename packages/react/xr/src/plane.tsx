import { updateXRPlaneGeometry } from '@pmndrs/xr/internals'
import { ThreeElements, useFrame } from '@react-three/fiber'
import { forwardRef, useEffect, useMemo, useState } from 'react'
import { BufferGeometry, Mesh } from 'three'
import { useXR } from './xr.js'

/**
 * Component for rendering a mesh for the XRPlane based on the detected plane geometry
 *
 * @param props
 * Accepts the same props as a ThreeJs [Mesh](https://threejs.org/docs/#api/en/objects/Mesh)
 * @function
 */
export const XRPlaneModel = forwardRef<Mesh, ThreeElements['mesh'] & { plane: XRPlane }>(({ plane, ...rest }, ref) => {
  const geometry = useXRPlaneGeometry(plane)
  return <mesh ref={ref} geometry={geometry} {...rest} />
})

/**
 * hook for getting all dected planes with the provided semantic label
 */
export function useXRPlanes(semanticLabel?: string) {
  const planes = useXR((xr) => xr.detectedPlanes)
  return useMemo(
    () => (semanticLabel == null ? planes : planes.filter((plane) => plane.semanticLabel === semanticLabel)),
    [planes, semanticLabel],
  )
}

/**
 * hook for getting the geometry from the detected plane
 * @param plane the detected plane
 * @param disposeBuffer allows to disable auto disposing the geometry buffer
 */
export function useXRPlaneGeometry(plane: XRPlane, disposeBuffer = true): BufferGeometry {
  const [geometry, setGeometry] = useState<BufferGeometry>(updateXRPlaneGeometry(plane, undefined))
  useFrame(() => setGeometry((geometry) => updateXRPlaneGeometry(plane, geometry)))
  useEffect(() => {
    if (!disposeBuffer) {
      return
    }
    return () => geometry.dispose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geometry])
  return geometry
}
