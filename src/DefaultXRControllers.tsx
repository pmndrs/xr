import * as React from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useXR } from './XR'
import { XRControllerModelFactory } from './webxr/XRControllerModelFactory'
import { XRController } from 'XRController'

const modelFactory = new XRControllerModelFactory()
const modelCache = new WeakMap<THREE.Group, any>()
const rays = new Map<XRController, THREE.Mesh>()

export function DefaultXRControllers({ rayMaterial = {} }: { rayMaterial?: THREE.MeshBasicMaterialParameters }) {
  const scene = useThree((state) => state.scene)
  const controllers = useXR((state) => state.controllers)
  const hoverState = useXR((state) => state.hoverState)

  // Show ray line when hovering objects
  useFrame(() => {
    controllers.forEach((target) => {
      const ray = rays.get(target)
      if (!ray) return

      const intersection: THREE.Intersection = hoverState[target.inputSource.handedness].values().next().value
      if (!intersection || target.inputSource.handedness === 'none') return (ray.visible = false)

      const rayLength = intersection.distance

      // Tiny offset to clip ray on AR devices
      // that don't have handedness set to 'none'
      const offset = -0.01
      ray.visible = true
      ray.scale.y = rayLength + offset
      ray.position.z = -rayLength / 2 - offset
    })
  })

  React.useEffect(() => {
    const cleanups: any[] = []

    controllers.forEach((target) => {
      // Attach 3D model of the controller
      let model: THREE.Object3D
      if (modelCache.has(target.controller)) {
        model = modelCache.get(target.controller)
      } else {
        model = modelFactory.createControllerModel(target.controller) as any
        target.controller.dispatchEvent({ type: 'connected', data: target.inputSource, fake: true })
        modelCache.set(target.controller, model)
      }
      target.grip.add(model)

      // Add Ray line (used for hovering)
      const ray = new THREE.Mesh()
      ray.rotation.set(Math.PI / 2, 0, 0)
      ray.material = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffffff), opacity: 0.8, transparent: true, ...rayMaterial })
      ray.geometry = new THREE.BoxBufferGeometry(0.002, 1, 0.002)

      rays.set(target, ray)
      target.controller.add(ray)

      cleanups.push(() => {
        target.grip.remove(model)
        target.controller.remove(ray)
        rays.delete(target)
      })
    })

    return () => {
      cleanups.forEach((fn) => fn())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controllers, scene, rays, JSON.stringify(rayMaterial)])

  return null
}
