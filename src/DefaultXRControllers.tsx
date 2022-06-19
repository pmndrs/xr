import * as React from 'react'
import * as THREE from 'three'
import { XRControllerModelFactory, XRControllerModel } from 'three-stdlib'
import { useFrame, createPortal } from '@react-three/fiber'
import { useXR } from './XR'
import { XRController } from './XRController'

const modelFactory = new XRControllerModelFactory()

export interface ControllerModelProps extends Partial<JSX.IntrinsicElements['object3D']> {
  target: XRController
}
export const ControllerModel = React.forwardRef<XRControllerModel, ControllerModelProps>(function ControllerModel(
  { target, ...props },
  forwardedRef
) {
  const model = React.useMemo(() => modelFactory.createControllerModel(target.controller), [target.controller])

  // Dispatch fake connected event to start loading model on mount
  React.useEffect(
    () => void target.controller.dispatchEvent({ type: 'connected', data: target.inputSource, fake: true }),
    [target.controller, target.inputSource]
  )

  return <primitive {...props} ref={forwardedRef} object={model} />
})

export interface RayProps extends Partial<JSX.IntrinsicElements['mesh']> {
  target: XRController
}
export const Ray = React.forwardRef<THREE.Mesh, RayProps>(function Ray({ target, ...props }, forwardedRef) {
  const ray = React.useRef<THREE.Mesh>(null!)
  const hoverState = useXR((state) => state.hoverState)
  React.useImperativeHandle(forwardedRef, () => ray.current)

  // Show ray line when hovering objects
  useFrame(() => {
    if (!ray.current) return

    const intersection: THREE.Intersection = hoverState[target.inputSource.handedness].values().next().value
    if (!intersection || target.inputSource.handedness === 'none') return (ray.current.visible = false)

    const rayLength = intersection.distance

    // Tiny offset to clip ray on AR devices
    // that don't have handedness set to 'none'
    const offset = -0.01
    ray.current.visible = true
    ray.current.scale.y = rayLength + offset
    ray.current.position.z = -rayLength / 2 - offset
  })

  return (
    <mesh ref={ray} {...props}>
      <boxGeometry args={[0.002, 1, 0.002]} />
      <meshBasicMaterial opacity={0.8} transparent />
    </mesh>
  )
})

export interface DefaultXRControllersProps extends Partial<JSX.IntrinsicElements['group']> {
  /** Optional material props to pass to controllers' ray indicators */
  rayMaterial?: JSX.IntrinsicElements['meshBasicMaterial']
}
export const DefaultXRControllers = React.forwardRef<THREE.Group, DefaultXRControllersProps>(function DefaultXRControllers(
  { rayMaterial = {}, ...props },
  forwardedRef
) {
  const controllers = useXR((state) => state.controllers)
  const rayMaterialProps = React.useMemo(
    () =>
      Object.entries(rayMaterial).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [`material-${key}`]: value
        }),
        {}
      ),
    [rayMaterial]
  )

  return (
    <group {...props} ref={forwardedRef}>
      {controllers.map((target, i) => (
        <group key={`controller-${i}`}>
          {createPortal(<ControllerModel target={target} />, target.grip)}
          {createPortal(<Ray target={target} {...rayMaterialProps} />, target.controller)}
        </group>
      ))}
    </group>
  )
})
