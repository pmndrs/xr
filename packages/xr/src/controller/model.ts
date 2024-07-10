import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { XRControllerLayout } from './layout.js'
import { DefaultGltfLoader } from '../index.js'
import { Material, Mesh, Object3D } from 'three'

export async function loadXRControllerModel(layout: XRControllerLayout, loader: GLTFLoader = DefaultGltfLoader) {
  const { scene } = await loader.loadAsync(layout.assetPath)
  return scene.clone(true)
}

export type XRControllerModelOptions = {
  colorWrite?: boolean
  renderOrder?: number
}

export function configureXRControllerModel(model: Object3D, options?: XRControllerModelOptions) {
  model.renderOrder = options?.renderOrder ?? 0
  model.traverse((child) => {
    if (child instanceof Mesh && child.material instanceof Material) {
      child.material.colorWrite = options?.colorWrite ?? true
    }
  })
}
