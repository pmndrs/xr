import { updateXRMeshGeometry } from '@pmndrs/xr/internals'
import { ThreeElements, useFrame } from '@react-three/fiber'
import { forwardRef, useEffect, useMemo, useState } from 'react'
import { BufferGeometry, Mesh } from 'three'
import { useXR } from './xr.js'

/**
 * Component for rendering a mesh for the XRMesh based on the detected mesh geometry
 *
 * @param props
 * Accepts the same props as a ThreeJs [Mesh](https://threejs.org/docs/#api/en/objects/Mesh)
 * @function
 */
export const XRMeshModel = forwardRef<Mesh, ThreeElements['mesh'] & { mesh: XRMesh }>(({ mesh, ...rest }, ref) => {
  const geometry = useXRMeshGeometry(mesh)
  return <mesh ref={ref} geometry={geometry} {...rest} />
})

/**
 * Hook for getting all detected meshes with the provided semantic label
 */
export function useXRMeshes(semanticLabel?: string) {
  const meshes = useXR((xr) => xr.detectedMeshes)
  return useMemo(
    () => (semanticLabel == null ? meshes : meshes.filter((mesh) => mesh.semanticLabel === semanticLabel)),
    [meshes, semanticLabel],
  )
}

/**
 * Hook for getting the geometry from the detected mesh
 *
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
