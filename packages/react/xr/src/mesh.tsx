import { forwardRef, useEffect, useMemo, useState } from 'react'
import { MeshProps, useFrame } from '@react-three/fiber'
import { BufferGeometry, Mesh } from 'three'
import { updateXRMeshGeometry } from '@pmndrs/xr/internals'
import { useXR } from './xr.js'

/**
 * component for rendering a mesh for the XRMesh based on the detected mesh geometry
 */
export const XRMeshModel = forwardRef<Mesh, MeshProps & { mesh: XRMesh }>(({ mesh, ...rest }, ref) => {
  const geometry = useXRMeshGeometry(mesh)
  return <mesh ref={ref} geometry={geometry} {...rest} />
})

/**
 * hook for getting all dected meshes with the provided semantic label
 */
export function useXRMeshes(semanticLabel?: string) {
  const meshes = useXR((xr) => xr.detectedMeshes)
  return useMemo(
    () => (semanticLabel == null ? meshes : meshes.filter((mesh) => mesh.semanticLabel === semanticLabel)),
    [meshes, semanticLabel],
  )
}

/**
 * hook for getting the geometry from the detected mesh
 * @param mesh the detected mesh
 * @param disposeBuffer allows to disable auto disposing the geometry buffer
 */
export function useXRMeshGeometry(mesh: XRMesh, disposeBuffer = true): BufferGeometry {
  const [geometry, setGeometry] = useState<BufferGeometry>(updateXRMeshGeometry(mesh, undefined))
  useFrame(() => setGeometry((geometry) => updateXRMeshGeometry(mesh, geometry)))
  useEffect(() => {
    if (!disposeBuffer) {
      return
    }
    return () => geometry.dispose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geometry])
  return geometry
}
