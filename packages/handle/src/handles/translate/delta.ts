import {
  BufferGeometry,
  Float32BufferAttribute,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  OctahedronGeometry,
  Quaternion,
} from 'three'
import { HandlesContext } from '../context.js'
import { handleXRayMaterialProperties } from '../material.js'

const quaternionHelper = new Quaternion()

export function setupTranslateHandleDelta(group: Object3D, context: HandlesContext) {
  const startMesh = new Mesh(new OctahedronGeometry(0.01, 2), new MeshBasicMaterial(handleXRayMaterialProperties))
  startMesh.renderOrder = Infinity
  startMesh.visible = false
  group.add(startMesh)

  const endMesh = new Mesh(new OctahedronGeometry(0.01, 2), new MeshBasicMaterial(handleXRayMaterialProperties))
  endMesh.renderOrder = Infinity
  endMesh.visible = false
  group.add(endMesh)

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 1, 1, 1], 3))
  const lineSegments = new LineSegments(geometry, new LineBasicMaterial(handleXRayMaterialProperties))
  lineSegments.renderOrder = Infinity
  lineSegments.visible = false
  group.add(lineSegments)

  const unsubscribe = context.subscribeApply((_, state) => {
    endMesh.position.set(0, 0, 0)
    startMesh.position.copy(state.initial.position).sub(state.current.position)
    const target = context.getTarget()
    if (target != null) {
      quaternionHelper.copy(target.quaternion).invert()
      startMesh.position.applyQuaternion(quaternionHelper)
    }
    lineSegments.position.set(0, 0, 0)
    lineSegments.scale.copy(startMesh.position)

    //show/hide objects
    startMesh.visible = !state.last
    lineSegments.visible = !state.last
    endMesh.visible = !state.last
  })

  return () => {
    startMesh.geometry.dispose()
    startMesh.material.dispose()
    endMesh.geometry.dispose()
    endMesh.material.dispose()
    lineSegments.geometry.dispose()
    lineSegments.material.dispose()
    group.remove(startMesh)
    group.remove(endMesh)
    group.remove(lineSegments)
    unsubscribe()
  }
}
