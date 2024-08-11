import { Group, Material, Mesh, Object3D } from 'three'
import { DefaultAssetBasePath, DefaultGltfLoader } from '../index.js'
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js'

//from https://github.com/pmndrs/three-stdlib/blob/main/src/webxr/XRHandMeshModel.ts

const DefaultDefaultXRHandProfileId = 'generic-hand'

export type XRHandLoaderOptions = {
  /**
   * where to load the hand models from
   * @default 'https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0/dist/profiles/'
   */
  baseAssetPath?: string
  /**
   * profile id that is used if no matching profile id is found
   * @default 'generic-hand'
   */
  defaultXRHandProfileId?: string
}

export function getXRHandAssetPath(handedness: XRHandedness, options: XRHandLoaderOptions | undefined) {
  const baseAssetPath = options?.baseAssetPath ?? DefaultAssetBasePath
  const defaultProfileId = options?.defaultXRHandProfileId ?? DefaultDefaultXRHandProfileId
  return new URL(`${defaultProfileId}/${handedness}.glb`, baseAssetPath).href
}

export async function loadXRHandModel(assetPath: string, loader: GLTFLoader = DefaultGltfLoader) {
  const gltf = await loader.loadAsync(assetPath)
  return cloneXRHandGltf(gltf)
}

export function cloneXRHandGltf({ scene }: GLTF) {
  const result = cloneSkeleton(scene)
  const mesh = result.getObjectByProperty('type', 'SkinnedMesh')
  if (mesh == null) {
    throw new Error(`missing SkinnedMesh in loaded XRHand model`)
  }
  mesh.frustumCulled = false
  return result
}

export type XRHandModelOptions = {
  colorWrite?: boolean
  renderOrder?: number
}

export function configureXRHandModel(model: Object3D, options?: XRHandModelOptions) {
  model.renderOrder = options?.renderOrder ?? 0
  model.traverse((child) => {
    if (child instanceof Mesh && child.material instanceof Material) {
      child.material.colorWrite = options?.colorWrite ?? true
    }
  })
}
