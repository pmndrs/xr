import { useXR } from './XR'
import React, { useEffect } from 'react'
import { Color, Mesh, MeshBasicMaterial, BoxBufferGeometry, MeshBasicMaterialParameters, Group, Object3D, Intersection } from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { XRControllerModelFactory } from './webxr/XRControllerModelFactory'

const modelFactory = new XRControllerModelFactory()
const modelCache = new WeakMap<Group, any>()
export function DefaultXRControllers({ rayMaterial = {} }: { rayMaterial?: MeshBasicMaterialParameters }) {
  const { scene } = useThree()
  const { controllers, hoverState } = useXR()
  const [rays] = React.useState(new Map<number, Mesh>())

  // Show ray line when hovering objects
  useFrame(() => {
    controllers.forEach((it) => {
      const ray = rays.get(it.controller.id)
      if (!ray) return

      const intersection: Intersection = hoverState[it.inputSource.handedness].values().next().value
      if (!intersection || it.inputSource.handedness === 'none') {
        ray.visible = false
        return
      }

      const rayLength = intersection.distance

      // Tiny offset to clip ray on AR devices
      // that don't have handedness set to 'none'
      const offset = -0.01
      ray.visible = true
      ray.scale.y = rayLength + offset
      ray.position.z = -rayLength / 2 - offset
    })
  })

  useEffect(() => {
    const cleanups: any[] = []

    controllers.forEach(({ controller, grip, inputSource }) => {
      // Attach 3D model of the controller
      let model: Object3D
      if (modelCache.has(controller)) {
        model = modelCache.get(controller)
      } else {
        model = modelFactory.createControllerModel(controller) as any
        controller.dispatchEvent({ type: 'connected', data: inputSource, fake: true })
        modelCache.set(controller, model)
      }
      grip.add(model)

      // Add Ray line (used for hovering)
      const ray = new Mesh()
      ray.rotation.set(Math.PI / 2, 0, 0)
      ray.material = new MeshBasicMaterial({ color: new Color(0xffffff), opacity: 0.8, transparent: true, ...rayMaterial })
      ray.geometry = new BoxBufferGeometry(0.002, 1, 0.002)

      rays.set(controller.id, ray)
      controller.add(ray)

      cleanups.push(() => {
        grip.remove(model)
        controller.remove(ray)
        rays.delete(controller.id)
      })
    })

    return () => {
      cleanups.forEach((fn) => fn())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controllers, scene, rays, JSON.stringify(rayMaterial)])

  return null
}
