import { useFrame } from '@react-three/fiber'
import { useXR } from '@react-three/xr'
import { useMemo } from 'react'
import { BodyRetargeter } from '../retarget/body-retargeter.js'
import { HumanoidRig } from '../rig/humanoid-rig.js'

export function useBodyTracking(selfRig: HumanoidRig, mirrorRig: HumanoidRig) {
  const retargeter = useMemo(() => new BodyRetargeter(mirrorRig), [mirrorRig])
  const referenceSpace = useXR((xr) => xr.originReferenceSpace)
  selfRig.hideHead = true

  useFrame((_, delta, frame: XRFrame | undefined) => {
    const tracked = frame != null && referenceSpace != null && retargeter.update(frame, referenceSpace)
    selfRig.scene.visible = tracked
    if (tracked) {
      retargeter.apply(selfRig)
      retargeter.apply(mirrorRig)
    } else {
      mirrorRig.resetPose()
      mirrorRig.scene.position.set(0, 0, 0)
      mirrorRig.scene.scale.setScalar(1)
      mirrorRig.scene.rotation.y = mirrorRig.facingYaw
    }
    selfRig.update(delta)
    mirrorRig.update(delta)
  })
}
