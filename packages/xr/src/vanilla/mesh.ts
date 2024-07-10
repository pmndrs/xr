import { Mesh } from 'three'
import { updateXRMeshGeometry } from '../mesh.js'

export class XRMeshModel extends Mesh {
  constructor(mesh: XRMesh) {
    super(updateXRMeshGeometry(mesh, undefined))
    this.onBeforeRender = () => {
      const newGeometry = updateXRMeshGeometry(mesh, this.geometry)
      if (newGeometry != this.geometry) {
        this.geometry.dispose()
      }
      this.geometry = newGeometry
    }
  }
}
