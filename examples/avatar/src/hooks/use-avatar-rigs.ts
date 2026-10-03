import { useLoader } from '@react-three/fiber'
import { useMemo } from 'react'
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { createMixamoRig, mixamoGLTFLoader } from '../loaders/mixamo.js'
import { getVRM, vrmLoader } from '../loaders/vrm.js'
import { HumanoidRig } from '../rig/humanoid-rig.js'

export type AvatarRigs = [self: HumanoidRig, mirror: HumanoidRig]

export function useVRMRigs(url: string): AvatarRigs {
  const [selfGltf, mirrorGltf] = useLoader(vrmLoader, [url, url]) as Array<GLTF>
  return [getVRM(selfGltf), getVRM(mirrorGltf)]
}

export function useMixamoRigs(url: string): AvatarRigs {
  const { scene } = useLoader(mixamoGLTFLoader, url)
  return useMemo(() => [createMixamoRig(scene), createMixamoRig(scene)], [scene])
}
