import * as React from 'react'
import * as THREE from 'three'
import { XRControllerModelFactory } from 'three-stdlib'
import { useFrame, Object3DNode, extend, createPortal } from '@react-three/fiber'
import { useXR } from './XR'
import { XRController } from './XRController'

export interface RayProps extends Partial<JSX.IntrinsicElements['object3D']> {
  /** The XRController to attach the ray to */
  target: XRController
  /** Whether to hide the ray on controller blur. Default is `false` */
  hideOnBlur?: boolean
}
export const Ray = React.forwardRef<THREE.Line, RayProps>(function Ray({ target, hideOnBlur = false, ...props }, forwardedRef) {
  const hoverState = useXR((state) => state.hoverState)
  const ray = React.useRef<THREE.Line>(null!)
  const rayGeometry = React.useMemo(
    () => new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]),
    []
  )
  React.useImperativeHandle(forwardedRef, () => ray.current)

  // Show ray line when hovering objects
  useFrame(() => {
    let rayLength = 1

    const intersection: THREE.Intersection = hoverState[target.inputSource.handedness].values().next().value
    if (intersection && target.inputSource.handedness !== 'none') {
      rayLength = intersection.distance
      if (hideOnBlur) ray.current.visible = false
    } else if (hideOnBlur) {
      ray.current.visible = true
    }

    // Tiny offset to clip ray on AR devices
    // that don't have handedness set to 'none'
    const offset = -0.01
    ray.current.scale.z = rayLength + offset
  })

  // @ts-ignore TS assumes that JS is for the web, and overrides line w/SVG props
  return <line ref={ray} geometry={rayGeometry} material-opacity={0.8} material-transparent={true} {...props} />
})

const modelFactory = new XRControllerModelFactory()

class ControllerModel extends THREE.Group {
  constructor(target: XRController) {
    super()
    this.add(modelFactory.createControllerModel(target.controller))
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      controllerModel: Object3DNode<ControllerModel, typeof ControllerModel>
    }
  }
}

export interface ControllersProps {
  /** Optional material props to pass to controllers' ray indicators */
  rayMaterial?: JSX.IntrinsicElements['meshBasicMaterial']
  /** Whether to hide controllers' rays on blur. Default is `false` */
  hideRaysOnBlur?: boolean
}
export function Controllers({ rayMaterial = {}, hideRaysOnBlur = false }: ControllersProps) {
  const controllers = useXR((state) => state.controllers)
  const isHandTracking = useXR((state) => state.isHandTracking)
  const rayMaterialProps = React.useMemo(
    () =>
      Object.entries(rayMaterial).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [`material-${key}`]: value
        }),
        {}
      ),
    [JSON.stringify(rayMaterial)] // eslint-disable-line react-hooks/exhaustive-deps
  )
  React.useMemo(() => extend({ ControllerModel }), [])

  // Send fake connected event (no-op) so models start loading
  React.useEffect(() => {
    for (const target of controllers) {
      target.controller.dispatchEvent({ type: 'connected', data: target.inputSource, fake: true })
    }
  }, [controllers])

  return (
    <>
      {controllers.map((target, i) => (
        <React.Fragment key={i}>
          {createPortal(<controllerModel args={[target]} />, target.grip)}
          {createPortal(
            <Ray visible={!isHandTracking} hideOnBlur={hideRaysOnBlur} target={target} {...rayMaterialProps} />,
            target.controller
          )}
        </React.Fragment>
      ))}
    </>
  )
}
