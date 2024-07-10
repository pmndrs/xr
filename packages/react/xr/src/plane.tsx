import { forwardRef, useContext, useEffect, useMemo, useState } from 'react'
import { MeshProps, useFrame } from '@react-three/fiber'
import { BufferGeometry, Mesh } from 'three'
import { updateXRPlaneGeometry } from '@pmndrs/xr/internals'
import { xrPlaneContext } from './contexts.js'
import { useXR } from './xr.js'

/**
 * component for rendering a mesh for the XRPlane based on the detected plane geometry
 */
export const XRPlaneModel = forwardRef<Mesh, MeshProps>((props, ref) => {
  const plane = useXRPlane()
  const geometry = useXRPlaneGeometry(plane)
  return <mesh ref={ref} geometry={geometry} {...props} />
})

/**
 * hook for getting the detected plane in the current context
 */
export function useXRPlane(): XRPlane {
  const context = useContext(xrPlaneContext)
  if (context == null) {
    throw new Error(`useXRPlane can only be used inside XRPlane or ForEachXRPlane`)
  }
  return context
}

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
