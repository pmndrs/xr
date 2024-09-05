import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { XRControllerLayout } from './layout.js'
import { DefaultGltfLoader, XRControllerGamepadComponentId } from '../index.js'
import { Group, Material, Mesh, Object3D } from 'three'

export async function loadXRControllerModel(
  layout: XRControllerLayout | undefined,
  loader: GLTFLoader = DefaultGltfLoader,
) {
  if (layout == null) {
    //promise that never resolved
    return new Promise<Group>(() => {})
  }
  const { scene } = await loader.loadAsync(layout.assetPath)
  return scene.clone(true)
}

/**
 * function for getting the object of a specific component from the xr controller model
 */
export function getXRControllerComponentObject(
  model: Object3D,
  layout: XRControllerLayout,
  componentId: XRControllerGamepadComponentId,
) {
  const component = layout.components[componentId]
  const firstVisualResponse = component.visualResponses[Object.keys(component.visualResponses)[0]]
  if (firstVisualResponse == null) {
    return undefined
  }
  return model.getObjectByName(firstVisualResponse.valueNodeName)
}

export type XRControllerModelOptions = {
  /**
   * allows to configure whether the controller is rendered to the color buffer
   * can be used to show the real controller in AR passthrough mode
   */
  colorWrite?: boolean
  /**
   * allows to configure the render order of the controller model
   * @default undefined
   */
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
