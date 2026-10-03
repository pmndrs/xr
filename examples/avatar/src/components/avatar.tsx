import { Mirror } from './mirror.js'
import { AvatarRigs, useMixamoRigs, useVRMRigs } from '../hooks/use-avatar-rigs.js'
import { useBodyTracking } from '../hooks/use-body-tracking.js'

export function VRMAvatar({ url }: { url: string }) {
  return <TrackedAvatar rigs={useVRMRigs(url)} />
}

export function MixamoAvatar({ url }: { url: string }) {
  return <TrackedAvatar rigs={useMixamoRigs(url)} />
}

function TrackedAvatar({ rigs: [selfRig, mirrorRig] }: { rigs: AvatarRigs }) {
  useBodyTracking(selfRig, mirrorRig)
  return (
    <>
      <primitive object={selfRig.scene} />
      <Mirror>
        <primitive object={mirrorRig.scene} />
      </Mirror>
    </>
  )
}
