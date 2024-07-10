import { forwardRef, useContext, useEffect, useMemo, useState } from 'react'
import { MeshProps, useFrame } from '@react-three/fiber'
import { BufferGeometry, Mesh } from 'three'
import { updateXRMeshGeometry } from '@pmndrs/xr/internals'
import { xrMeshContext } from './contexts.js'
import { useXR } from './xr.js'

/**
 * component for rendering a mesh for the XRMesh based on the detected mesh geometry
 */
export const XRMeshModel = forwardRef<Mesh, MeshProps>((props, ref) => {
  const mesh = useXRMesh()
  const geometry = useXRMeshGeometry(mesh)
  return <mesh ref={ref} geometry={geometry} {...props} />
})

/**
 * hook for getting the detected mesh in the current context
 */
export function useXRMesh(): XRMesh {
  const context = useContext(xrMeshContext)
  if (context == null) {
    throw new Error(`useXRMesh can only be used inside XRMesh or ForEachXRMesh`)
  }
  return context
}

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
